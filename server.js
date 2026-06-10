const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const INPUT_DIR = path.join(DATA_DIR, "input");
const REPORTS_DIR = path.join(DATA_DIR, "reports");
const PLACES_PATH = path.join(DATA_DIR, "places", "places.json");
const SERVICE_DIR = path.join(DATA_DIR, "service");
const RUNS_DIR = path.join(SERVICE_DIR, "runs");
const PROFILES_PATH = path.join(SERVICE_DIR, "profiles.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const ENV_PATH = path.join(ROOT, ".env");

loadEnv(ENV_PATH);

const PORT = Number(process.env.PORT || 7860);
const PYTHON_BIN = process.env.PYTHON_BIN || "python";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseEnvEntry(line) {
  const trimmed = String(line || "").trim();
  if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) return null;
  const index = trimmed.indexOf("=");
  const key = trimmed.slice(0, index).trim();
  const rawValue = trimmed.slice(index + 1).trim();
  return { key, rawValue };
}

function decodeEnvValue(rawValue) {
  const value = String(rawValue || "").trim();
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function encodeEnvValue(value) {
  const clean = String(value ?? "").replace(/\r?\n/g, " ").trim();
  if (!clean) return "";
  return /\s|#|["'`]/.test(clean) ? JSON.stringify(clean) : clean;
}

async function readOpenRouterSettings() {
  const settings = {
    openrouter_api_key: String(process.env.OPENROUTER_API_KEY || ""),
    openrouter_model: String(process.env.OPENROUTER_MODEL || ""),
  };

  try {
    const body = await fsp.readFile(ENV_PATH, "utf8");
    for (const line of body.split(/\r?\n/)) {
      const entry = parseEnvEntry(line);
      if (!entry) continue;
      if (entry.key === "OPENROUTER_API_KEY") settings.openrouter_api_key = decodeEnvValue(entry.rawValue);
      if (entry.key === "OPENROUTER_MODEL") settings.openrouter_model = decodeEnvValue(entry.rawValue);
    }
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  return settings;
}

async function saveOpenRouterSettings(input) {
  const apiKey = String(input.openrouter_api_key ?? "").replace(/\r?\n/g, " ").trim();
  const model = String(input.openrouter_model ?? "").replace(/\r?\n/g, " ").trim();
  const updates = new Map([
    ["OPENROUTER_API_KEY", apiKey],
    ["OPENROUTER_MODEL", model],
  ]);

  if (apiKey.length > 8000 || model.length > 8000) {
    throw new ApiError(400, "OPENROUTER settings are too long.");
  }

  let lines = [];
  let newline = "\n";
  try {
    const body = await fsp.readFile(ENV_PATH, "utf8");
    newline = body.includes("\r\n") ? "\r\n" : "\n";
    lines = body.split(/\r?\n/);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }

  const seen = new Set();
  const nextLines = lines.map((line) => {
    const entry = parseEnvEntry(line);
    if (!entry || !updates.has(entry.key)) return line;
    seen.add(entry.key);
    return `${entry.key}=${encodeEnvValue(updates.get(entry.key))}`;
  });

  for (const [key, value] of updates.entries()) {
    if (!seen.has(key)) nextLines.push(`${key}=${encodeEnvValue(value)}`);
  }

  const serialized = `${nextLines.filter((line, idx, arr) => !(idx === arr.length - 1 && line === "")).join(newline)}${newline}`;
  await fsp.writeFile(ENV_PATH, serialized, "utf8");

  process.env.OPENROUTER_API_KEY = apiKey;
  process.env.OPENROUTER_MODEL = model;

  return {
    openrouter_api_key: apiKey,
    openrouter_model: model,
  };
}

async function ensureStorage() {
  await fsp.mkdir(INPUT_DIR, { recursive: true });
  await fsp.mkdir(REPORTS_DIR, { recursive: true });
  await fsp.mkdir(RUNS_DIR, { recursive: true });
  if (!fs.existsSync(PROFILES_PATH)) {
    await writeJson(PROFILES_PATH, { profiles: [] });
  }
}

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await fsp.readFile(filePath, "utf8"));
  } catch (error) {
    if (fallback !== null && error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(filePath, value) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendText(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, { "content-type": contentType, "cache-control": "no-store" });
  res.end(body);
}

async function parseBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > 2_000_000) throw new ApiError(413, "Request body is too large.");
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

