const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { spawn } = require("child_process");
const { writeJsonAtomic, withFileLock } = require("./lib/store");
const { runPyLimited } = require("./lib/pylimit");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const INPUT_DIR = path.join(DATA_DIR, "input");
const REPORTS_DIR = path.join(DATA_DIR, "reports");
const PLACES_PATH = path.join(DATA_DIR, "places", "places.json");
const SERVICE_DIR = path.join(DATA_DIR, "service");
const RUNS_DIR = path.join(SERVICE_DIR, "runs");
const COMPAT_DIR = path.join(SERVICE_DIR, "compatibility");
const PROFILES_PATH = path.join(SERVICE_DIR, "profiles.json");
const PUBLIC_DIR = path.join(ROOT, "public");
const ENV_PATH = path.join(ROOT, ".env");
const CELEBRITIES_CSV = path.join(DATA_DIR, "celebrities", "PersonList-15k.csv");

loadEnv(ENV_PATH);

const PORT = Number(process.env.PORT || 7860);
const HOST = process.env.HOST || "127.0.0.1";
const PYTHON_BIN = process.env.PYTHON_BIN || "python";
const PY_TIMEOUT_MS = Math.max(1, Number(process.env.PY_TIMEOUT_MS) || 30000);
const OPENROUTER_FETCH_TIMEOUT_MS = 60000;

// Security headers applied to every response (FR10). Leaflet and three.js are now
// self-hosted under /vendor (S5.2), so no CDN origins are allow-listed. 'unsafe-inline'
// remains required by the inline <script type="importmap"> and the SPA's inline styles;
// the client geocodes via nominatim/timeapi and loads map tiles from OSM. Verified in a
// headless-Chromium smoke (zero CSP violations). Next tightening step: give the importmap
// a nonce so script-src can drop 'unsafe-inline'.
const SECURITY_HEADERS = {
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "referrer-policy": "same-origin",
  "content-security-policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "img-src 'self' data: https://*.tile.openstreetmap.org",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "script-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://nominatim.openstreetmap.org https://timeapi.io",
  ].join("; "),
};

function withSecurity(headers) {
  return { ...SECURITY_HEADERS, ...headers };
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const ZODIAC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const CLASSICAL_PLANETS = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
const GEO_ALGORITHM_VERSION = 2;

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

function zodiacSignIndex(sign) {
  return ZODIAC_SIGNS.indexOf(sign);
}

function getSavForSign(sav, sign) {
  const idx = zodiacSignIndex(sign);
  if (idx === -1) return null;
  const score = Number(sav?.[idx]);
  return Number.isFinite(score) ? score : null;
}

function buildHouseSavEntries(chart) {
  const sav = chart.ashtakavarga?.sav || [];
  return Object.values(chart.houses || {})
    .sort((a, b) => a.number - b.number)
    .map((house) => ({
      number: house.number,
      sign: house.sign,
      score: getSavForSign(sav, house.sign),
    }));
}

function buildNatalBavEntries(chart) {
  return CLASSICAL_PLANETS
    .map((planetKey) => {
      const planet = chart.planets?.[planetKey];
      if (!planet) return null;
      const row = chart.ashtakavarga?.bav?.[planetKey];
      const idx = zodiacSignIndex(planet.sign);
      if (!Array.isArray(row) || idx === -1) return null;
      const score = Number(row[idx]);
      return Number.isFinite(score)
        ? { planet: planetKey, sign: planet.sign, house: planet.house, score }
        : null;
    })
    .filter(Boolean);
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
  const rawKey = String(input.openrouter_api_key ?? "").replace(/\r?\n/g, " ").trim();
  const model = String(input.openrouter_model ?? "").replace(/\r?\n/g, " ").trim();

  // If the UI sends an empty key (placeholder mode), keep the existing key.
  const existing = await readOpenRouterSettings();
  const apiKey = rawKey || existing.openrouter_api_key;

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
  await writeJsonAtomic(filePath, value);
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, withSecurity({
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  }));
  res.end(body);
}