class ApiError extends Error {
  constructor(status, message, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function normalizeKey(city, country) {
  return `${String(city || "").trim().toLowerCase()},${String(country || "").trim().toLowerCase()}`;
}

function validateBirthInput(input) {
  const clean = {
    name: String(input.name || "").trim() || null,
    birth_date: String(input.birth_date || "").trim(),
    birth_time: String(input.birth_time || "").trim(),
    city: String(input.city || "").trim(),
    country: String(input.country || "").trim(),
    language: ["ru", "en"].includes(input.language) ? input.language : "ru",
    settings: {
      ayanamsa: String(input.settings?.ayanamsa || "lahiri"),
      zodiac: String(input.settings?.zodiac || "sidereal"),
      house_system: String(input.settings?.house_system || "whole_sign"),
      dasha_system: String(input.settings?.dasha_system || "vimshottari_from_moon"),
      include_navamsa: Boolean(input.settings?.include_navamsa ?? true),
      include_aspects: Boolean(input.settings?.include_aspects ?? true),
      include_interpretation: Boolean(input.settings?.include_interpretation ?? true),
      include_clickable_keys: Boolean(input.settings?.include_clickable_keys ?? true),
      enable_node_aspects: Boolean(input.settings?.enable_node_aspects ?? false),
    },
  };

  if (!clean.birth_date || !/^\d{4}-\d{2}-\d{2}$/.test(clean.birth_date)) {
    throw new ApiError(400, "Birth date must use YYYY-MM-DD.");
  }
  if (!clean.birth_time || !/^\d{2}:\d{2}$/.test(clean.birth_time)) {
    throw new ApiError(400, "Birth time must use HH:MM.");
  }
  if (!clean.city || !clean.country) {
    throw new ApiError(400, "City and country are required.");
  }
  return clean;
}

async function maybeUpsertPlace(birth, place) {
  if (!place) return null;
  const lat = Number(place.latitude);
  const lon = Number(place.longitude);
  const timezone = String(place.timezone || "").trim();
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !timezone) return null;

  const places = await readJson(PLACES_PATH, {});
  const key = normalizeKey(birth.city, birth.country);
  const entry = {
    name: String(place.display_name || `${birth.city}, ${birth.country}`).trim(),
    lat,
    lon,
    timezone,
  };
  places[key] = entry;
  await writeJson(PLACES_PATH, places);
  return { key, ...entry };
}

async function listPlaces(query = "") {
  const places = await readJson(PLACES_PATH, {});
  const q = query.trim().toLowerCase();
  return Object.entries(places)
    .map(([key, value]) => ({
      key,
      name: value.name,
      city: key.split(",")[0],
      country: key.split(",").slice(1).join(","),
      latitude: value.lat,
      longitude: value.lon,
      timezone: value.timezone,
    }))
    .filter((place) => !q || place.key.includes(q) || String(place.name).toLowerCase().includes(q))
    .slice(0, 50);
}

async function loadProfiles() {
  const data = await readJson(PROFILES_PATH, { profiles: [] });
  if (!Array.isArray(data.profiles)) data.profiles = [];
  return data;
}

async function saveProfile(birth, place, existingId = null) {
  const data = await loadProfiles();
  const now = new Date().toISOString();
  let profile = existingId ? data.profiles.find((item) => item.id === existingId) : null;
  if (!profile) {
    profile = {
      id: existingId || crypto.randomUUID(),
      created_at: now,
      reports: [],
    };
    data.profiles.unshift(profile);
  }
  profile.name = birth.name || "Unnamed profile";
  profile.birth = birth;
  profile.place = place || profile.place || null;
  profile.updated_at = now;
  await writeJson(PROFILES_PATH, data);
  return profile;
}

async function attachRunToProfile(profileId, run) {
  const data = await loadProfiles();
  const profile = data.profiles.find((item) => item.id === profileId);
  if (!profile) return;
  profile.last_run_id = run.id;
  profile.last_summary = run.summary;
  profile.updated_at = new Date().toISOString();
  profile.reports = Array.isArray(profile.reports) ? profile.reports : [];
  profile.reports.unshift({
    id: run.id,
    created_at: run.created_at,
    summary: run.summary,
    files: run.files,
  });
  profile.reports = profile.reports.slice(0, 50);
  await writeJson(PROFILES_PATH, data);
}

async function appendChatMessages(profileId, messages) {
  if (!profileId) return [];
  const data = await loadProfiles();
  const profile = data.profiles.find((item) => item.id === profileId);
  if (!profile) return [];
  profile.chat_history = Array.isArray(profile.chat_history) ? profile.chat_history : [];
  profile.chat_history.push(...messages);
  profile.chat_history = profile.chat_history.slice(-200);
  profile.updated_at = new Date().toISOString();
  await writeJson(PROFILES_PATH, data);
  return profile.chat_history;
}

async function clearProfileChat(profileId) {
  if (!/^[a-f0-9-]{36}$/.test(profileId)) throw new ApiError(400, "Invalid profile id.");
  const data = await loadProfiles();
  const profile = data.profiles.find((item) => item.id === profileId);
  if (!profile) throw new ApiError(404, "Profile not found.");
  profile.chat_history = [];
  profile.updated_at = new Date().toISOString();
  await writeJson(PROFILES_PATH, data);
}

async function resolveChatProfileId(body, loaded) {
  if (body.profile_id) return body.profile_id;
  const data = await loadProfiles();
  if (loaded?.manifest?.profile_id) return loaded.manifest.profile_id;
  if (body.run_id) {
    const profile = data.profiles.find((item) => item.last_run_id === body.run_id || (item.reports || []).some((report) => report.id === body.run_id));
    return profile?.id || null;
  }
  return null;
}

async function deleteProfile(profileId) {
  if (!/^[a-f0-9-]{36}$/.test(profileId)) throw new ApiError(400, "Invalid profile id.");
  const data = await loadProfiles();
  const profile = data.profiles.find((item) => item.id === profileId);
  if (!profile) throw new ApiError(404, "Profile not found.");

  const runs = new Set((profile.reports || []).map((report) => report.id).filter(Boolean));
  if (profile.last_run_id) runs.add(profile.last_run_id);
  data.profiles = data.profiles.filter((item) => item.id !== profileId);
  await writeJson(PROFILES_PATH, data);

  for (const runId of runs) {
    if (/^[a-f0-9-]{36}$/.test(runId)) {
      await fsp.rm(path.join(RUNS_DIR, runId), { recursive: true, force: true }).catch(() => {});
    }
  }
}

function buildSummary(chart, context) {
  const moon = chart.planets?.moon;
  const current = chart.dashas?.current || {};
  const activeHouses = new Set();
  for (const planet of Object.values(chart.planets || {})) {
    if (planet.house) activeHouses.add(planet.house);
  }
  return {
    name: chart.birth?.name || null,
    lagna: `${chart.lagna?.sign || "missing"} ${chart.lagna?.degree_formatted || ""}`.trim(),
    moon: moon ? `${moon.sign}, ${moon.nakshatra} pada ${moon.pada}, house ${moon.house}` : "missing",
    current_period: [current.mahadasha, current.antardasha, current.pratyantardasha].filter(Boolean).join(" / ") || "missing",
    active_houses: Array.from(activeHouses).sort((a, b) => a - b),
    warnings: chart.warnings || [],
    sources_found: context.items?.length || 0,
    sources_missing: context.missing?.length || 0,
  };
}

async function runReport(profile, birth, language = "ru") {
  const runId = crypto.randomUUID();
  const runDir = path.join(RUNS_DIR, runId);
  const serviceInput = path.join(runDir, "input.json");
  const globalInput = path.join(INPUT_DIR, "birth.json");
  const globalChart = path.join(REPORTS_DIR, "latest.chart.json");
  const globalContext = path.join(REPORTS_DIR, "latest.context.json");
  const globalReport = path.join(REPORTS_DIR, "latest.report.md");

  try {
    await fsp.mkdir(runDir, { recursive: true });
    await writeJson(serviceInput, birth);
    await writeJson(globalInput, birth);

    await runPython([
      "-m",
      "jyotish.cli",
      "report",
      "--input",
      globalInput,
      "--out-json",
      globalChart,
      "--out-context",
      globalContext,
      "--out-md",
      globalReport,
      "--language",
      language,
    ]);

    const chart = await readJson(globalChart);
    const context = await readJson(globalContext);
    const markdown = await fsp.readFile(globalReport, "utf8");

    const chartPath = path.join(runDir, "chart.json");
    const contextPath = path.join(runDir, "context.json");
    const reportPath = path.join(runDir, "report.md");
    await writeJson(chartPath, chart);
    await writeJson(contextPath, context);
    await fsp.writeFile(reportPath, markdown, "utf8");

    const run = {
      id: runId,
      profile_id: profile.id,
      created_at: new Date().toISOString(),
      summary: buildSummary(chart, context),
      files: {
        input: path.relative(ROOT, serviceInput).replaceAll("\\", "/"),
        chart: path.relative(ROOT, chartPath).replaceAll("\\", "/"),
        context: path.relative(ROOT, contextPath).replaceAll("\\", "/"),
        markdown: path.relative(ROOT, reportPath).replaceAll("\\", "/"),
        latest_chart: "data/reports/latest.chart.json",
        latest_context: "data/reports/latest.context.json",
        latest_markdown: "data/reports/latest.report.md",
      },
    };
    await writeJson(path.join(runDir, "manifest.json"), run);
    return { run, chart, context, markdown };
  } catch (error) {
    await fsp.rm(runDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

function runPython(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, args, { cwd: ROOT, windowsHide: true });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => reject(new ApiError(500, "Could not start Python report engine.", error.message)));
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else reject(new ApiError(500, "Report engine failed.", stderr || stdout || `Exit code ${code}`));
    });
  });
}

async function loadRun(runId) {
  if (!/^[a-f0-9-]{36}$/.test(runId)) throw new ApiError(400, "Invalid run id.");
  const runDir = path.join(RUNS_DIR, runId);
  const manifest = await readJson(path.join(runDir, "manifest.json"));
  const chart = await readJson(path.join(runDir, "chart.json"));
  const context = await readJson(path.join(runDir, "context.json"));
  const markdown = await fsp.readFile(path.join(runDir, "report.md"), "utf8");
  return { manifest, chart, context, markdown };
}

function compactChartFacts(chart) {
  const planets = Object.values(chart.planets || {}).map((planet) => ({
    name: planet.name,
    sign: planet.sign,
    degree: planet.degree_formatted,
    house: planet.house,
    nakshatra: planet.nakshatra,
    pada: planet.pada,
    retrograde: planet.retrograde,
    dignity: planet.dignity,
    ruler_of_houses: planet.ruler_of_houses,
  }));
  return {
    meta: chart.meta,
    birth: chart.birth,
    lagna: chart.lagna,
    planets,
    houses: chart.houses,
    current_dasha: chart.dashas?.current,
    mahadashas: chart.dashas?.mahadashas,
    antardashas: chart.dashas?.antardashas || [],
    pratyantardashas: chart.dashas?.pratyantardashas || [],
    active_antardashas: (chart.dashas?.antardashas || []).filter((item) => {
      const current = chart.dashas?.current || {};
      return item.mahadasha === current.mahadasha;
    }),
    aspects: chart.aspects,
    d9: chart.divisional_charts?.D9,
    warnings: chart.warnings,
  };
}