function sendText(res, status, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(status, withSecurity({ "content-type": contentType, "cache-control": "no-store" }));
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

// Allow-list the language param before it touches any path join (FR3), so a
// value like "../../x" cannot escape the per-run directory.
function safeLang(x) {
  if (x === "ru" || x === "en") return x;
  throw new ApiError(400, "Unsupported language.");
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

function resolveIanaTimezone(lat, lon) {
  return runPyLimited(() => new Promise((resolve) => {
    const py = spawn(PYTHON_BIN, ["-c",
      `from timezonefinder import TimezoneFinder; tf = TimezoneFinder(); print(tf.timezone_at(lat=${lat}, lng=${lon}) or "")`
    ]);
    let out = "";
    let done = false;
    const finish = (value) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(value);
    };
    const timer = setTimeout(() => {
      py.kill("SIGKILL");
      finish(null);
    }, PY_TIMEOUT_MS);
    py.stdout.on("data", d => { out += d; });
    py.on("close", () => finish(out.trim() || null));
    py.on("error", () => finish(null));
  }));
}

function isUtcOffset(tz) {
  return /^[+-]\d{2}:\d{2}$/.test(String(tz || "").trim());
}

async function maybeUpsertPlace(birth, place) {
  if (!place) return null;
  const lat = Number(place.latitude);
  const lon = Number(place.longitude);
  let timezone = String(place.timezone || "").trim();
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  // CSV data gives UTC offset (+00:53) — resolve to IANA name via coordinates
  if (!timezone || isUtcOffset(timezone)) {
    timezone = (await resolveIanaTimezone(lat, lon)) || timezone;
  }
  if (!timezone) return null;

  const key = normalizeKey(birth.city, birth.country);
  const entry = {
    name: String(place.display_name || `${birth.city}, ${birth.country}`).trim(),
    lat,
    lon,
    timezone,
  };
  await withFileLock(PLACES_PATH, async () => {
    const places = await readJson(PLACES_PATH, {});
    places[key] = entry;
    await writeJsonAtomic(PLACES_PATH, places);
  });
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

function parseCelebritiesCSV(text) {
  const entries = [];
  let i = 0;
  const n = text.length;

  function parseField() {
    if (i < n && text[i] === '"') {
      i++;
      let val = "";
      while (i < n) {
        if (text[i] === '"') {
          if (text[i + 1] === '"') { val += '"'; i += 2; }
          else { i++; break; }
        } else {
          val += text[i++];
        }
      }
      return val;
    }
    let val = "";
    while (i < n && text[i] !== "," && text[i] !== "\n" && text[i] !== "\r") val += text[i++];
    return val;
  }

  function parseRecord() {
    const fields = [];
    while (true) {
      fields.push(parseField());
      if (i >= n || text[i] === "\n" || text[i] === "\r") {
        if (i < n && text[i] === "\r") i++;
        if (i < n && text[i] === "\n") i++;
        break;
      }
      i++;
    }
    return fields;
  }

  const header = parseRecord();
  const nameIdx = header.indexOf("Name");
  const genderIdx = header.indexOf("Gender");
  const birthTimeIdx = header.indexOf("BirthTime");
  const notesIdx = header.indexOf("Notes");

  while (i < n) {
    if (text[i] === "\r" || text[i] === "\n") { i++; continue; }
    const cols = parseRecord();
    try {
      const bt = JSON.parse(cols[birthTimeIdx] || "{}");
      const stdTime = bt.StdTime || "";
      const m = stdTime.match(/^(\d{2}:\d{2})\s+(\d{2})\/(\d{2})\/(\d{4})\s+([+-]\d{2}:\d{2})/);
      if (!m) continue;
      const [, time, day, month, year, tzOffset] = m;
      const notesRaw = (cols[notesIdx] || "").replace(/'/g, '"');
      let rodden = "";
      try { rodden = JSON.parse(notesRaw).rodden || ""; } catch {}
      entries.push({
        name: cols[nameIdx] || "",
        gender: cols[genderIdx] || "",
        birth_date: `${year}-${month}-${day}`,
        birth_time: time,
        latitude: bt.Location?.Latitude ?? null,
        longitude: bt.Location?.Longitude ?? null,
        birth_place: bt.Location?.Name || "",
        tz_offset: tzOffset || null,
        rodden,
      });
    } catch {}
  }
  return entries;
}

let _celebCache = null;
async function searchCelebrities(query = "") {
  if (!_celebCache) {
    const text = await fsp.readFile(CELEBRITIES_CSV, "utf8");
    _celebCache = parseCelebritiesCSV(text);
  }
  const q = query.trim().toLowerCase();
  if (!q) return _celebCache.slice(0, 20);
  return _celebCache.filter(e => e.name.toLowerCase().includes(q)).slice(0, 50);
}

async function loadProfiles() {
  const data = await readJson(PROFILES_PATH, { profiles: [] });
  if (!Array.isArray(data.profiles)) data.profiles = [];
  return data;
}

async function saveProfile(birth, place, existingId = null) {
  return withFileLock(PROFILES_PATH, async () => {
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
    await writeJsonAtomic(PROFILES_PATH, data);
    return profile;
  });
}

async function attachRunToProfile(profileId, run) {
  return withFileLock(PROFILES_PATH, async () => {
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
    await writeJsonAtomic(PROFILES_PATH, data);
  });
}

async function appendChatMessages(profileId, messages) {
  if (!profileId) return [];
  return withFileLock(PROFILES_PATH, async () => {
    const data = await loadProfiles();
    const profile = data.profiles.find((item) => item.id === profileId);
    if (!profile) return [];
    profile.chat_history = Array.isArray(profile.chat_history) ? profile.chat_history : [];
    profile.chat_history.push(...messages);
    profile.chat_history = profile.chat_history.slice(-200);
    profile.updated_at = new Date().toISOString();
    await writeJsonAtomic(PROFILES_PATH, data);
    return profile.chat_history;
  });
}

async function clearProfileChat(profileId) {
  if (!/^[a-f0-9-]{36}$/.test(profileId)) throw new ApiError(400, "Invalid profile id.");
  return withFileLock(PROFILES_PATH, async () => {
    const data = await loadProfiles();
    const profile = data.profiles.find((item) => item.id === profileId);
    if (!profile) throw new ApiError(404, "Profile not found.");
    profile.chat_history = [];
    profile.updated_at = new Date().toISOString();
    await writeJsonAtomic(PROFILES_PATH, data);
  });
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
  const runs = await withFileLock(PROFILES_PATH, async () => {
    const data = await loadProfiles();
    const profile = data.profiles.find((item) => item.id === profileId);
    if (!profile) throw new ApiError(404, "Profile not found.");

    const ids = new Set((profile.reports || []).map((report) => report.id).filter(Boolean));
    if (profile.last_run_id) ids.add(profile.last_run_id);
    data.profiles = data.profiles.filter((item) => item.id !== profileId);
    await writeJsonAtomic(PROFILES_PATH, data);
    return ids;
  });

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
  const chartPath = path.join(runDir, "chart.json");
  const contextPath = path.join(runDir, "context.json");
  const reportPath = path.join(runDir, "report.md");

  try {
    await fsp.mkdir(runDir, { recursive: true });
    await writeJson(serviceInput, birth);

    // All inputs/outputs live inside this run's directory — no shared
    // data/input/birth.json or data/reports/latest.* writes (FR5), so
    // concurrent reports cannot clobber each other.
    await runPython([
      "-m",
      "jyotish.cli",
      "report",
      "--input",
      serviceInput,
      "--out-json",
      chartPath,
      "--out-context",
      contextPath,
      "--out-md",
      reportPath,
      "--language",
      language,
    ]);

    const chart = await readJson(chartPath);
    const context = await readJson(contextPath);
    const markdown = await fsp.readFile(reportPath, "utf8");

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
      },
    };
    await writeJson(path.join(runDir, "manifest.json"), run);

    // "Latest" pointer for the UI, written once post-success outside the hot
    // path via an atomic write (never read back during a request).
    await writeJsonAtomic(path.join(REPORTS_DIR, "latest.json"), {
      run_id: runId,
      profile_id: profile.id,
      created_at: run.created_at,
      summary: run.summary,
    }).catch(() => {});

    return { run, chart, context, markdown };
  } catch (error) {
    await fsp.rm(runDir, { recursive: true, force: true }).catch(() => {});
    throw error;
  }
}

function runPython(args) {
  // Gate every spawn through the shared semaphore (FR8) so fan-outs queue
  // instead of forking dozens of processes at once.
  return runPyLimited(() => new Promise((resolve, reject) => {
    const child = spawn(PYTHON_BIN, args, { cwd: ROOT, windowsHide: true });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const settle = (fn, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      fn(value);
    };
    // Timeout + hard kill (FR7) so a hung child cannot leak or stall a request.
    const timer = setTimeout(() => {
      if (settled) return;
      child.kill("SIGKILL");
      settle(reject, new ApiError(504, "Report engine timed out.", `Python timed out after ${PY_TIMEOUT_MS}ms`));
    }, PY_TIMEOUT_MS);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => settle(reject, new ApiError(500, "Could not start Python report engine.", error.message)));
    child.on("close", (code) => {
      if (code === 0) settle(resolve, stdout);
      else settle(reject, new ApiError(500, "Report engine failed.", stderr || stdout || `Exit code ${code}`));
    });
  }));
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

async function runCompatibility(runIdA, runIdB, language = "ru", context = "romance") {
  if (!/^[a-f0-9-]{36}$/.test(runIdA) || !/^[a-f0-9-]{36}$/.test(runIdB)) {
    throw new ApiError(400, "Invalid run id.");
  }
  const chartA = path.join(RUNS_DIR, runIdA, "chart.json");
  const chartB = path.join(RUNS_DIR, runIdB, "chart.json");
  await fsp.access(chartA).catch(() => {
    throw new ApiError(404, "First profile report was not found.");
  });
  await fsp.access(chartB).catch(() => {
    throw new ApiError(404, "Second profile report was not found.");
  });

  await fsp.mkdir(COMPAT_DIR, { recursive: true });
  const safeLanguage = language === "en" ? "en" : "ru";
  const safeContext = ["romance", "business", "friendship", "karma"].includes(context) ? context : "romance";
  const outJson = path.join(COMPAT_DIR, `${runIdA}_${runIdB}_${safeLanguage}_${safeContext}.json`);
  await runPython([
    "-m",
    "jyotish.cli",
    "compatibility",
    "--chart-a",
    chartA,
    "--chart-b",
    chartB,
    "--out-json",
    outJson,
    "--language",
    safeLanguage,
    "--context",
    safeContext,
  ]);
  return readJson(outJson);
}

function compactDayForecast(dateStr, data) {
  const keyAspects = (data.transit_aspects || [])
    .filter((a) => a.aspect !== "jyotish_aspect" && (a.orb || 99) <= 4)
    .map((a) => `${a.transit_planet}→${a.natal_planet} ${a.aspect}`);
  const planets = (data.transit_planets || []).map((p) => `${p.name}:${p.sign}H${p.natal_house}`);
  const indicators = (data.indicators || []).map((ind) => ({ id: ind.id, rating: ind.rating }));
  return {
    date: dateStr,
    score: data.score ?? 50,
    lunar_phase: data.lunar_phase,
    active_dasha: data.active_dasha,
    transit_planets: planets,
    key_aspects: keyAspects,
    indicators,
  };
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

  const dashas = chart.dashas || {};
  const current = dashas.current || {};
  const currentMaha = current.mahadasha;
  const currentAntar = current.antardasha;

  // D9 — only essential fields to save tokens
  const d9Raw = chart.divisional_charts?.D9?.planets || {};
  const d9 = Object.fromEntries(
    Object.entries(d9Raw).map(([k, v]) => [k, {
      name: v.name || k,
      sign: v.sign,
      house: v.house,
      dignity: v.dignity,
      nakshatra: v.nakshatra,
      pada: v.pada,
    }])
  );

  // Dignity summary
  const dignityGroups = { exalted: [], own_sign: [], debilitated: [], neutral: [] };
  for (const p of planets) {
    (dignityGroups[p.dignity] || dignityGroups.neutral).push(p.name);
  }

  // Retrograde list
  const retrograde = planets.filter((p) => p.retrograde).map((p) => p.name);

  // Ashtakavarga — preserve raw sign-based data and add lagna-aware summaries.
  const av = chart.ashtakavarga;
  const houseSav = buildHouseSavEntries(chart);
  const natalPlanetBav = buildNatalBavEntries(chart);
  const ashtakavarga = av ? {
    bav: av.bav,
    sav: av.sav,
    house_sav: houseSav,
    planet_natal_bav: natalPlanetBav,
    strong_houses: houseSav.filter((item) => item.score !== null && item.score >= 28).map((item) => item.number),
    weak_houses: houseSav.filter((item) => item.score !== null && item.score < 25).map((item) => item.number),
  } : undefined;

  return {
    meta: chart.meta,
    birth: chart.birth,
    lagna: {
      sign: chart.lagna?.sign,
      degree: chart.lagna?.degree_formatted,
      nakshatra: chart.lagna?.nakshatra,
      pada: chart.lagna?.pada,
    },
    planets,
    dignity_summary: dignityGroups,
    retrograde_planets: retrograde,
    houses: Object.fromEntries(
      Object.entries(chart.houses || {}).map(([k, h]) => [k, {
        number: h.number,
        sign: h.sign,
        lord: h.lord,
        planets: h.planets,
      }])
    ),
    aspects: chart.aspects,
    d9_navamsha: d9,
    ashtakavarga,
    dasha: {
      system: dashas.system,
      birth_moon_nakshatra: dashas.birth_moon_nakshatra,
      birth_mahadasha: dashas.birth_mahadasha,
      balance_days: dashas.balance_days,
      current: current,
      mahadashas: dashas.mahadashas,
      active_antardashas: (dashas.antardashas || []).filter((a) => a.mahadasha === currentMaha),
      current_pratyantardashas: (dashas.pratyantardashas || []).filter(
        (p) => p.mahadasha === currentMaha && p.antardasha === currentAntar
      ),
    },
    warnings: chart.warnings,
  };
}

async function askOpenRouter({ question, chart, context, language, forecast_data, followup_context }) {
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
    "Never calculate astrology facts yourself — all positions, dignities, aspects, dashas, ashtakavarga scores, and D9 placements are pre-calculated and provided in natal_chart.",
    "Never invent signs, houses, nakshatras, dashas, degrees, aspects, dignities, or source ids.",
    "Use only the provided chart facts, curated interpretation snippets, and transit data.",
    "The natal_chart contains: birth data, lagna, all 9 planets with sign/house/nakshatra/pada/dignity/retrograde/ruler_of_houses, dignity summary (exalted/own_sign/debilitated), retrograde planet list, 12 houses with lord and occupants, graha drishti aspects, D9 Navamsha placements with dignity, Ashtakavarga (raw BAV by zodiac sign, raw SAV by zodiac sign, house SAV mapped from lagna, natal-position BAV for each classical planet, strong/weak houses), and full Vimshottari dasha tree (current period, all mahadashas, active antardashas, current pratyantardashas).",
    "When answering, cross-reference multiple layers: dignity + house placement + dasha lord + ashtakavarga strength.",
    "Every interpretive claim must cite source ids from the provided curated context.",
    "If a needed interpretation source is missing, say: No curated interpretation source found for this key.",
    "Always preserve and mention calculation settings when they matter.",
    `Answer in ${language === "en" ? "English" : "Russian"}.`,
  ];
  if (forecast_data?.month_overview) {
    systemParts.push(
      `The user is asking for a monthly overview of ${forecast_data.month_name} ${forecast_data.year}.`,
      "You have pre-calculated forecast data for every day of the month in transit_data.days.",
      "Each day contains: date, score (0-100), lunar_phase, active_dasha, transit_planets (planet:sign:natal_house), key_aspects (tight orb ≤4° transits).",
      "Use this data directly — identify the best days (score ≥70), challenging days (score ≤35), key transit events, dasha changes, and give a practical monthly summary.",
      "Never invent or estimate — base everything on the provided day-by-day data."
    );
  } else if (forecast_data) {
    systemParts.push(
      "The user is asking about a specific forecast day. You have access to pre-calculated transit data for that day — use it directly without inventing or recalculating anything.",
      "The transit_data field contains: date, score (0-100), lunar phase, all 9 transit planet positions with their natal house placements, tight transit-to-natal aspects (orb ≤6°), ashtakavarga BAV scores, active dasha period, and pre-built advisory tips.",
      "Refer to the natal chart facts for context about what each natal house means for this person."
    );
  }
  if (followup_context) {
    systemParts.push(
      `The user is asking a follow-up question about a specific previous answer. That answer is provided below — use it as the direct context for the question:\n\n---\n${followup_context}\n---`
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

  let response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || `http://localhost:${PORT}`,
        "X-Title": process.env.OPENROUTER_APP_NAME || "Jyotish Service",
      },
      body: bodyStr,
      signal: AbortSignal.timeout(OPENROUTER_FETCH_TIMEOUT_MS),
    });
  } catch (error) {
    if (error && (error.name === "TimeoutError" || error.name === "AbortError")) {
      throw new ApiError(504, "OpenRouter request timed out.", error.message);
    }
    throw new ApiError(502, "OpenRouter request failed.", error && error.message);
  }

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
    const hasKey = !!settings.openrouter_api_key;
    // Never disclose the key (FR2) — only whether one is configured.
    sendJson(res, 200, {
      has_key: hasKey,
      model: settings.openrouter_model || "",
      base_url: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      needs_setup: !hasKey,
    });
    return;
  }

  if (req.method === "POST" && pathname === "/api/settings") {
    const body = await parseBody(req);
    const saved = await saveOpenRouterSettings(body || {});
    const hasKey = !!saved.openrouter_api_key;
    // Never echo the key back (NFR4) — return the same safe flat shape as GET.
    sendJson(res, 200, {
      ok: true,
      has_key: hasKey,
      model: saved.openrouter_model || "",
      base_url: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      needs_setup: !hasKey,
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/places") {
    sendJson(res, 200, { places: await listPlaces(url.searchParams.get("q") || "") });
    return;
  }

  if (req.method === "GET" && pathname === "/api/celebrities") {
    const results = await searchCelebrities(url.searchParams.get("q") || "");
    sendJson(res, 200, { celebrities: results });
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

  if (req.method === "GET" && pathname === "/api/transits/today") {
    const urlParams = new URL("http://x" + req.url).searchParams;
    const lang = safeLang(urlParams.get("lang") || "ru");
    const rawDate = urlParams.get("date") || "";
    const dateParam = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
      ? rawDate
      : new Date().toISOString().slice(0, 10);
    const cacheFile = path.join(REPORTS_DIR, `transits_${dateParam}_${lang}.json`);
    // Serve cached result if it exists (transits don't change within a day)
    try {
      const cached = await fsp.readFile(cacheFile, "utf8");
      sendJson(res, 200, JSON.parse(cached));
      return;
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    // Run Python to get the requested day's transit positions (no natal chart needed)
    const pyScript = [
      "from datetime import date, datetime, timezone",
      "from jyotish.engine.ephemeris import calculate_positions",
      "from jyotish.engine.timezone import to_julian_day",
      "from jyotish.engine.zodiac import get_sign, get_sign_degree",
      "from jyotish.engine.nakshatra import get_nakshatra, get_pada",
      "from jyotish.engine.dignity import get_dignity",
      "import json, sys",
      "lang = sys.argv[1]",
      "today = date.fromisoformat(sys.argv[2])",
      "noon = datetime(today.year, today.month, today.day, 12, 0, 0, tzinfo=timezone.utc)",
      "jd = to_julian_day(noon)",
      "raw = calculate_positions(jd)",
      "planets = []",
      "for k, v in raw.items():",
      "    lon = v['longitude_sidereal']",
      "    sign = get_sign(lon)",
      "    planets.append({'planet': k, 'sign': sign, 'degree': round(get_sign_degree(lon), 2), 'nakshatra': get_nakshatra(lon), 'pada': get_pada(lon), 'dignity': get_dignity(k, sign), 'retrograde': v['retrograde']})",
      "# lunar phase",
      "moon = next(p for p in planets if p['planet'] == 'moon')",
      "sun  = next(p for p in planets if p['planet'] == 'sun')",
      "import math",
      "moon_lon = next(v['longitude_sidereal'] for k,v in raw.items() if k=='moon')",
      "sun_lon  = next(v['longitude_sidereal'] for k,v in raw.items() if k=='sun')",
      "elong = (moon_lon - sun_lon) % 360",
      "tithi = int(elong / 12) + 1",
      "illum = round(50 * (1 - math.cos(math.radians(elong))), 1)",
      "paksha = 'shukla' if tithi <= 15 else 'krishna'",
      "result = {'date': today.isoformat(), 'lang': lang, 'planets': planets, 'lunar': {'tithi': tithi, 'illumination': illum, 'paksha': paksha, 'elongation': round(elong, 2)}}",
      "print(json.dumps(result))",
    ].join("\n");
    const stdout = await runPyLimited(() => new Promise((resolve, reject) => {
      const child = spawn(PYTHON_BIN, ["-c", pyScript, lang, dateParam], { cwd: ROOT, windowsHide: true });
      let out = "", err = "", settled = false;
      const settle = (fn, v) => { if (settled) return; settled = true; clearTimeout(timer); fn(v); };
      const timer = setTimeout(() => { child.kill("SIGKILL"); settle(reject, new ApiError(504, "Transit calculation timed out.")); }, PY_TIMEOUT_MS);
      child.stdout.on("data", d => { out += d; });
      child.stderr.on("data", d => { err += d; });
      child.on("error", e => settle(reject, new ApiError(500, "Python error.", e.message)));
      child.on("close", code => {
        if (code === 0) settle(resolve, out.trim());
        else settle(reject, new ApiError(500, "Transit calculation failed.", err || out));
      });
    }));
    const data = JSON.parse(stdout);
    await writeJsonAtomic(cacheFile, data).catch(() => {});
    sendJson(res, 200, data);
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

  const compatibilityMatch = pathname.match(/^\/api\/compatibility\/([a-f0-9-]{36})\/([a-f0-9-]{36})$/);
  if (req.method === "GET" && compatibilityMatch) {
    const result = await runCompatibility(
      compatibilityMatch[1],
      compatibilityMatch[2],
      url.searchParams.get("language") || "ru",
      url.searchParams.get("context") || "romance",
    );
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
    const rawName = chart.birth?.name || "chart";
    const asciiName = rawName.replace(/[^a-z0-9_-]/gi, "_").replace(/^_+|_+$/g, "") || "chart";
    const encodedName = encodeURIComponent(rawName.replace(/[^\w\s.-]/g, "_")) + "_astro_report.md";
    const urlParams = new URL("http://x" + req.url).searchParams;
    const lang = urlParams.get("lang") === "en" ? "en" : "ru";
    const md = buildExportMarkdown(chart, context, lang);
    res.writeHead(200, withSecurity({
      "content-type": "text/markdown; charset=utf-8",
      "content-disposition": `attachment; filename="${asciiName}_astro_report.md"; filename*=UTF-8''${encodedName}`,
      "cache-control": "no-store",
    }));
    res.end(md);
    return;
  }

  const geoMatch = pathname.match(/^\/api\/geo\/([a-f0-9-]{36})$/);
  if (req.method === "GET" && geoMatch) {
    const runId = geoMatch[1];
    if (!/^[a-f0-9-]{36}$/.test(runId)) throw new ApiError(400, "Invalid run id.");
    const runDir = path.join(RUNS_DIR, runId);
    const geoPath = path.join(runDir, "geo.json");

    // Serve cached result if available. Older geo caches may not carry the
    // current algorithm_version marker, but they are still structurally valid
    // and preferable to failing a recomputation for legacy runs.
    try {
      const cached = await fsp.readFile(geoPath, "utf8");
      const parsed = JSON.parse(cached);
      const hasUsableGeoCache =
        Array.isArray(parsed?.lines) &&
        Array.isArray(parsed?.parans) &&
        parsed?.meta &&
        typeof parsed.meta === "object";
      if (hasUsableGeoCache) {
        sendJson(res, 200, parsed);
        return;
      }
    } catch (err) {
      if (err.code !== "ENOENT") throw err;
    }

    // Load chart to get the input file path for geo calculation
    const manifest = await readJson(path.join(runDir, "manifest.json"));
    const inputRelPath = manifest?.files?.input;
    if (!inputRelPath) {
      throw new ApiError(404, "Geo data is unavailable for this report.", "Missing manifest.files.input for geo run");
    }
    const inputFile = path.join(ROOT, inputRelPath);
    try {
      await fsp.access(inputFile, fs.constants.F_OK);
    } catch {
      throw new ApiError(404, "Geo data is unavailable for this report.", `Missing geo input file: ${inputFile}`);
    }
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
    const langParam = safeLang(new URL(req.url, "http://x").searchParams.get("lang") || language);
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
    const lang  = safeLang(params.get("lang") || "ru");
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

    // Fan out every day; each Python spawn is gated by the shared semaphore
    // (FR8), so the ~31 sub-calls queue at PY_MAX_CONCURRENCY instead of all
    // spawning at once. Cache hits resolve without spawning.
    const results = await Promise.all(dates.map(async (dateStr) => {
      const forecastPath = path.join(runDir, `forecast_${dateStr}_${lang}_${method}.json`);
      try {
        const cached = await fsp.readFile(forecastPath, "utf8");
        return compactDayForecast(dateStr, JSON.parse(cached));
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
      return compactDayForecast(dateStr, data);
    }));

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
      followup_context: body.followup_context || null,
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

const VENDOR_CACHE = "public, max-age=31536000, immutable";
const STATIC_CACHE = "public, max-age=0, must-revalidate";

// Stream a file to the client (FR22) instead of buffering it fully, applying
// security + cache headers. Headers are only written once the stream opens, so
// a missing file maps cleanly to 404 before any header is sent.
function streamFile(res, filePath, contentType, cacheControl, extraHeaders = {}) {
  const stream = fs.createReadStream(filePath);
  stream.once("open", () => {
    res.writeHead(200, withSecurity({
      "content-type": contentType,
      "cache-control": cacheControl,
      ...extraHeaders,
    }));
    stream.pipe(res);
  });
  stream.on("error", (error) => {
    if (res.headersSent) {
      res.destroy(error);
      return;
    }
    if (error.code === "ENOENT") sendText(res, 404, "Not found");
    else if (error.code === "EISDIR") sendText(res, 404, "Not found");
    else sendText(res, 500, "Internal server error");
  });
}

async function serveStatic(pathname, res) {
  if (pathname === "/vendor/three.module.js") {
    streamFile(res, path.join(ROOT, "node_modules", "three", "build", "three.module.js"),
      "application/javascript; charset=utf-8", VENDOR_CACHE);
    return;
  }

  if (pathname === "/vendor/three.core.js") {
    streamFile(res, path.join(ROOT, "node_modules", "three", "build", "three.core.js"),
      "application/javascript; charset=utf-8", VENDOR_CACHE);
    return;
  }

  if (pathname.startsWith("/vendor/three/addons/")) {
    const addonRel = pathname.slice("/vendor/three/addons/".length);
    const addonsRoot = path.join(ROOT, "node_modules", "three", "examples", "jsm");
    const filePath = path.resolve(addonsRoot, addonRel);
    if (!filePath.startsWith(addonsRoot + path.sep)) {
      sendText(res, 403, "Forbidden");
      return;
    }
    streamFile(res, filePath, "application/javascript; charset=utf-8", VENDOR_CACHE);
    return;
  }

  if (pathname === "/chart3d.mjs" || pathname === "/chart3d.js" || pathname === "/public/chart3d.mjs") {
    streamFile(res, path.join(PUBLIC_DIR, "chart3d.mjs"),
      "application/javascript; charset=utf-8", STATIC_CACHE);
    return;
  }

  const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  const filePath = path.resolve(PUBLIC_DIR, relative);
  if (filePath !== PUBLIC_DIR && !filePath.startsWith(PUBLIC_DIR + path.sep)) {
    sendText(res, 403, "Forbidden");
    return;
  }
  let stat;
  try {
    stat = await fsp.stat(filePath);
  } catch (error) {
    if (error.code === "ENOENT") sendText(res, 404, "Not found");
    else throw error;
    return;
  }
  if (stat.isDirectory()) {
    sendText(res, 404, "Not found");
    return;
  }
  const ext = path.extname(filePath);
  streamFile(res, filePath, MIME[ext] || "application/octet-stream", STATIC_CACHE, {
    "last-modified": stat.mtime.toUTCString(),
  });
}

function buildExportMarkdown(chart, context, lang = "ru") {
  const isEn = lang === "en";
  const b = chart.birth || {};
  const meta = chart.meta || {};
  const interp = Object.fromEntries((context.items || []).map((i) => [i.key, isEn ? (i.text_en || i.text || "") : (i.text_ru || i.text || "")]));
  const signLabel = (sign) => String(sign || "");

  const lines = [];

  const h = (level, text) => lines.push(`${"#".repeat(level)} ${text}`);
  const row = (...cells) => lines.push("| " + cells.join(" | ") + " |");
  const sep = (n) => lines.push("| " + Array(n).fill("---").join(" | ") + " |");
  const blank = () => lines.push("");
  const para = (text) => { if (text) { lines.push(text); blank(); } };

  h(1, isEn ? `Astro report: ${b.name || "—"}` : `Астро-отчёт: ${b.name || "—"}`);
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
    isEn ? "Dignity" : "Достоинство",
    isEn ? "Rules houses" : "Управляет домами"
  );
  sep(9);
  const PLANET_ORDER = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn", "rahu", "ketu"];
  const DIGNITY_LABEL = {
    exalted: isEn ? "Exalted" : "Экзальтация",
    debilitated: isEn ? "Debilitated" : "Падение",
    own_sign: isEn ? "Own sign" : "Своё знак",
    neutral: isEn ? "Neutral" : "Нейтральный",
  };
  for (const key of PLANET_ORDER) {
    const p = chart.planets?.[key];
    if (!p) continue;
    const dignityLabel = DIGNITY_LABEL[p.dignity] || p.dignity || "";
    const rulerOf = (p.ruler_of_houses || []).length ? p.ruler_of_houses.join(", ") : "—";
    row(p.name, p.sign, p.degree_formatted, p.house, p.nakshatra, p.pada, p.retrograde ? "R" : "", dignityLabel, rulerOf);
  }
  blank();

  // Retrograde planets summary
  const retrogradePlanets = PLANET_ORDER.map((k) => chart.planets?.[k]).filter((p) => p?.retrograde);
  if (retrogradePlanets.length) {
    h(3, isEn ? "Retrograde planets" : "Ретроградные планеты");
    retrogradePlanets.forEach((p) => {
      lines.push(`- **${p.name}** — ${p.sign}, ${isEn ? "house" : "дом"} ${p.house}, ${p.nakshatra}`);
    });
    blank();
  }

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

  // Dignity analysis
  const exalted = PLANET_ORDER.map((k) => chart.planets?.[k]).filter((p) => p?.dignity === "exalted");
  const debilitated = PLANET_ORDER.map((k) => chart.planets?.[k]).filter((p) => p?.dignity === "debilitated");
  const ownSign = PLANET_ORDER.map((k) => chart.planets?.[k]).filter((p) => p?.dignity === "own_sign");
  if (exalted.length || debilitated.length || ownSign.length) {
    h(2, isEn ? "Dignity analysis" : "Анализ достоинств");
    blank();
    if (exalted.length) {
      lines.push(`**${isEn ? "Exalted" : "Экзальтированные"}:** ${exalted.map((p) => `${p.name} (${p.sign}, ${isEn ? "house" : "дом"} ${p.house})`).join(", ")}`);
    }
    if (ownSign.length) {
      lines.push(`**${isEn ? "Own sign" : "В своём знаке"}:** ${ownSign.map((p) => `${p.name} (${p.sign}, ${isEn ? "house" : "дом"} ${p.house})`).join(", ")}`);
    }
    if (debilitated.length) {
      lines.push(`**${isEn ? "Debilitated" : "В падении"}:** ${debilitated.map((p) => `${p.name} (${p.sign}, ${isEn ? "house" : "дом"} ${p.house})`).join(", ")}`);
    }
    blank();
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

  // D9 Navamsha — extended
  const d9 = chart.divisional_charts?.D9;
  if (d9?.planets) {
    h(2, isEn ? "D9 Navamsha" : "D9 Навамша");
    blank();
    row(
      isEn ? "Planet" : "Планета",
      isEn ? "Sign" : "Знак",
      isEn ? "House" : "Дом",
      "Nakshatra",
      isEn ? "Pada" : "Пада",
      isEn ? "Dignity" : "Достоинство"
    );
    sep(6);
    for (const key of PLANET_ORDER) {
      const p = d9.planets[key];
      if (!p) continue;
      const dLabel = DIGNITY_LABEL[p.dignity] || p.dignity || "";
      row(p.name || key, p.sign, p.house ?? "—", p.nakshatra ?? "—", p.pada ?? "—", dLabel);
    }
    blank();
  }

  // Ashtakavarga
  const av = chart.ashtakavarga;
  if (av) {
    h(2, isEn ? "Ashtakavarga" : "Аштакаварга");
    blank();
    const houseSav = buildHouseSavEntries(chart);
    const natalPlanetBav = buildNatalBavEntries(chart);
    const PLANET_NAMES = { sun: isEn ? "Sun" : "Солнце", moon: isEn ? "Moon" : "Луна", mars: isEn ? "Mars" : "Марс", mercury: isEn ? "Mercury" : "Меркурий", jupiter: isEn ? "Jupiter" : "Юпитер", venus: isEn ? "Venus" : "Венера", saturn: isEn ? "Saturn" : "Сатурн" };

    // BAV table
    h(3, isEn ? "Benefic points by zodiac sign (BAV)" : "Бенефические баллы по знакам зодиака (BAV)");
    blank();
    row(isEn ? "Planet" : "Планета", ...ZODIAC_SIGNS.map(signLabel), isEn ? "Total" : "Итого");
    sep(14);
    for (const pk of CLASSICAL_PLANETS) {
      const scores = av.bav?.[pk] || [];
      const total = av.planet_totals?.[pk] ?? scores.reduce((s, v) => s + v, 0);
      row(PLANET_NAMES[pk], ...scores.map(String), String(total));
    }
    // SAV row
    row(`**${isEn ? "SAV (total)" : "SAV (итого)"}**`, ...(av.sav || []).map(String), String((av.sav || []).reduce((s, v) => s + v, 0)));
    blank();

    // Natal-position planet strength
    h(3, isEn ? "Planet strength at natal position (BAV)" : "Сила планет в натальном положении (BAV)");
    blank();
    natalPlanetBav
      .slice()
      .sort((a, b) => b.score - a.score)
      .forEach(({ planet, sign, house, score }) => {
        const bar = "█".repeat(Math.round(score / 8 * 10));
        lines.push(`- **${PLANET_NAMES[planet]}**: ${score}/8 · ${signLabel(sign)} · ${isEn ? "house" : "дом"} ${house} ${bar}`);
      });
    blank();

    // House strength by lagna
    h(3, isEn ? "House strength (SAV by house from lagna)" : "Сила домов (SAV по домам от лагны)");
    blank();
    row(isEn ? "House" : "Дом", isEn ? "Sign" : "Знак", "SAV");
    sep(3);
    houseSav.forEach(({ number, sign, score }) => {
      row(String(number), signLabel(sign), score == null ? "—" : String(score));
    });
    blank();

    // Strong/weak houses by SAV
    const strongHouses = houseSav.filter((item) => item.score !== null && item.score >= 28).map((item) => item.number);
    const weakHouses = houseSav.filter((item) => item.score !== null && item.score < 25).map((item) => item.number);
    if (strongHouses.length) lines.push(`${isEn ? "Strong houses (SAV ≥ 28)" : "Сильные дома (SAV ≥ 28):"} ${strongHouses.join(", ")}`);
    if (weakHouses.length) lines.push(`${isEn ? "Weak houses (SAV < 25)" : "Слабые дома (SAV < 25):"} ${weakHouses.join(", ")}`);
    blank();
  }

  // Periods
  const dashas = chart.dashas || {};
  h(2, isEn ? "Planetary periods (Vimshottari)" : "Планетарные периоды (Вимшоттари)");
  blank();

  if (dashas.birth_moon_nakshatra) {
    lines.push(`- **${isEn ? "Moon nakshatra at birth" : "Накшатра Луны при рождении"}:** ${dashas.birth_moon_nakshatra}`);
    lines.push(`- **${isEn ? "Birth mahadasha" : "Маха-даша рождения"}:** ${dashas.birth_mahadasha}`);
    if (dashas.balance_days != null) {
      const balYears = (dashas.balance_days / 365.25).toFixed(2);
      lines.push(`- **${isEn ? "Balance at birth" : "Остаток при рождении"}:** ${balYears} ${isEn ? "years" : "лет"}`);
    }
    blank();
  }

  if (dashas.current) {
    const cur = dashas.current;
    lines.push(`**${isEn ? "Current period" : "Текущий период"}:** ${[cur.mahadasha, cur.antardasha, cur.pratyantardasha].filter(Boolean).join(" / ")}`);
    blank();
  }

  if ((dashas.mahadashas || []).length) {
    h(3, isEn ? "Mahadasha chronology" : "Хронология Маха-даш");
    blank();
    row(isEn ? "Planet" : "Планета", isEn ? "Start" : "Начало", isEn ? "End" : "Конец", isEn ? "Years" : "Лет");
    sep(4);
    for (const m of dashas.mahadashas) {
      const isCurrent = m.planet === dashas.current?.mahadasha;
      const marker = isCurrent ? " ◄" : "";
      row(`${m.planet}${marker}`, m.start?.slice(0, 10), m.end?.slice(0, 10), m.duration_years || "");
    }
    blank();
  }

  const currentMahadasha = dashas.current?.mahadasha;
  const currentAntardasha = dashas.current?.antardasha;
  const currentAntars = (dashas.antardashas || []).filter((a) => a.mahadasha === currentMahadasha);
  if (currentAntars.length) {
    h(3, isEn ? `Antardasha of ${currentMahadasha} mahadasha` : `Антардаши в маха-даше ${currentMahadasha}`);
    blank();
    row(isEn ? "Antardasha" : "Антардаша", isEn ? "Start" : "Начало", isEn ? "End" : "Конец");
    sep(3);
    for (const a of currentAntars) {
      const isCurrent = a.antardasha === currentAntardasha;
      const marker = isCurrent ? " ◄" : "";
      row(`${a.antardasha}${marker}`, a.start?.slice(0, 10), a.end?.slice(0, 10));
    }
    blank();
  }

  // Pratyantardashas of current antardasha
  const currentPratyas = (dashas.pratyantardashas || []).filter(
    (p) => p.mahadasha === currentMahadasha && p.antardasha === currentAntardasha
  );
  if (currentPratyas.length) {
    h(3, isEn ? `Pratyantardasha of ${currentMahadasha} / ${currentAntardasha}` : `Пратьянтардаши ${currentMahadasha} / ${currentAntardasha}`);
    blank();
    row(isEn ? "Pratyantardasha" : "Пратьянтардаша", isEn ? "Start" : "Начало", isEn ? "End" : "Конец");
    sep(3);
    for (const p of currentPratyas) {
      const isCurrent = p.pratyantardasha === dashas.current?.pratyantardasha;
      const marker = isCurrent ? " ◄" : "";
      row(`${p.pratyantardasha}${marker}`, p.start?.slice(0, 10), p.end?.slice(0, 10));
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
  res.writeHead(200, withSecurity({
    "content-type": contentType,
    "content-disposition": `attachment; filename="${fileName}"`,
    "cache-control": "no-store",
  }));
  res.end(body);
}

// Centralized error -> HTTP mapping (FR9). Maps known error shapes to status
// codes, never leaks raw detail (e.g. Python stderr) to the client, and guards
// against writing after headers were already sent.
function toHttpStatus(error) {
  if (error instanceof ApiError) return error.status || 500;
  if (error instanceof URIError) return 400;
  if (error && error.code === "ENOENT") return 404;
  return (error && error.status) || 500;
}

function clientMessage(error, status) {
  if (status >= 500) return "Internal server error.";
  if (error instanceof ApiError) return error.message || "Request failed.";
  if (error instanceof URIError) return "Malformed request URL.";
  if (error && error.code === "ENOENT") return "Not found.";
  return "Request failed.";
}

function sendError(res, error) {
  const status = toHttpStatus(error);
  // Full detail is logged server-side only.
  console.error(`[error] ${status} ${(error && error.message) || error}`, (error && (error.detail || error.stack)) || "");
  if (res.headersSent) {
    try { res.end(); } catch { /* socket already gone */ }
    return;
  }
  sendJson(res, status, { error: clientMessage(error, status) });
}

let _processGuardsInstalled = false;
function installProcessGuards() {
  if (_processGuardsInstalled) return;
  _processGuardsInstalled = true;
  // Log and keep serving rather than crashing the single process (FR9).
  process.on("unhandledRejection", (reason) => {
    console.error("[unhandledRejection]", reason);
  });
  process.on("uncaughtException", (error) => {
    console.error("[uncaughtException]", error);
  });
}

function createHttpServer() {
  return http.createServer((req, res) => {
    route(req, res).catch((error) => sendError(res, error));
  });
}

async function startServer(options = {}) {
  const port = Number(options.port || PORT);
  const host = options.host || HOST;
  const shouldOpenBrowser =
    options.openBrowser === undefined ? String(process.env.OPEN_BROWSER || "true").toLowerCase() !== "false" : Boolean(options.openBrowser);
  const shouldLog = options.log === undefined ? true : Boolean(options.log);

  installProcessGuards();
  await ensureStorage();

  // Prewarm the celebrities CSV cache off the request path (FR22) so the first
  // /api/celebrities call doesn't parse a 15k-row file on the event loop.
  searchCelebrities("").catch((error) => {
    if (shouldLog) console.warn(`Celebrity cache warm failed: ${error.message}`);
  });

  const server = createHttpServer();

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    // Bind to HOST (default 127.0.0.1, loopback-only); set HOST=0.0.0.0 to
    // expose on all interfaces (FR1).
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const displayHost = host === "0.0.0.0" || host === "::" ? "localhost" : host;
  const url = `http://${displayHost}:${port}`;
  if (shouldLog) console.log(`Jyotish service: ${url} (bound to ${host})`);
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