async function askOpenRouter({ question, chart, context, language, forecast_data }) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ApiError(400, "OPENROUTER_API_KEY is missing in .env.");
  }

  const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
  const baseUrl = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
  const facts = compactChartFacts(chart);
  const sourceItems = (context.items || []).map((item) => ({
    key: item.key,
    source_id: item.source_id,
    text: item.text,
  }));
  const missing = (context.missing || []).slice(0, 120);

  const systemParts = [
    "You are a Jyotish chart assistant for a deterministic astrology service.",
    "Never calculate astrology facts yourself.",
    "Never invent signs, houses, nakshatras, dashas, degrees, aspects, yogas, dignities, or source ids.",
    "Use only the provided chart facts, curated interpretation snippets, and transit data.",
    "Every interpretive claim must cite source ids from the provided curated context.",
    "If a needed interpretation source is missing, say: No curated interpretation source found for this key.",
    "Always preserve and mention calculation settings when they matter.",
    `Answer in ${language === "en" ? "English" : "Russian"}.`,
  ];
  if (forecast_data) {
    systemParts.push(
      "The user is asking about a specific forecast day. You have access to pre-calculated transit data for that day — use it directly without inventing or recalculating anything.",
      "The transit_data field contains: date, score (0-100), lunar phase, all 9 transit planet positions with their natal house placements, tight transit-to-natal aspects (orb ≤6°), ashtakavarga BAV scores, active dasha period, and pre-built advisory tips.",
      "Refer to the natal chart facts for context about what each natal house means for this person."
    );
  }
  const system = systemParts.join(" ");

  const userPayload = {
    question,
    natal_chart: facts,
    curated_context: sourceItems,
    missing_sources: missing,
  };
  if (forecast_data) {
    userPayload.transit_data = forecast_data;
  }

  const bodyStr = JSON.stringify({
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(userPayload, null, 2) },
    ],
    temperature: 0.2,
  });
  console.log(`[OpenRouter] model=${model} payload_bytes=${bodyStr.length}`);

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.OPENROUTER_SITE_URL || `http://localhost:${PORT}`,
      "X-Title": process.env.OPENROUTER_APP_NAME || "Jyotish Service",
    },
    body: bodyStr,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(response.status, "OpenRouter request failed.", detail);
  }
  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.error("[OpenRouter] Empty content. finish_reason:", data.choices?.[0]?.finish_reason, "| usage:", JSON.stringify(data.usage));
    console.error("[OpenRouter] Full response:", JSON.stringify(data).slice(0, 800));
  }
  return content || "";
}

async function route(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, { ok: true, service: "jyotish-service" });
    return;
  }

  if (req.method === "GET" && pathname === "/api/settings") {
    const settings = await readOpenRouterSettings();
    sendJson(res, 200, { settings, needs_setup: !settings.openrouter_api_key });
    return;
  }

  if (req.method === "POST" && pathname === "/api/settings") {
    const body = await parseBody(req);
    const settings = await saveOpenRouterSettings(body || {});
    sendJson(res, 200, { ok: true, settings });
    return;
  }

  if (req.method === "GET" && pathname === "/api/places") {
    sendJson(res, 200, { places: await listPlaces(url.searchParams.get("q") || "") });
    return;
  }

  if (req.method === "GET" && pathname === "/api/profiles") {
    sendJson(res, 200, await loadProfiles());
    return;
  }

  if (req.method === "POST" && pathname === "/api/profiles") {
    const body = await parseBody(req);
    const birth = validateBirthInput(body.birth || body);
    const place = await maybeUpsertPlace(birth, body.place);
    const profile = await saveProfile(birth, place, body.profile_id || body.id || null);
    sendJson(res, 200, { profile });
    return;
  }

  const profileMatch = pathname.match(/^\/api\/profiles\/([a-f0-9-]{36})$/);
  if (req.method === "DELETE" && profileMatch) {
    await deleteProfile(profileMatch[1]);
    sendJson(res, 200, { ok: true });
    return;
  }

  const chatMatch = pathname.match(/^\/api\/profiles\/([a-f0-9-]{36})\/chat$/);
  if (req.method === "DELETE" && chatMatch) {
    await clearProfileChat(chatMatch[1]);
    sendJson(res, 200, { ok: true, chat_history: [] });
    return;
  }

  if (req.method === "POST" && pathname === "/api/reports") {
    const body = await parseBody(req);
    const birth = validateBirthInput(body.birth || body);
    const place = await maybeUpsertPlace(birth, body.place);
    const profileStub = { id: body.profile_id || crypto.randomUUID() };
    const result = await runReport(profileStub, birth, birth.language || "ru");
    const profile = await saveProfile(birth, place, profileStub.id);
    await attachRunToProfile(profile.id, result.run);
    const updatedProfile = (await loadProfiles()).profiles.find((item) => item.id === profile.id) || profile;
    sendJson(res, 200, { profile: updatedProfile, ...result });
    return;
  }

  const runMatch = pathname.match(/^\/api\/reports\/([a-f0-9-]{36})$/);
  if (req.method === "GET" && runMatch) {
    const result = await loadRun(runMatch[1]);
    sendJson(res, 200, result);
    return;
  }

  const downloadMatch = pathname.match(/^\/api\/download\/([a-f0-9-]{36})\/(chart|context|markdown|input)$/);
  if (req.method === "GET" && downloadMatch) {
    await sendRunFile(res, downloadMatch[1], downloadMatch[2]);
    return;
  }

  const exportMatch = pathname.match(/^\/api\/export\/([a-f0-9-]{36})$/);
  if (req.method === "GET" && exportMatch) {
    const { chart, context } = await loadRun(exportMatch[1]);
    const name = (chart.birth?.name || "chart").replace(/[^a-zа-яёА-ЯЁ0-9_-]/gi, "_");
    const urlParams = new URL("http://x" + req.url).searchParams;
    const lang = urlParams.get("lang") === "en" ? "en" : "ru";
    const md = buildExportMarkdown(chart, context, lang);
    res.writeHead(200, {
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${name}_jyotish.md"`,
      "cache-control": "no-store",
    });
    res.end(md);
    return;
  }

  const geoMatch = pathname.match(/^\/api\/geo\/([a-f0-9-]{36})$/);
  if (req.method === "GET" && geoMatch) {
    const runId = geoMatch[1];
    if (!/^[a-f0-9-]{36}$/.test(runId)) throw new ApiError(400, "Invalid run id.");
    const runDir = path.join(RUNS_DIR, runId);
    const geoPath = path.join(runDir, "geo.json");

    // Serve cached result if available
    try {
      const cached = await fsp.readFile(geoPath, "utf8");
      sendJson(res, 200, JSON.parse(cached));
      return;
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }

    // Load chart to get the input file path for geo calculation
    const manifest = await readJson(path.join(runDir, "manifest.json"));
    const inputFile = path.join(ROOT, manifest.files.input);
    const language = (await readJson(path.join(runDir, "chart.json"))).meta?.language || "ru";

    await runPython([
      "-m", "jyotish.cli", "geo",
      "--input", inputFile,
      "--out-geo", geoPath,
      "--language", language,
    ]);

    const geoData = await readJson(geoPath);
    sendJson(res, 200, geoData);
    return;
  }

  const forecastMatch = pathname.match(/^\/api\/forecast\/([a-f0-9-]{36})$/);
  if (req.method === "GET" && forecastMatch) {
    const runId = forecastMatch[1];
    if (!/^[a-f0-9-]{36}$/.test(runId)) throw new ApiError(400, "Invalid run id.");
    const runDir = path.join(RUNS_DIR, runId);

    const rawDate = new URL(req.url, "http://x").searchParams.get("date") || "";
    const dateParam = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date().toISOString().slice(0, 10);

    const language = (await readJson(path.join(runDir, "chart.json"))).meta?.language || "ru";
    const langParam = (new URL(req.url, "http://x").searchParams.get("lang") || language);
    const methodParam = ["mix","jyotish"].includes(new URL(req.url, "http://x").searchParams.get("method"))
      ? new URL(req.url, "http://x").searchParams.get("method")
      : "mix";

    const forecastPath = path.join(runDir, `forecast_${dateParam}_${langParam}_${methodParam}.json`);

    // Serve cached result if available
    try {
      const cached = await fsp.readFile(forecastPath, "utf8");
      sendJson(res, 200, JSON.parse(cached));
      return;
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }

    const manifest = await readJson(path.join(runDir, "manifest.json"));
    const inputFile = path.join(ROOT, manifest.files.input);

    await runPython([
      "-m", "jyotish.cli", "forecast",
      "--input", inputFile,
      "--out-forecast", forecastPath,
      "--forecast-date", dateParam,
      "--language", langParam,
      "--score-method", methodParam,
    ]);

    const forecastData = await readJson(forecastPath);
    sendJson(res, 200, forecastData);
    return;
  }

  const monthMatch = pathname.match(/^\/api\/forecast\/([a-f0-9-]{36})\/month$/);
  if (req.method === "GET" && monthMatch) {
    const runId = monthMatch[1];
    if (!/^[a-f0-9-]{36}$/.test(runId)) throw new ApiError(400, "Invalid run id.");
    const runDir = path.join(RUNS_DIR, runId);
    const params = new URL(req.url, "http://x").searchParams;
    const year  = parseInt(params.get("year")  || new Date().getFullYear(), 10);
    const month = parseInt(params.get("month") || new Date().getMonth() + 1, 10);
    const lang  = params.get("lang") || "ru";
    const method = ["mix","jyotish"].includes(params.get("method")) ? params.get("method") : "mix";

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) throw new ApiError(400, "Invalid year/month.");

    const manifest = await readJson(path.join(runDir, "manifest.json"));
    const inputFile = path.join(ROOT, manifest.files.input);

    // Build list of dates for the month
    const daysInMonth = new Date(year, month, 0).getDate();
    const dates = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    });

    // Run forecasts in parallel (max 8 at a time), use cache if available
    const CONCURRENCY = 8;
    const results = [];
    for (let i = 0; i < dates.length; i += CONCURRENCY) {
      const chunk = dates.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map(async (dateStr) => {
        const forecastPath = path.join(runDir, `forecast_${dateStr}_${lang}_${method}.json`);
        try {
          const cached = await fsp.readFile(forecastPath, "utf8");
          const data = JSON.parse(cached);
          return { date: dateStr, score: data.score ?? 50 };
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
        await runPython([
          "-m", "jyotish.cli", "forecast",
          "--input", inputFile,
          "--out-forecast", forecastPath,
          "--forecast-date", dateStr,
          "--language", lang,
          "--score-method", method,
        ]);
        const data = await readJson(forecastPath);
        return { date: dateStr, score: data.score ?? 50 };
      }));
      results.push(...chunkResults);
    }

    sendJson(res, 200, { year, month, days: results });
    return;
  }

  if (req.method === "POST" && pathname === "/api/chat") {
    const body = await parseBody(req);
    const question = String(body.question || "").trim();
    if (!question) throw new ApiError(400, "Question is required.");
    let loaded;
    if (body.run_id) {
      loaded = await loadRun(body.run_id);
    } else if (body.profile_id) {
      const data = await loadProfiles();
      const profile = data.profiles.find((item) => item.id === body.profile_id);
      if (!profile?.last_run_id) throw new ApiError(404, "Profile has no generated report yet.");
      loaded = await loadRun(profile.last_run_id);
    } else {
      throw new ApiError(400, "run_id or profile_id is required.");
    }
    const answer = await askOpenRouter({
      question,
      chart: loaded.chart,
      context: loaded.context,
      language: body.language || loaded.chart.meta?.language || "ru",
      forecast_data: body.forecast_data || null,
    });
    const profileId = await resolveChatProfileId(body, loaded);
    const now = new Date().toISOString();
    const chat_history = await appendChatMessages(profileId, [
      { role: "user", content: question, created_at: now },
      { role: "assistant", content: answer, created_at: new Date().toISOString() },
    ]);
    sendJson(res, 200, { answer, chat_history });
    return;
  }

  await serveStatic(pathname, res);
}

async function serveStatic(pathname, res) {
  if (pathname === "/vendor/three.module.js") {
    const threePath = path.join(ROOT, "node_modules", "three", "build", "three.module.js");
    const body = await fsp.readFile(threePath);
    res.writeHead(200, {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(body);
    return;
  }

  if (pathname === "/vendor/three.core.js") {
    const threeCorePath = path.join(ROOT, "node_modules", "three", "build", "three.core.js");
    const body = await fsp.readFile(threeCorePath);
    res.writeHead(200, {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    });
    res.end(body);
    return;
  }

  if (pathname.startsWith("/vendor/three/addons/")) {
    const addonRel = pathname.slice("/vendor/three/addons/".length);
    const addonsRoot = path.join(ROOT, "node_modules", "three", "examples", "jsm");
    const filePath = path.resolve(addonsRoot, addonRel);
    if (!filePath.startsWith(addonsRoot)) {
      sendText(res, 403, "Forbidden");
      return;
    }
    try {
      const body = await fsp.readFile(filePath);
      res.writeHead(200, {
        "content-type": "application/javascript; charset=utf-8",
        "cache-control": "no-store",
      });
      res.end(body);
    } catch (error) {
      if (error.code === "ENOENT") sendText(res, 404, "Not found");
      else throw error;
    }
    return;
  }

  if (pathname === "/chart3d.mjs" || pathname === "/chart3d.js" || pathname === "/public/chart3d.mjs") {
    const body = await fsp.readFile(path.join(PUBLIC_DIR, "chart3d.mjs"));
    res.writeHead(200, { "content-type": "application/javascript; charset=utf-8", "cache-control": "no-store" });
    res.end(body);
    return;
  }

  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(PUBLIC_DIR, relative);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }
  try {
    const stat = await fsp.stat(filePath);
    if (stat.isDirectory()) {
      sendText(res, 404, "Not found");
      return;
    }
    const ext = path.extname(filePath);
    const body = await fsp.readFile(filePath);
    res.writeHead(200, {
      "content-type": MIME[ext] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(body);
  } catch (error) {
    if (error.code === "ENOENT") sendText(res, 404, "Not found");
    else throw error;
  }
}

function buildExportMarkdown(chart, context, lang = "ru") {
  const isEn = lang === "en";
  const b = chart.birth || {};
  const meta = chart.meta || {};
  const interp = Object.fromEntries((context.items || []).map((i) => [i.key, isEn ? (i.text_en || i.text || "") : (i.text_ru || i.text || "")]));

  const lines = [];

  const h = (level, text) => lines.push(`${"#".repeat(level)} ${text}`);
  const row = (...cells) => lines.push("| " + cells.join(" | ") + " |");
  const sep = (n) => lines.push("| " + Array(n).fill("---").join(" | ") + " |");
  const blank = () => lines.push("");
  const para = (text) => { if (text) { lines.push(text); blank(); } };

  h(1, isEn ? `Jyotish chart: ${b.name || "—"}` : `Джйотиш-карта: ${b.name || "—"}`);
  blank();

  // Birth data
  h(2, isEn ? "Birth data" : "Данные рождения");
  lines.push(`- **${isEn ? "Name" : "Имя"}:** ${b.name || "—"}`);
  lines.push(`- **${isEn ? "Date & time" : "Дата и время"}:** ${b.local_date || ""} ${b.local_time || ""}`);
  lines.push(`- **${isEn ? "Place" : "Место"}:** ${b.city || ""}, ${b.country || ""}`);
  lines.push(`- **${isEn ? "Coordinates" : "Координаты"}:** ${b.latitude}, ${b.longitude}`);
  lines.push(`- **${isEn ? "Timezone" : "Часовой пояс"}:** ${b.timezone}`);
  lines.push(`- **UTC:** ${b.utc_datetime}`);
  lines.push(`- **${isEn ? "Settings" : "Настройки"}:** ${meta.ayanamsa}, ${meta.zodiac}, ${meta.house_system}, ${meta.dasha_system}`);
  blank();

  // Lagna
  const lagna = chart.lagna || {};
  h(2, isEn ? "Lagna (Ascendant)" : "Лагна (Асцендент)");
  lines.push(`**${lagna.sign || "—"}** · ${lagna.degree_formatted || ""} · ${isEn ? "Nakshatra" : "Накшатра"}: ${lagna.nakshatra || "—"}, ${isEn ? "pada" : "пада"} ${lagna.pada || "—"}`);
  blank();
  const lagnaInterp = (lagna.clickable_keys || []).map((k) => interp[k]).filter(Boolean).join("\n\n");
  if (lagnaInterp) para(lagnaInterp);

  // Planets
  h(2, isEn ? "Planets" : "Планеты");
  blank();
  row(
    isEn ? "Planet" : "Планета",
    isEn ? "Sign" : "Знак",
    isEn ? "Degree" : "Градус",
    isEn ? "House" : "Дом",
    "Nakshatra",
    isEn ? "Pada" : "Пада",
    "R",
    isEn ? "Dignity" : "Достоинство"
  );
  sep(8);
  const PLANET_ORDER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];
  for (const key of PLANET_ORDER) {
    const p = chart.planets?.[key];
    if (!p) continue;
    row(p.name, p.sign, p.degree_formatted, p.house, p.nakshatra, p.pada, p.retrograde ? "R" : "", p.dignity || "");
  }
  blank();

  // Planet interpretations
  h(2, isEn ? "Planet interpretations" : "Интерпретации планет");
  blank();
  for (const key of PLANET_ORDER) {
    const p = chart.planets?.[key];
    if (!p) continue;
    const texts = (p.clickable_keys || []).map((k) => interp[k]).filter(Boolean);
    if (!texts.length) continue;
    h(3, p.name);
    texts.forEach((t) => para(t));
  }

  // Houses
  h(2, isEn ? "Houses" : "Дома");
  blank();
  row(
    isEn ? "House" : "Дом",
    isEn ? "Sign" : "Знак",
    isEn ? "Lord" : "Управитель",
    isEn ? "Planets" : "Планеты"
  );
  sep(4);
  const houses = Object.values(chart.houses || {}).sort((a, b) => a.number - b.number);
  for (const house of houses) {
    row(house.number, house.sign, house.lord, (house.planets || []).join(", ") || "—");
  }
  blank();

  // House interpretations
  h(2, isEn ? "House interpretations" : "Интерпретации домов");
  blank();
  for (const house of houses) {
    const texts = (house.clickable_keys || []).map((k) => interp[k]).filter(Boolean);
    if (!texts.length) continue;
    h(3, isEn ? `House ${house.number} — ${house.sign}` : `Дом ${house.number} — ${house.sign}`);
    texts.forEach((t) => para(t));
  }

  // Aspects
  if ((chart.aspects || []).length) {
    h(2, isEn ? "Aspects (Graha drishti)" : "Аспекты (Граха дришти)");
    blank();
    row(
      isEn ? "Planet" : "Планета",
      isEn ? "From house" : "Из дома",
      isEn ? "Aspect" : "Аспект",
      isEn ? "To house" : "В дом",
      isEn ? "To sign" : "В знак"
    );
    sep(5);
    for (const asp of chart.aspects) {
      row(asp.from_planet, asp.from_house, asp.aspect, asp.to_house, asp.to_sign);
    }
    blank();
  }

  // D9
  const d9 = chart.divisional_charts?.D9;
  if (d9?.planets) {
    h(2, isEn ? "D9 Navamsha" : "D9 Навамша");
    blank();
    row(isEn ? "Planet" : "Планета", isEn ? "Sign in D9" : "Знак в D9");
    sep(2);
    for (const key of PLANET_ORDER) {
      const p = d9.planets[key];
      if (p) row(p.name || key, p.sign);
    }
    blank();
  }

  // Periods
  const dashas = chart.dashas || {};
  h(2, isEn ? "Planetary periods" : "Планетарные периоды");
  blank();
  if (dashas.current) {
    const cur = dashas.current;
    lines.push(`**${isEn ? "Current period" : "Текущий период"}:** ${[cur.mahadasha, cur.antardasha, cur.pratyantardasha].filter(Boolean).join(" / ")}`);
    blank();
  }
  if ((dashas.mahadashas || []).length) {
    h(3, isEn ? "Period chronology" : "Хронология периодов");
    blank();
    row(isEn ? "Planet" : "Планета", isEn ? "Start" : "Начало", isEn ? "End" : "Конец", isEn ? "Years" : "Лет");
    sep(4);
    for (const m of dashas.mahadashas) {
      row(m.planet, m.start?.slice(0, 10), m.end?.slice(0, 10), m.duration_years?.toFixed(1) || "");
    }
    blank();
  }
  const currentMahadasha = dashas.current?.mahadasha;
  const currentAntars = (dashas.antardashas || []).filter((a) => a.mahadasha === currentMahadasha);
  if (currentAntars.length) {
    h(3, isEn ? `Sub-periods of current period (${currentMahadasha})` : `Подпериоды текущего периода (${currentMahadasha})`);
    blank();
    row(isEn ? "Sub-period" : "Подпериод", isEn ? "Start" : "Начало", isEn ? "End" : "Конец");
    sep(3);
    for (const a of currentAntars) {
      row(a.antardasha, a.start?.slice(0, 10), a.end?.slice(0, 10));
    }
    blank();
  }

  // Extra interpretations
  const coveredKeys = new Set([
    ...(lagna.clickable_keys || []),
    ...PLANET_ORDER.flatMap((k) => chart.planets?.[k]?.clickable_keys || []),
    ...houses.flatMap((h) => h.clickable_keys || []),
  ]);
  const extraItems = (context.items || []).filter((i) => !coveredKeys.has(i.key));
  if (extraItems.length) {
    h(2, isEn ? "Additional interpretations" : "Дополнительные интерпретации");
    blank();
    for (const item of extraItems) {
      h(3, item.key);
      para(isEn ? (item.text_en || item.text || "") : (item.text_ru || item.text || ""));
    }
  }

  if ((chart.warnings || []).length) {
    h(2, isEn ? "Warnings" : "Предупреждения");
    chart.warnings.forEach((w) => lines.push(`- ${w}`));
    blank();
  }

  return lines.join("\n");
}

async function sendRunFile(res, runId, kind) {
  const files = {
    chart: ["chart.json", "application/json; charset=utf-8"],
    context: ["context.json", "application/json; charset=utf-8"],
    input: ["input.json", "application/json; charset=utf-8"],
    markdown: ["report.md", "text/markdown; charset=utf-8"],
  };
  const [fileName, contentType] = files[kind];
  const filePath = path.join(RUNS_DIR, runId, fileName);
  const body = await fsp.readFile(filePath);
  res.writeHead(200, {
    "content-type": contentType,
    "content-disposition": `attachment; filename="${fileName}"`,
    "cache-control": "no-store",
  });
  res.end(body);
}

function createHttpServer() {
  return http.createServer((req, res) => {
    route(req, res).catch((error) => {
      const status = error.status || 500;
      sendJson(res, status, {
        error: error.message || "Internal server error",
        detail: error.detail || undefined,
      });
    });
  });
}

async function startServer(options = {}) {
  const port = Number(options.port || PORT);
  const shouldOpenBrowser =
    options.openBrowser === undefined ? String(process.env.OPEN_BROWSER || "true").toLowerCase() !== "false" : Boolean(options.openBrowser);
  const shouldLog = options.log === undefined ? true : Boolean(options.log);

  await ensureStorage();
  const server = createHttpServer();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const url = `http://localhost:${port}`;
  if (shouldLog) console.log(`Jyotish service: ${url}`);
  if (shouldOpenBrowser) openBrowser(url);
  return server;
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  startServer,
};

function openBrowser(url) {
  const command =
    process.platform === "win32"
      ? ["cmd", ["/c", "start", "", url]]
      : process.platform === "darwin"
        ? ["open", [url]]
        : ["xdg-open", [url]];

  try {
    const child = spawn(command[0], command[1], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    child.unref();
  } catch (error) {
    console.warn(`Could not open browser automatically: ${error.message}`);
  }
}
