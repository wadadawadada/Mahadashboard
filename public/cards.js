"use strict";

// ─── Astro Cards Module ───────────────────────────────────────────────────────
// Standalone canvas renderer for social cards.
// Uses only text labels instead of Unicode astro-glyphs (Canvas font fallback
// support for ♃ etc. is unreliable across OS/browser combinations).
// ─────────────────────────────────────────────────────────────────────────────

const CARDS = (() => {

  // ── Design tokens (mirrors styles.css :root) ─────────────────────────────
  const C = {
    bg:     "#07060f",
    bg2:    "#0b0820",
    gold:   "#d8b764",
    goldBr: "#f3d27a",
    text:   "#f5ecd8",
    textBr: "#ffffff",
    muted:  "#a9a3c2",
    teal:   "#5cd3c2",
    indigo: "#6c8cff",
    violet: "#b796ff",
    danger: "#ff6a6a",
    green:  "#4ade80",
    amber:  "#a87330",
  };

  const PLANET_COLOR = {
    sun:"#f2c45b", moon:"#c8d8ff", mars:"#d66b52", mercury:"#7dd2bf",
    jupiter:"#d7b66c", venus:"#e5a0c3", saturn:"#b0a898", rahu:"#9c7cff", ketu:"#83a2ff",
  };

  // Unicode glyphs — rendered via Noto Sans Symbols (loaded in <head>)
  const PLANET_GLYPH = {
    sun:"☉", moon:"☽", mars:"♂", mercury:"☿",
    jupiter:"♃", venus:"♀", saturn:"♄", rahu:"☊", ketu:"☋",
  };
  const SIGN_GLYPH = {
    Aries:"♈", Taurus:"♉", Gemini:"♊", Cancer:"♋",
    Leo:"♌", Virgo:"♍", Libra:"♎", Scorpio:"♏",
    Sagittarius:"♐", Capricorn:"♑", Aquarius:"♒", Pisces:"♓",
  };
  // Fallback abbr if font hasn't loaded yet
  const PLANET_ABBR    = { sun:"SUN", moon:"MON", mars:"MAR", mercury:"MER", jupiter:"JUP", venus:"VEN", saturn:"SAT", rahu:"RAH", ketu:"KET" };
  const PLANET_ABBR_RU = { sun:"СОЛ", moon:"ЛУН", mars:"МАР", mercury:"МЕР", jupiter:"ЮПИ", venus:"ВЕН", saturn:"САТ", rahu:"РАХ", ketu:"КЕТ" };
  const GLYPH_FONT = `"Noto Sans Symbols","Noto Sans Symbols 2",serif`;

  const PLANET_NAME_RU = {
    sun:"Солнце", moon:"Луна", mars:"Марс", mercury:"Меркурий",
    jupiter:"Юпитер", venus:"Венера", saturn:"Сатурн", rahu:"Раху", ketu:"Кету",
  };
  const PLANET_NAME_EN = {
    sun:"Sun", moon:"Moon", mars:"Mars", mercury:"Mercury",
    jupiter:"Jupiter", venus:"Venus", saturn:"Saturn", rahu:"Rahu", ketu:"Ketu",
  };

  const SIGN_RU = {
    Aries:"Овен", Taurus:"Телец", Gemini:"Близнецы", Cancer:"Рак",
    Leo:"Лев", Virgo:"Дева", Libra:"Весы", Scorpio:"Скорпион",
    Sagittarius:"Стрелец", Capricorn:"Козерог", Aquarius:"Водолей", Pisces:"Рыбы",
  };

  const SIGN_ELEM = {
    Aries:"Fire", Taurus:"Earth", Gemini:"Air", Cancer:"Water",
    Leo:"Fire", Virgo:"Earth", Libra:"Air", Scorpio:"Water",
    Sagittarius:"Fire", Capricorn:"Earth", Aquarius:"Air", Pisces:"Water",
  };
  const ELEM_COLOR  = { Fire:"#d66b52", Earth:"#7dd2bf", Air:"#6c8cff", Water:"#5cd3c2" };
  const ELEM_RU     = { Fire:"Огонь",   Earth:"Земля",   Air:"Воздух",  Water:"Вода" };
  const ELEM_SYMBOL = { Fire:"△", Earth:"▽", Air:"△̄", Water:"▽̄" };

  const WEEKDAY_PLANET = ["moon","sun","mars","mercury","jupiter","venus","saturn"];

  // ── Canvas setup ─────────────────────────────────────────────────────────
  const BASE_W = 1080, BASE_H = 1920;
  let W = BASE_W, H = BASE_H;
  const TEXT_FONT_FAMILY = `-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif`;
  const FRAME_PRESETS = {
    story: { key: "story", width: 1080, height: 1920, slug: "9x16" },
  };
  let currentFrameKey = "story";

  function getFrameConfig(key = currentFrameKey) {
    return FRAME_PRESETS[key] || FRAME_PRESETS.story;
  }

  function setFrameKey(nextKey) {
    currentFrameKey = FRAME_PRESETS[nextKey] ? nextKey : "story";
  }

  function makeCtx() {
    return makeCtxForSlot(0);
  }

  function isPostFrame() {
    return false;
  }

  // ── Low-level drawing helpers ─────────────────────────────────────────────

  function clearBg(ctx) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);
  }

  function radialGlow(ctx, cx, cy, r0, r1, color, alpha) {
    const g = ctx.createRadialGradient(cx, cy, r0, cx, cy, r1);
    g.addColorStop(0, color + Math.round(alpha * 255).toString(16).padStart(2,"0"));
    g.addColorStop(1, color + "00");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r1, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawNebula(ctx) {
    radialGlow(ctx, W * 0.5, H * 0.25, 0, W * 0.9, "#6c8cff", 0.14);
    radialGlow(ctx, W * 0.1, H * 0.7,  0, W * 0.65, "#d8b764", 0.08);
    radialGlow(ctx, W * 0.9, H * 0.55, 0, W * 0.5,  "#b796ff", 0.07);
  }

  function drawStars(ctx, seed = 42) {
    let s = seed >>> 0;
    const r = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0xffffffff; };
    for (let i = 0; i < 280; i++) {
      const x = r() * W, y = r() * H, rad = r() * 1.8 + 0.2, a = r() * 0.65 + 0.1;
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${a.toFixed(2)})`;
      ctx.fill();
    }
  }

  function hline(ctx, y, alpha = 0.3) {
    const g = ctx.createLinearGradient(60, y, W - 60, y);
    g.addColorStop(0, "rgba(216,183,100,0)");
    g.addColorStop(0.2, `rgba(216,183,100,${alpha})`);
    g.addColorStop(0.8, `rgba(216,183,100,${alpha})`);
    g.addColorStop(1, "rgba(216,183,100,0)");
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(60, y); ctx.lineTo(W - 60, y); ctx.stroke();
    ctx.restore();
  }

  function corners(ctx, size = 52, len = 52) {
    return;
  }

  // text helpers
  function t(ctx, str, x, y, {size=36, color=C.text, align="center", weight="400", glow=null, alpha=1, maxW=null}={}) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${weight} ${size}px ${TEXT_FONT_FAMILY}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = "alphabetic";
    if (glow) { ctx.shadowColor = glow; ctx.shadowBlur = 32; }
    const text = maxW !== null ? ellipsizeLine(ctx, str, maxW, { size, weight }) : String(str ?? "");
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function textFont({ size = 36, weight = "400" } = {}) {
    return `${weight} ${size}px ${TEXT_FONT_FAMILY}`;
  }

  function wrapLines(ctx, str, maxW, opts = {}) {
    const text = String(str ?? "");
    const paragraphs = text.split(/\n/);
    const lines = [];
    ctx.save();
    ctx.font = textFont(opts);
    paragraphs.forEach((paragraph, idx) => {
      const words = paragraph.trim().split(/\s+/).filter(Boolean);
      if (!words.length) {
        if (idx < paragraphs.length - 1) lines.push("");
        return;
      }
      let line = words[0];
      for (let i = 1; i < words.length; i += 1) {
        const test = `${line} ${words[i]}`;
        if (ctx.measureText(test).width > maxW && line) {
          lines.push(line);
          line = words[i];
        } else {
          line = test;
        }
      }
      lines.push(line);
    });
    ctx.restore();
    return lines;
  }

  function ellipsizeLine(ctx, str, maxW, opts = {}) {
    let text = String(str ?? "");
    ctx.save();
    ctx.font = textFont(opts);
    if (ctx.measureText(text).width <= maxW) {
      ctx.restore();
      return text;
    }
    while (text.length > 1 && ctx.measureText(`${text}…`).width > maxW) {
      text = text.slice(0, -1);
    }
    ctx.restore();
    return `${text}…`;
  }

  // wrap text, returns y after last line
  function wrap(ctx, str, x, y, maxW, lineH, opts = {}) {
    const lines = wrapLines(ctx, str, maxW, opts);
    let maxLines = Number.isFinite(opts.maxLines) ? opts.maxLines : Infinity;
    if (opts.maxHeight) {
      maxLines = Math.min(maxLines, Math.max(1, Math.floor(opts.maxHeight / lineH)));
    }
    const drawLines = lines.slice(0, maxLines);
    if (lines.length > drawLines.length && drawLines.length) {
      drawLines[drawLines.length - 1] = ellipsizeLine(ctx, drawLines[drawLines.length - 1], maxW, opts);
    }
    let curY = y;
    drawLines.forEach((line) => {
      t(ctx, line, x, curY, opts);
      curY += lineH;
    });
    return curY;
  }

  function measureWrapHeight(ctx, str, maxW, lineH, opts = {}) {
    const lines = wrapLines(ctx, str, maxW, opts);
    let maxLines = Number.isFinite(opts.maxLines) ? opts.maxLines : Infinity;
    if (opts.maxHeight) {
      maxLines = Math.min(maxLines, Math.max(1, Math.floor(opts.maxHeight / lineH)));
    }
    return Math.min(lines.length, maxLines) * lineH;
  }

  // Rounded rect fill helper
  function rrect(ctx, x, y, w, h, r, fill, stroke, strokeA = 0.4) {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.globalAlpha = strokeA; ctx.lineWidth = 1.5; ctx.stroke(); }
    ctx.restore();
  }

  // Planet circle with glyph (Noto Sans Symbols) or abbr fallback
  function planetCircle(ctx, cx, cy, R, planetKey) {
    const col   = PLANET_COLOR[planetKey] || C.gold;
    const glyph = PLANET_GLYPH[planetKey];
    radialGlow(ctx, cx, cy, R * 0.3, R * 2.4, col, 0.18);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.globalAlpha = 0.85; ctx.stroke();
    const ig = ctx.createRadialGradient(cx, cy - R*0.2, 0, cx, cy, R);
    ig.addColorStop(0, col + "33"); ig.addColorStop(1, col + "08");
    ctx.fillStyle = ig; ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // Draw glyph with Noto Symbols font
    ctx.save();
    ctx.font = `${Math.round(R * 0.95)}px ${GLYPH_FONT}`;
    ctx.fillStyle = col; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = col; ctx.shadowBlur = 20;
    ctx.fillText(glyph || "★", cx, cy + 4);
    ctx.restore();
  }

  // Sign glyph circle (smaller, for sign display)
  function signCircle(ctx, cx, cy, R, sign) {
    const col   = ELEM_COLOR[SIGN_ELEM[sign]] || C.gold;
    const glyph = SIGN_GLYPH[sign] || "?";
    radialGlow(ctx, cx, cy, R * 0.2, R * 2, col, 0.14);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.globalAlpha = 0.7; ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.font = `${Math.round(R * 0.9)}px ${GLYPH_FONT}`;
    ctx.fillStyle = col; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = col; ctx.shadowBlur = 16;
    ctx.fillText(glyph, cx, cy + 3);
    ctx.restore();
  }

  // Pill badge
  function badge(ctx, cx, cy, w, h, color, text, textColor, textSize = 28) {
    ctx.save();
    ctx.globalAlpha = 0.15; ctx.fillStyle = color;
    ctx.beginPath(); ctx.roundRect(cx - w/2, cy - h/2, w, h, h/2); ctx.fill();
    ctx.globalAlpha = 0.4; ctx.strokeStyle = color; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.roundRect(cx - w/2, cy - h/2, w, h, h/2); ctx.stroke();
    ctx.restore();
    t(ctx, text, cx, cy + textSize * 0.38, { size: textSize, color: textColor || color, align: "center", weight: "600" });
  }

  // ── Header / Footer ───────────────────────────────────────────────────────

  function header(ctx, label) {
    badge(ctx, W/2, 112, 340, 54, C.gold, label.toUpperCase(), C.gold, 22);
  }

  function footer(ctx) {
    // intentionally empty — no branding or date at the bottom
  }

  function todayStr() {
    const d = new Date();
    return `${String(d.getDate()).padStart(2,"0")}.${String(d.getMonth()+1).padStart(2,"0")}.${d.getFullYear()}`;
  }

  function pname(key, isRu) { return isRu ? (PLANET_NAME_RU[key] || key) : (PLANET_NAME_EN[key] || key); }
  function sname(sign, isRu) { return isRu ? (SIGN_RU[sign] || sign) : sign; }

  // ── Format 1: Day Report (real transits from /api/transits/today) ───────────

  function moonPhaseArc(ctx, cx, cy, R, illumination, waxing) {
    // Draw moon disc with terminator
    const illum = Math.max(0, Math.min(100, illumination));
    ctx.save();
    // full dark disc base
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(200,216,255,0.08)"; ctx.fill();
    ctx.strokeStyle = "rgba(200,216,255,0.35)"; ctx.lineWidth = 2; ctx.stroke();

    // lit portion using clip + ellipse terminator
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    if (waxing) {
      // right side lit
      const xScale = (illum / 50) - 1; // -1..1
      ctx.fillStyle = "rgba(200,216,255,0.55)";
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI/2, Math.PI/2);
      ctx.ellipse(cx, cy, Math.abs(xScale * R), R, 0, Math.PI/2, -Math.PI/2, xScale > 0);
      ctx.closePath(); ctx.fill();
    } else {
      // left side lit
      const xScale = 1 - (illum / 50);
      ctx.fillStyle = "rgba(200,216,255,0.55)";
      ctx.beginPath();
      ctx.arc(cx, cy, R, Math.PI/2, -Math.PI/2);
      ctx.ellipse(cx, cy, Math.abs(xScale * R), R, 0, -Math.PI/2, Math.PI/2, xScale > 0);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }

  function progressBar(ctx, x, y, w, h, pct, color, bgAlpha = 0.08) {
    rrect(ctx, x, y, w, h, h/2, `rgba(255,255,255,${bgAlpha})`, null);
    if (pct > 0) {
      rrect(ctx, x, y, Math.max(h, w * Math.min(pct, 1)), h, h/2, color, null);
    }
  }

  function glyphAt(ctx, glyph, x, y, size, color) {
    ctx.save();
    ctx.font = `${size}px ${GLYPH_FONT}`;
    ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = color; ctx.shadowBlur = 14;
    ctx.fillText(glyph, x, y);
    ctx.restore();
  }

  async function renderDayReport(ctx, lang, transits) {
    const isRu   = lang === "ru";
    const compact = isPostFrame();
    const planets = transits.planets || [];
    const lunar   = transits.lunar   || {};

    const moon    = planets.find(p => p.planet === "moon")    || {};
    const sun     = planets.find(p => p.planet === "sun")     || {};
    const mercury = planets.find(p => p.planet === "mercury") || {};
    const venus   = planets.find(p => p.planet === "venus")   || {};
    const mars    = planets.find(p => p.planet === "mars")    || {};
    const jupiter = planets.find(p => p.planet === "jupiter") || {};
    const saturn  = planets.find(p => p.planet === "saturn")  || {};
    const rahu    = planets.find(p => p.planet === "rahu")    || {};
    const ketu    = planets.find(p => p.planet === "ketu")    || {};

    const retros  = planets.filter(p => p.retrograde && p.planet !== "sun" && p.planet !== "moon");
    const waxing  = lunar.paksha !== "krishna";
    const illum   = lunar.illumination ?? 50;
    const moonSign = moon.sign || "";
    const moonElemCol = ELEM_COLOR[SIGN_ELEM[moonSign]] || C.gold;

    const mercRetro  = retros.some(p => p.planet === "mercury");
    const malefRetro = retros.some(p => ["mars","saturn"].includes(p.planet));
    const moonDebil  = moon.dignity === "debilitated";
    const moonExalt  = moon.dignity === "exalted";
    const jupExalt   = jupiter.dignity === "exalted";

    let tone = "neutral";
    if (mercRetro || malefRetro || moonDebil) tone = "tense";
    else if (moonExalt || jupExalt) tone = "good";

    const reportLayout = compact ? {
      weekdayY: 82,
      weekdaySize: 24,
      dateY: 148,
      dateSize: 70,
      toneY: 218,
      toneTextSize: 22,
      topLineY: 258,
      moonY: 282,
      moonH: 198,
      moonRadius: 72,
      moonTitleY: 38,
      moonValueY: 112,
      moonValueSize: 52,
      moonMetaY: 154,
      moonBarY: 172,
      moonBarExtraW: 22,
      sectionGap: 28,
      sectionTitleSize: 20,
      cardGap: 22,
      gridGapY: 10,
      gridCellH: 184,
      gridPlanetGlyphY: 52,
      gridPlanetGlyphSize: 30,
      gridPlanetNameY: 92,
      gridPlanetNameSize: 17,
      gridSignGlyphY: 52,
      gridSignGlyphSize: 20,
      gridSignTextY: 92,
      gridSignTextSize: 20,
      gridDescY: 126,
      gridDescSize: 16,
      gridDescLineH: 20,
      retroCardH: 96,
      retroGap: 12,
      retroGlyphSize: 34,
      retroTextY: 38,
      retroTextSize: 21,
      summaryTop: 30,
      summarySize: 23,
      summaryLineH: 36,
    } : {
      weekdayY: 88,
      weekdaySize: 26,
      dateY: 156,
      dateSize: 74,
      toneY: 218,
      toneTextSize: 24,
      topLineY: 258,
      moonY: 280,
      moonH: 230,
      moonRadius: 80,
      moonTitleY: 44,
      moonValueY: 126,
      moonValueSize: 58,
      moonMetaY: 176,
      moonBarY: 196,
      moonBarExtraW: 30,
      sectionGap: 34,
      sectionTitleSize: 22,
      cardGap: 28,
      gridGapY: 12,
      gridCellH: 228,
      gridPlanetGlyphY: 62,
      gridPlanetGlyphSize: 34,
      gridPlanetNameY: 110,
      gridPlanetNameSize: 20,
      gridSignGlyphY: 62,
      gridSignGlyphSize: 24,
      gridSignTextY: 110,
      gridSignTextSize: 24,
      gridDescY: 154,
      gridDescSize: 18,
      gridDescLineH: 22,
      retroCardH: 112,
      retroGap: 14,
      retroGlyphSize: 38,
      retroTextY: 44,
      retroTextSize: 26,
      summaryTop: 38,
      summarySize: 28,
      summaryLineH: 46,
    };

    // ── Background ───────────────────────────────────────────────────────
    drawStars(ctx, new Date().getDay() + 7);
    if (tone === "tense") {
      radialGlow(ctx, W*0.5, H*0.2, 0, W*0.8, "#d66b52", 0.10);
      radialGlow(ctx, W*0.5, H*0.75, 0, W*0.7, "#6c8cff", 0.07);
    } else if (tone === "good") {
      radialGlow(ctx, W*0.5, H*0.2, 0, W*0.85, "#4ade80", 0.08);
      radialGlow(ctx, W*0.5, H*0.7,  0, W*0.6,  "#d8b764", 0.07);
    } else {
      drawNebula(ctx);
    }
    corners(ctx, 60, 60);

    // ── TOP: date + weekday + tone ───────────────────────────────────────
    const WDAY_RU = ["Воскресенье","Понедельник","Вторник","Среда","Четверг","Пятница","Суббота"];
    const WDAY_EN = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const dow = new Date().getDay();

    t(ctx, (isRu ? WDAY_RU : WDAY_EN)[dow].toUpperCase(), W/2, reportLayout.weekdayY, { size: reportLayout.weekdaySize, color: C.muted, align: "center", weight: "300" });
    t(ctx, todayStr(), W/2, reportLayout.dateY, { size: reportLayout.dateSize, color: C.textBr, align: "center", weight: "800", glow: C.gold });

    const TONE_LABEL = {
      ru: { good:"Благоприятный день", tense:"Напряжённый день", neutral:"Нейтральный день" },
      en: { good:"Favorable Day",      tense:"Tense Day",        neutral:"Neutral Day" },
    };
    const toneCol = tone === "good" ? C.green : tone === "tense" ? C.danger : C.muted;
    badge(ctx, W/2, reportLayout.toneY, 380, 50, toneCol, TONE_LABEL[lang][tone], toneCol, reportLayout.toneTextSize);

    hline(ctx, reportLayout.topLineY, 0.22);

    // ── MOON BLOCK ───────────────────────────────────────────────────────
    let y = reportLayout.moonY;
    const moonBlockH = reportLayout.moonH;
    rrect(ctx, 60, y, W-120, moonBlockH, 18, "rgba(200,216,255,0.04)", "rgba(200,216,255,0.28)", 1);

    moonPhaseArc(ctx, 170, y + moonBlockH/2, reportLayout.moonRadius, illum, waxing);

    const mx = 290, mw = W - 120 - 240 - 20;
    const moonHeadline = isRu ? `Луна в ${sname(moonSign, true)}` : `Moon in ${sname(moonSign, false)}`;
    glyphAt(ctx, PLANET_GLYPH.moon, mx + 18, y + reportLayout.moonTitleY - 6, compact ? 28 : 32, PLANET_COLOR.moon);
    t(ctx, moonHeadline, mx + 52, y + reportLayout.moonTitleY, { size: compact ? 24 : 26, color: PLANET_COLOR.moon, align: "left", weight: "700", maxW: mw - 120 });
    const phaseName = waxing ? (isRu ? "Растущая" : "Waxing") : (isRu ? "Убывающая" : "Waning");
    if (moon.dignity === "exalted") t(ctx, isRu ? "↑ Сила" : "↑ Strong", W - 80, y + reportLayout.moonTitleY, { size: compact ? 20 : 22, color: C.green, align: "right", weight: "600" });
    else if (moon.dignity === "debilitated") t(ctx, isRu ? "↓ Слаба" : "↓ Weak", W - 80, y + reportLayout.moonTitleY, { size: compact ? 20 : 22, color: C.danger, align: "right", weight: "600" });

    glyphAt(ctx, SIGN_GLYPH[moonSign] || "?", mx + 28, y + reportLayout.moonValueY - 8, compact ? 42 : 48, moonElemCol);
    t(ctx, sname(moonSign, isRu), mx + 68, y + reportLayout.moonValueY, { size: compact ? reportLayout.moonValueSize - 6 : reportLayout.moonValueSize - 2, color: moonElemCol, align: "left", weight: "800", glow: moonElemCol, maxW: mw - 92 });

    t(ctx, `${phaseName}  ·  ${illum}%`, mx, y + reportLayout.moonMetaY, { size: compact ? 24 : 26, color: C.muted, align: "left" });
    progressBar(ctx, mx, y + reportLayout.moonBarY, mw + reportLayout.moonBarExtraW, 10, illum / 100, PLANET_COLOR.moon);

    y += moonBlockH + reportLayout.cardGap;
    hline(ctx, y, 0.18);
    y += reportLayout.cardGap;

    // ── SECTION: ПЛАНЕТЫ ────────────────────────────────────────────────
    t(ctx, isRu ? "ПЛАНЕТЫ" : "PLANETS", W/2, y + 6, { size: reportLayout.sectionTitleSize, color: C.gold, align: "center", weight: "700" });
    y += reportLayout.sectionGap;

    // Planet descriptions per sign (brief, practical)
    const PLANET_DESC = {
      ru: {
        sun: { Aries:"Воля и инициатива сильны", Taurus:"Стабильность и упорство в делах", Gemini:"Гибкость ума, общение", Cancer:"Интуиция ведёт, семья важна", Leo:"Харизма и творчество в зените", Virgo:"Точность и служение", Libra:"Дипломатия и партнёрство", Scorpio:"Глубина и трансформация", Sagittarius:"Оптимизм и расширение", Capricorn:"Карьера и дисциплина", Aquarius:"Инновации и свобода", Pisces:"Духовность и сострадание" },
        moon: { Aries:"Импульсивный эмоциональный фон", Taurus:"Спокойствие, потребность в комфорте", Gemini:"Переменчивое настроение, болтливость", Cancer:"Глубокие чувства, интуиция сильна", Leo:"Щедрость и желание внимания", Virgo:"Тревожность, стремление к порядку", Libra:"Потребность в гармонии", Scorpio:"Интенсивные эмоции", Sagittarius:"Оптимистичный настрой", Capricorn:"Сдержанность и серьёзность", Aquarius:"Отстранённость, оригинальность", Pisces:"Мечтательность и чувствительность" },
        mercury: { Aries:"Быстрые решения, прямолинейность", Taurus:"Медленное, практичное мышление", Gemini:"Остроумие и коммуникация в силе", Cancer:"Интуитивное мышление, память", Leo:"Харизматичная речь", Virgo:"Аналитика и точность", Libra:"Дипломатия в словах", Scorpio:"Проницательность и тайны", Sagittarius:"Философский взгляд", Capricorn:"Структурированное мышление", Aquarius:"Нестандартные идеи", Pisces:"Образное и творческое мышление" },
        venus: { Aries:"Страстные, прямые отношения", Taurus:"Чувственность, уют, стабильность", Gemini:"Лёгкий флирт, интеллектуальное притяжение", Cancer:"Нежность и забота в любви", Leo:"Романтика и яркие жесты", Virgo:"Скромность, служение партнёру", Libra:"Гармония и красота в отношениях", Scorpio:"Страсть и глубина связи", Sagittarius:"Свобода и приключения вместе", Capricorn:"Серьёзные и долгосрочные отношения", Aquarius:"Дружба и независимость", Pisces:"Идеализм и романтика" },
        mars: { Aries:"Максимум энергии и решительности", Taurus:"Упорная, медленная сила", Gemini:"Энергия в словах и идеях", Cancer:"Защитная энергия, осторожность", Leo:"Смелость и амбиции", Virgo:"Трудолюбие и точность", Libra:"Борьба за справедливость", Scorpio:"Интенсивная воля и контроль", Sagittarius:"Энтузиазм и авантюризм", Capricorn:"Карьерные амбиции и выносливость", Aquarius:"Борьба за перемены", Pisces:"Скрытая энергия и духовность" },
        jupiter: { Aries:"Удача в смелых начинаниях", Taurus:"Рост через стабильность", Gemini:"Расширение через знания и связи", Cancer:"Благополучие семьи и интуиция", Leo:"Щедрость и признание", Virgo:"Рост через служение", Libra:"Удача в партнёрстве", Scorpio:"Трансформационный рост", Sagittarius:"Мудрость и духовность расцветают", Capricorn:"Карьерное продвижение", Aquarius:"Рост через сообщество", Pisces:"Духовная удача и сострадание" },
        saturn: { Aries:"Дисциплина в действиях важна", Taurus:"Финансовая структура и терпение", Gemini:"Ответственность в коммуникации", Cancer:"Уроки семьи и безопасности", Leo:"Урок скромности и труда", Virgo:"Мастерство через детали", Libra:"Ответственность в отношениях", Scorpio:"Глубокие кармические уроки", Sagittarius:"Ограничения в убеждениях", Capricorn:"Сила и карьерные достижения", Aquarius:"Реформы через дисциплину", Pisces:"Духовные ограничения и рост" },
        rahu: { Aries:"Желание лидерства и власти", Taurus:"Влечение к материальному", Gemini:"Одержимость информацией", Cancer:"Тяга к безопасности и семье", Leo:"Жажда признания и славы", Virgo:"Стремление к совершенству", Libra:"Одержимость отношениями", Scorpio:"Влечение к тайнам", Sagittarius:"Жажда мудрости и путешествий", Capricorn:"Карьерные амбиции", Aquarius:"Тяга к инновациям", Pisces:"Духовный поиск" },
        ketu: { Aries:"Освобождение от агрессии", Taurus:"Отпустить привязанность к вещам", Gemini:"Освободиться от поверхностности", Cancer:"Отпустить прошлое и семейные шаблоны", Leo:"Освобождение от эго", Virgo:"Отпустить перфекционизм", Libra:"Освободиться от зависимости", Scorpio:"Отпустить контроль", Sagittarius:"Освобождение от догм", Capricorn:"Отпустить чрезмерные амбиции", Aquarius:"Освободиться от отстранённости", Pisces:"Растворение иллюзий" },
      },
      en: {
        sun: { Aries:"Will and initiative are strong", Taurus:"Stability and persistence", Gemini:"Mental flexibility, communication", Cancer:"Intuition leads, family matters", Leo:"Charisma and creativity peak", Virgo:"Precision and service", Libra:"Diplomacy and partnership", Scorpio:"Depth and transformation", Sagittarius:"Optimism and expansion", Capricorn:"Career and discipline", Aquarius:"Innovation and freedom", Pisces:"Spirituality and compassion" },
        moon: { Aries:"Impulsive emotional tone", Taurus:"Calm, need for comfort", Gemini:"Shifting moods, talkative", Cancer:"Deep feelings, intuition strong", Leo:"Generous, seeks attention", Virgo:"Anxious, craves order", Libra:"Need for harmony", Scorpio:"Intense emotions", Sagittarius:"Optimistic mood", Capricorn:"Reserved and serious", Aquarius:"Detached, original", Pisces:"Dreamy and sensitive" },
        mercury: { Aries:"Quick decisions, direct talk", Taurus:"Slow, practical thinking", Gemini:"Wit and communication shine", Cancer:"Intuitive mind, strong memory", Leo:"Charismatic speech", Virgo:"Analytical and precise", Libra:"Diplomatic in words", Scorpio:"Perceptive and probing", Sagittarius:"Philosophical outlook", Capricorn:"Structured thinking", Aquarius:"Unconventional ideas", Pisces:"Creative, imaginative mind" },
        venus: { Aries:"Passionate, direct love", Taurus:"Sensual comfort and stability", Gemini:"Light flirting, intellectual pull", Cancer:"Tender and nurturing", Leo:"Romance and grand gestures", Virgo:"Modest, serving partner", Libra:"Harmony and beauty in love", Scorpio:"Intense and deep bonds", Sagittarius:"Freedom and adventure together", Capricorn:"Serious long-term bonds", Aquarius:"Friendship and independence", Pisces:"Idealism and romance" },
        mars: { Aries:"Maximum energy and drive", Taurus:"Persistent steady force", Gemini:"Energy through words and ideas", Cancer:"Protective energy, caution", Leo:"Bold and ambitious", Virgo:"Hardworking precision", Libra:"Fighting for fairness", Scorpio:"Intense will and control", Sagittarius:"Enthusiasm and adventure", Capricorn:"Career drive and endurance", Aquarius:"Fighting for change", Pisces:"Hidden energy and spirituality" },
        jupiter: { Aries:"Luck in bold ventures", Taurus:"Growth through stability", Gemini:"Expansion via knowledge", Cancer:"Family prosperity, intuition", Leo:"Generosity and recognition", Virgo:"Growth through service", Libra:"Luck in partnerships", Scorpio:"Transformational growth", Sagittarius:"Wisdom and spirituality flourish", Capricorn:"Career advancement", Aquarius:"Growth through community", Pisces:"Spiritual luck and compassion" },
        saturn: { Aries:"Discipline in actions needed", Taurus:"Financial structure, patience", Gemini:"Responsibility in communication", Cancer:"Family and security lessons", Leo:"Lesson of humility and work", Virgo:"Mastery through details", Libra:"Accountability in relationships", Scorpio:"Deep karmic lessons", Sagittarius:"Limits in beliefs", Capricorn:"Strength and career achievement", Aquarius:"Reform through discipline", Pisces:"Spiritual limits and growth" },
        rahu: { Aries:"Craving leadership and power", Taurus:"Pull toward material things", Gemini:"Obsession with information", Cancer:"Yearning for security", Leo:"Craving recognition", Virgo:"Drive for perfection", Libra:"Obsession with relationships", Scorpio:"Pull toward secrets", Sagittarius:"Craving wisdom and travel", Capricorn:"Career ambitions", Aquarius:"Pull toward innovation", Pisces:"Spiritual seeking" },
        ketu: { Aries:"Release aggression patterns", Taurus:"Let go of material attachment", Gemini:"Release superficiality", Cancer:"Release past family patterns", Leo:"Release ego", Virgo:"Release perfectionism", Libra:"Release dependency", Scorpio:"Release need to control", Sagittarius:"Release dogma", Capricorn:"Release excess ambition", Aquarius:"Release detachment", Pisces:"Dissolve illusions" },
      },
    };

    // Grid 3×3 — cells sized to fill available space
    const gridPlanets = [sun, moon, mercury, venus, mars, jupiter, saturn, rahu, ketu];
    const GRID_KEYS   = ["sun","moon","mercury","venus","mars","jupiter","saturn","rahu","ketu"];
    const cols3 = 3, gapX3 = 12, gapY3 = reportLayout.gridGapY;
    const cellW = Math.floor((W - 120 - gapX3 * 2) / 3);
    const cellH = reportLayout.gridCellH;
    const gx0 = 60, gy0 = y;

    gridPlanets.forEach((p, i) => {
      if (!p.planet) return;
      const col   = PLANET_COLOR[p.planet] || C.gold;
      const row   = Math.floor(i / cols3), col_ = i % cols3;
      const cx    = gx0 + col_ * (cellW + gapX3);
      const cy    = gy0 + row  * (cellH + gapY3);
      const pkey  = GRID_KEYS[i];
      const psign = p.sign || "";
      const desc  = PLANET_DESC[lang]?.[pkey]?.[psign] || "";

      rrect(ctx, cx, cy, cellW, cellH, 14, "rgba(255,255,255,0.028)", col, 0.22);
      ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 0.5;
      ctx.beginPath(); ctx.roundRect(cx, cy, cellW, 5, [14,14,0,0]); ctx.fill(); ctx.restore();

      const pn = isRu
        ? { sun:"Солнце",moon:"Луна",mars:"Марс",mercury:"Меркурий",jupiter:"Юпитер",venus:"Венера",saturn:"Сатурн",rahu:"Раху",ketu:"Кету" }[p.planet]
        : { sun:"Sun",moon:"Moon",mars:"Mars",mercury:"Mercury",jupiter:"Jupiter",venus:"Venus",saturn:"Saturn",rahu:"Rahu",ketu:"Ketu" }[p.planet];
      const signEl = ELEM_COLOR[SIGN_ELEM[psign]] || C.muted;
      const glyphY = cy + reportLayout.gridPlanetGlyphY;
      const lineY = cy + reportLayout.gridPlanetNameY;
      const centerX = cx + cellW / 2;
      glyphAt(ctx, PLANET_GLYPH[p.planet] || "★", centerX - (compact ? 32 : 40), glyphY, reportLayout.gridPlanetGlyphSize, col);
      t(ctx, "→", centerX, glyphY + 4, { size: compact ? 18 : 22, color: C.muted, align: "center", weight: "700" });
      glyphAt(ctx, SIGN_GLYPH[psign] || "?", centerX + (compact ? 34 : 42), glyphY, reportLayout.gridSignGlyphSize, signEl);
      t(ctx, `${pn} ${isRu ? "в" : "in"} ${sname(psign, isRu)}`, centerX, lineY, { size: reportLayout.gridPlanetNameSize, color: C.textBr, align: "center", weight: "600", maxW: cellW - 18 });

      if (p.retrograde && p.planet !== "rahu" && p.planet !== "ketu") {
        t(ctx, "℞", cx + cellW - 20, cy + 26, { size: 21, color: C.danger, align: "center", weight: "700" });
      }

      if (desc) {
        wrap(ctx, desc, cx + cellW/2, cy + reportLayout.gridDescY, cellW - 24, reportLayout.gridDescLineH, {
          size: reportLayout.gridDescSize,
          color: C.text,
          align: "center",
          weight: "300",
          alpha: 0.72,
          maxLines: compact ? 2 : 2,
        });
      }
    });

    y = gy0 + 3 * cellH + 2 * gapY3 + reportLayout.cardGap;
    hline(ctx, y, 0.18);
    y += reportLayout.cardGap;

    // ── RETROGRADES or ALL CLEAR ─────────────────────────────────────────
    if (retros.length > 0) {
      t(ctx, isRu ? "РЕТРОГРАДЫ" : "RETROGRADES", W/2, y + 6, { size: reportLayout.sectionTitleSize, color: C.danger, align: "center", weight: "700" });
      y += reportLayout.sectionGap;
      const RETRO_TIPS = {
        ru: { mercury:"Меркурий ℞ — перепроверяй данные, избегай подписей", venus:"Венера ℞ — пауза в отношениях, переосмысли ценности", mars:"Марс ℞ — сдержи импульсы, избегай конфликтов", jupiter:"Юпитер ℞ — внутренний рост важнее внешних целей", saturn:"Сатурн ℞ — пересмотри долгосрочные планы", rahu:"Раху ℞ — будь осторожен с иллюзиями", ketu:"Кету ℞ — время отпустить прошлое" },
        en:  { mercury:"Mercury ℞ — double-check data, avoid signing contracts", venus:"Venus ℞ — pause in relationships, reassess values", mars:"Mars ℞ — restrain impulses, avoid conflicts", jupiter:"Jupiter ℞ — inner growth over external goals", saturn:"Saturn ℞ — revisit long-term commitments", rahu:"Rahu ℞ — beware illusions", ketu:"Ketu ℞ — time to release the past" },
      };
      retros.slice(0, compact ? 2 : 3).forEach(p => {
        const col = PLANET_COLOR[p.planet] || C.danger;
        const tip = RETRO_TIPS[lang]?.[p.planet] || pname(p.planet, isRu) + " ℞";
        const retroLineH = compact ? 24 : 30;
        const retroTextH = measureWrapHeight(ctx, tip, W - 244, retroLineH, {
          size: reportLayout.retroTextSize,
          weight: "400",
          maxLines: 2,
        });
        const retroCardH = Math.max(reportLayout.retroCardH, retroTextH + (compact ? 42 : 52));
        rrect(ctx, 60, y, W-120, retroCardH, 12, "rgba(255,106,106,0.04)", col, 0.22);
        glyphAt(ctx, PLANET_GLYPH[p.planet] || "★", 112, y + reportLayout.retroCardH / 2, reportLayout.retroGlyphSize, col);
        wrap(ctx, tip, 172, y + reportLayout.retroTextY, W - 244, compact ? 28 : 34, {
          size: reportLayout.retroTextSize,
          color: C.text,
          align: "left",
          weight: "400",
          maxLines: compact ? 2 : 1,
        });
        y += reportLayout.retroCardH + reportLayout.retroGap;
      });
    } else {
      rrect(ctx, 60, y, W-120, 96, 12, "rgba(74,222,128,0.05)", C.green, 0.22);
      t(ctx, isRu ? "✓  Все планеты прямые" : "✓  All planets direct", W/2, y + 48, { size: 30, color: C.green, align: "center", weight: "600", glow: C.green });
      y += 110;
    }

    // ── DAY SUMMARY BOX ──────────────────────────────────────────────────
    y += 18;
    const summaryH = H - y - (compact ? 78 : 92);
    if (summaryH > 100) {
      rrect(ctx, 60, y, W-120, summaryH, 16, "rgba(255,255,255,0.02)", C.gold, 0.18);
      const DAY_SUMMARY = {
        ru: {
          good: `Луна в ${sname(moonSign, true)} и благоприятные планеты создают поддерживающий фон. Сегодня хорошее время для важных переговоров, творческих проектов и укрепления отношений. Используй этот день активно — энергия поддерживает рост и новые начинания.`,
          tense: `Планетарная обстановка сегодня требует внимательности. ${mercRetro ? "Меркурий ретроградный — избегай важных решений и подписей. " : ""}${moonDebil ? "Луна ослаблена — береги эмоциональный ресурс. " : ""}Сосредоточься на текущих задачах и отложи новые старты.`,
          neutral: `Луна в ${sname(moonSign, true)} задаёт умеренный тон дня. Хороший день для планирования, рутинных дел и спокойного общения. Баланс планет позволяет двигаться вперёд без излишнего напряжения.`,
        },
        en: {
          good: `Moon in ${moonSign} and favorable planets create a supportive backdrop. Today is a good time for important negotiations, creative projects and strengthening relationships. Use this day actively — energy supports growth and new beginnings.`,
          tense: `The planetary setup today calls for careful attention. ${mercRetro ? "Mercury retrograde — avoid important decisions and signings. " : ""}${moonDebil ? "Moon is weakened — protect your emotional resources. " : ""}Focus on current tasks and postpone new starts.`,
          neutral: `Moon in ${moonSign} sets a measured tone for the day. Good for planning, routine tasks and calm communication. Balanced planets allow forward movement without excess strain.`,
        },
      };
      const sumText = DAY_SUMMARY[lang]?.[tone] || "";
      wrap(ctx, sumText, 88, y + reportLayout.summaryTop, W - 176, reportLayout.summaryLineH, {
        size: reportLayout.summarySize,
        color: C.text,
        align: "left",
        weight: "300",
        maxHeight: summaryH - (reportLayout.summaryTop + 18),
      });
    }

    footer(ctx);
  }

  // ── Format 2: Natal Portrait ──────────────────────────────────────────────

  function renderNatalPortrait(ctx, chart, lang) {
    if (!chart) return false;
    const isRu = lang === "ru";
    const planets = chart.planets || {};
    const lagna   = chart.lagna   || {};
    const birth   = chart.birth   || {};
    const dasha   = chart.dashas?.current || {};

    drawStars(ctx, 17);
    drawNebula(ctx);
    corners(ctx);
    header(ctx, isRu ? "Натальный портрет" : "Natal Portrait");

    // Name
    const name = birth.name || (isRu ? "Натальная карта" : "Natal Chart");
    t(ctx, name, W/2, 224, { size: 58, color: C.textBr, align: "center", weight: "700", glow: C.indigo });

    // Birth data
    const bDate = birth.local_date ? birth.local_date.split("-").reverse().join(".") : "";
    const bTime = birth.local_time || "";
    const bPlace = [birth.city, birth.country].filter(Boolean).join(", ");
    t(ctx, [bDate, bTime].filter(Boolean).join("  ·  "), W/2, 290, { size: 30, color: C.gold, align: "center" });
    if (bPlace) t(ctx, bPlace, W/2, 334, { size: 26, color: C.muted, align: "center" });

    hline(ctx, 375);

    // ── Lagna block ─────────────────────────────────────────────────────────
    const lagnaSign = lagna.sign || "";
    const elemCol   = ELEM_COLOR[SIGN_ELEM[lagnaSign]] || C.gold;
    const signNameL = sname(lagnaSign, isRu);
    const elemLabel = isRu ? ELEM_RU[SIGN_ELEM[lagnaSign]] : SIGN_ELEM[lagnaSign];

    rrect(ctx, 60, 410, W - 120, 170, 16, "rgba(108,140,255,0.07)", elemCol, 0.3);
    t(ctx, isRu ? "АСЦЕНДЕНТ" : "ASCENDANT", W/2, 450, { size: 21, color: elemCol, align: "center", weight: "700" });
    t(ctx, signNameL, W/2, 530, { size: 70, color: elemCol, align: "center", weight: "800", glow: elemCol });
    const lagnaExtra = elemLabel || "";
    t(ctx, lagnaExtra, W/2, 572, { size: 24, color: C.muted, align: "center" });

    hline(ctx, 618);

    // ── Top planets (3 columns) ───────────────────────────────────────────
    const ORDER = ["sun","moon","mars","mercury","jupiter","venus","saturn","rahu","ketu"];
    const list  = ORDER.filter(k => planets[k]);
    const top   = list.slice(0, 6);
    const cols  = 3, cardW = 300, cardH = 240, gapX = 30, gapY = 20;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const gx0   = (W - gridW) / 2;
    const gy0   = 648;

    top.forEach((key, i) => {
      const p     = planets[key];
      const col   = PLANET_COLOR[key] || C.gold;
      const row   = Math.floor(i / cols), col_ = i % cols;
      const cx    = gx0 + col_ * (cardW + gapX);
      const cy    = gy0 + row  * (cardH + gapY);

      rrect(ctx, cx, cy, cardW, cardH, 14, "rgba(255,255,255,0.03)", col, 0.25);

      // colour bar top
      ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = col;
      ctx.beginPath(); ctx.roundRect(cx, cy, cardW, 5, [14,14,0,0]); ctx.fill(); ctx.restore();

      const abbr = (isRu ? PLANET_ABBR_RU : PLANET_ABBR)[key] || key.slice(0,3).toUpperCase();
      t(ctx, abbr, cx + cardW/2, cy + 54, { size: 26, color: col, align: "center", weight: "800" });
      t(ctx, pname(key, isRu), cx + cardW/2, cy + 92, { size: 28, color: C.textBr, align: "center", weight: "600" });

      const signStr = sname(p.sign, isRu) || "—";
      t(ctx, signStr, cx + cardW/2, cy + 134, { size: 24, color: C.muted, align: "center" });

      const houseLabel = isRu ? `Дом ${p.house||"?"}` : `House ${p.house||"?"}`;
      const digLabel   = p.dignity && p.dignity !== "neutral" ? (isRu ? { exalted:"↑ Сила", debilitated:"↓ Слаб", own_sign:"✦ Дома" }[p.dignity] || p.dignity : { exalted:"↑ Strong", debilitated:"↓ Weak", own_sign:"✦ Home" }[p.dignity] || p.dignity) : "";
      t(ctx, [houseLabel, digLabel, p.retrograde ? "℞" : ""].filter(Boolean).join("  "), cx + cardW/2, cy + 172, { size: 22, color: col, align: "center" });

      const nakStr = p.nakshatra ? p.nakshatra.slice(0, 9) + (p.nakshatra.length > 9 ? "." : "") : "";
      if (nakStr) t(ctx, nakStr, cx + cardW/2, cy + 210, { size: 19, color: C.muted, align: "center", alpha: 0.75 });
    });

    const afterGrid = gy0 + Math.ceil(top.length / cols) * (cardH + gapY) + 10;
    hline(ctx, afterGrid);

    // ── Current Dasha ────────────────────────────────────────────────────
    let dy = afterGrid + 50;
    if (dasha.mahadasha) {
      t(ctx, (isRu ? "ТЕКУЩИЙ ПЕРИОД" : "CURRENT PERIOD"), W/2, dy, { size: 22, color: C.gold, align: "center", weight: "700" });
      dy += 52;

      const mdKey = (dasha.mahadasha || "").toLowerCase();
      const adKey = (dasha.antardasha || "").toLowerCase();
      const mdCol = PLANET_COLOR[mdKey] || C.gold;
      const adCol = PLANET_COLOR[adKey] || C.violet;

      rrect(ctx, 80, dy, W - 160, 120, 14, "rgba(0,0,0,0.2)", mdCol, 0.3);
      const mdLabel = pname(mdKey, isRu);
      const adLabel = adKey ? pname(adKey, isRu) : "";
      const dashaStr = adLabel ? `${mdLabel}  →  ${adLabel}` : mdLabel;
      t(ctx, dashaStr, W/2, dy + 52, { size: 44, color: C.textBr, align: "center", weight: "700", glow: mdCol });

      if (dasha.mahadasha_end) {
        const endFmt = dasha.mahadasha_end.split("-").reverse().join(".");
        t(ctx, (isRu ? "до " : "until ") + endFmt, W/2, dy + 98, { size: 26, color: C.muted, align: "center" });
      }
      dy += 140;
    }

    footer(ctx, name, todayStr());
    return true;
  }

  // ── Format 3: Dasha Forecast ──────────────────────────────────────────────

  function renderDashaForecast(ctx, chart, lang) {
    if (!chart) return false;
    const isRu = lang === "ru";
    const dasha   = chart.dashas?.current || {};
    const birth   = chart.birth || {};
    const mdKey   = (dasha.mahadasha   || "").toLowerCase();
    const adKey   = (dasha.antardasha  || "").toLowerCase();
    const ptKey   = (dasha.pratyantardasha || "").toLowerCase();
    const mdCol   = PLANET_COLOR[mdKey] || C.gold;
    const adCol   = PLANET_COLOR[adKey] || C.violet;
    const ptCol   = PLANET_COLOR[ptKey] || C.teal;

    drawStars(ctx, 55);
    drawNebula(ctx);
    corners(ctx);
    header(ctx, isRu ? "Даша-прогноз" : "Dasha Forecast");

    const name = birth.name || "";
    if (name) t(ctx, name, W/2, 224, { size: 40, color: C.textBr, align: "center", weight: "600" });
    t(ctx, todayStr(), W/2, name ? 272 : 224, { size: 26, color: C.gold, align: "center" });

    hline(ctx, 310, 0.25);

    // ── Three-tier dasha display ─────────────────────────────────────────
    const tiers = [
      { key: mdKey, col: mdCol, label: isRu ? "Главный период" : "Main Period", start: dasha.mahadasha_start, end: dasha.mahadasha_end },
      { key: adKey, col: adCol, label: isRu ? "Подпериод" : "Sub-Period", start: dasha.antardasha_start, end: dasha.antardasha_end },
      { key: ptKey, col: ptCol, label: isRu ? "Мини-период" : "Mini-Period", start: null, end: dasha.pratyantardasha_end },
    ].filter(ti => ti.key);

    let ty = 360;
    const abbr = isRu ? PLANET_ABBR_RU : PLANET_ABBR;

    tiers.forEach((ti, idx) => {
      const blockH = idx === 0 ? 310 : 210;
      const bR = idx === 0 ? 150 : 100;
      rrect(ctx, 60, ty, W - 120, blockH, 16, "rgba(0,0,0,0.18)", ti.col, 0.3);

      // Left: circle
      planetCircle(ctx, 60 + bR + 30, ty + blockH/2, bR, ti.key, (abbr[ti.key] || "?"));

      // Right: info
      const rx = 60 + bR*2 + 80;
      const rw = W - 120 - bR*2 - 80 - 40;
      t(ctx, ti.label.toUpperCase(), rx, ty + (idx===0?60:46), { size: 20, color: ti.col, align: "left", weight: "700" });
      t(ctx, pname(ti.key, isRu), rx, ty + (idx===0?126:96), { size: idx===0?56:44, color: C.textBr, align: "left", weight: "800", glow: ti.col, maxW: rw });

      if (ti.start || ti.end) {
        const fmt = s => s ? s.split("-").reverse().join(".") : "—";
        const range = ti.start ? `${fmt(ti.start)} — ${fmt(ti.end)}` : (isRu ? "до " : "until ") + fmt(ti.end);
        t(ctx, range, rx, ty + (idx===0?184:148), { size: 24, color: C.muted, align: "left", maxW: rw });
      }

      if (idx === 0) {
        // Duration bar
        const barX = rx, barY = ty + 218, barW = rw, barH = 10;
        rrect(ctx, barX, barY, barW, barH, 5, "rgba(255,255,255,0.06)", null);
        if (ti.start && ti.end) {
          const now = Date.now();
          const s = new Date(ti.start).getTime(), e = new Date(ti.end).getTime();
          const pct = Math.min(1, Math.max(0, (now - s) / (e - s)));
          rrect(ctx, barX, barY, barW * pct, barH, 5, ti.col, null);
          ctx.save(); ctx.fillStyle = ti.col; ctx.globalAlpha = 0.6;
          ctx.beginPath(); ctx.arc(barX + barW * pct, barY + barH/2, 8, 0, Math.PI * 2); ctx.fill(); ctx.restore();
          t(ctx, Math.round(pct*100) + "%", rx + barW, barY + 8, { size: 20, color: ti.col, align: "right" });
        }
      }

      ty += blockH + 18;
    });

    hline(ctx, ty + 10);
    ty += 54;

    // Theme of current maha-dasha
    const THEMES = {
      ru: { sun:"Период самоопределения и власти. Карьера, отец, государственные структуры в фокусе.", moon:"Период эмоций и семьи. Интуиция сильна, важны отношения с матерью и общественностью.", mars:"Период энергии и конфликтов. Действие, братья, недвижимость, техника, хирургия.", mercury:"Период интеллекта и торговли. Коммуникации, образование, краткие поездки.", jupiter:"Период мудрости и расширения. Духовность, дети, учителя, удача и правосудие.", venus:"Период наслаждений. Любовь, искусство, роскошь, брак и материальный комфорт.", saturn:"Период кармических уроков. Дисциплина, ограничения, долгосрочный труд.", rahu:"Период амбиций и иллюзий. Нестандартный путь, иностранцы, технологии.", ketu:"Период отречения. Духовность, прошлые жизни, растворение эго." },
      en:  { sun:"A period of self-definition and authority. Career, father, government in focus.", moon:"A period of emotions and family. Intuition strong, mother and public relations key.", mars:"A period of energy and conflict. Action, siblings, property, technology, surgery.", mercury:"A period of intellect and commerce. Communication, education, short travel.", jupiter:"A period of wisdom and expansion. Spirituality, children, teachers, luck and justice.", venus:"A period of pleasures. Love, art, luxury, marriage and material comfort.", saturn:"A period of karmic lessons. Discipline, limitations, long-term labor.", rahu:"A period of ambition and illusions. Unconventional path, foreigners, technology.", ketu:"A period of renunciation. Spirituality, past lives, dissolution of the ego." },
    };

    const theme = THEMES[lang]?.[mdKey];
    if (theme) {
      t(ctx, isRu ? "О ПЕРИОДЕ" : "ABOUT THIS PERIOD", W/2, ty, { size: 22, color: C.gold, align: "center", weight: "700" });
      ty += 42;
      ty = wrap(ctx, theme, W/2, ty, W - 140, 58, { size: 34, color: C.text, align: "center", weight: "300" });
    }

    footer(ctx, "VEDIC ASTROLOGY", todayStr());
    return true;
  }

  // ── Format 4: Warning ────────────────────────────────────────────────────

  function renderWarning(ctx, chart, lang) {
    const isRu = lang === "ru";
    drawStars(ctx, 77);
    radialGlow(ctx, W/2, H*0.3, 0, W, "#d66b52", 0.12);
    radialGlow(ctx, W/2, H*0.7, 0, W*0.7, "#6c8cff", 0.07);
    corners(ctx);
    header(ctx, isRu ? "Астро-предупреждение" : "Astro Warning");

    t(ctx, todayStr(), W/2, 218, { size: 28, color: C.gold, align: "center" });
    hline(ctx, 255, 0.2);

    const planets = chart?.planets || {};
    const retro   = Object.entries(planets).filter(([,p]) => p.retrograde).map(([k]) => k);
    const debil   = Object.entries(planets).filter(([,p]) => p.dignity === "debilitated").map(([k]) => k);

    let y = 310;

    // ── Retrograde section ────────────────────────────────────────────────
    const retroLabel = isRu ? "РЕТРОГРАДНЫЕ ПЛАНЕТЫ" : "RETROGRADE PLANETS";
    t(ctx, retroLabel, W/2, y, { size: 24, color: C.danger, align: "center", weight: "700" });
    y += 46;

    const RETRO_MSG = {
      ru: { mercury:"Не подписывай договоры, дважды проверяй связь и данные", venus:"Пауза в отношениях — время переосмыслить ценности", mars:"Сдержи импульсы, избегай конфликтов и рискованных действий", jupiter:"Внутренний рост важнее внешних достижений и обещаний", saturn:"Пересмотри структуры, обязательства и долгосрочные планы", rahu:"Иллюзии усиливаются — проверяй факты, избегай манипуляций", ketu:"Время отпустить прошлое и углубиться в духовную практику" },
      en:  { mercury:"Avoid signing contracts, double-check all communications and data", venus:"Pause in relationships — time to reconsider values and desires", mars:"Restrain impulses, avoid conflicts and risky actions", jupiter:"Inner growth over outer achievements and promises", saturn:"Revisit structures, commitments and long-term plans", rahu:"Illusions amplified — verify facts, beware of manipulation", ketu:"Time to release the past and deepen spiritual practice" },
    };

    if (retro.length === 0) {
      rrect(ctx, 80, y, W-160, 90, 14, "rgba(74,222,128,0.07)", C.green, 0.3);
      t(ctx, isRu ? "✓  Все планеты прямые" : "✓  All planets direct", W/2, y + 52, { size: 38, color: C.green, align: "center", weight: "600", glow: C.green });
      y += 110;
    } else {
      retro.slice(0, 5).forEach(k => {
        const col = PLANET_COLOR[k] || C.danger;
        const msg = RETRO_MSG[lang]?.[k] || pname(k, isRu);
        const abbr = (isRu ? PLANET_ABBR_RU : PLANET_ABBR)[k];
        rrect(ctx, 60, y, W-120, 118, 14, "rgba(214,107,82,0.06)", col, 0.25);
        badge(ctx, 130, y + 59, 100, 56, col, abbr, col, 22);
        t(ctx, pname(k, isRu), 210, y + 38, { size: 30, color: C.textBr, align: "left", weight: "700" });
        wrap(ctx, msg, 210, y + 74, W - 290, 48, { size: 26, color: C.text, align: "left", weight: "300" });
        y += 136;
      });
    }

    hline(ctx, y + 10, 0.2);
    y += 54;

    // ── Debilitated section ───────────────────────────────────────────────
    const debilLabel = isRu ? "ПЛАНЕТЫ В ПАДЕНИИ" : "DEBILITATED PLANETS";
    t(ctx, debilLabel, W/2, y, { size: 24, color: C.amber, align: "center", weight: "700" });
    y += 46;

    const DEBIL_MSG = {
      ru: { sun:"Низкая уверенность, трудности с авторитетом и признанием", moon:"Эмоциональная нестабильность, тревожность, отношения с матерью сложны", mars:"Трудности с энергией и решительностью, риск пассивности", mercury:"Непоследовательность мышления, коммуникативные сбои", jupiter:"Ограниченная мудрость, трудности с учителями и деньгами", venus:"Сложности в отношениях и с самооценкой, финансовые напряжения", saturn:"Нестабильная дисциплина, хаос в структурах и обязательствах" },
      en:  { sun:"Low confidence, difficulties with authority and recognition", moon:"Emotional instability, anxiety, difficult relationship with mother", mars:"Low energy and decisiveness, risk of passivity", mercury:"Inconsistent thinking, communication breakdowns", jupiter:"Limited wisdom, difficulties with teachers and finances", venus:"Challenges in relationships and self-worth, financial tension", saturn:"Unstable discipline, chaos in structures and commitments" },
    };

    if (debil.length === 0) {
      rrect(ctx, 80, y, W-160, 90, 14, "rgba(74,222,128,0.07)", C.green, 0.3);
      t(ctx, isRu ? "✓  Нет планет в падении" : "✓  No debilitated planets", W/2, y + 52, { size: 38, color: C.green, align: "center", weight: "600", glow: C.green });
      y += 110;
    } else {
      debil.slice(0, 3).forEach(k => {
        const col = PLANET_COLOR[k] || C.amber;
        const msg = DEBIL_MSG[lang]?.[k] || "";
        const abbr = (isRu ? PLANET_ABBR_RU : PLANET_ABBR)[k];
        rrect(ctx, 60, y, W-120, 118, 14, "rgba(168,115,48,0.08)", col, 0.25);
        badge(ctx, 130, y + 59, 100, 56, col, abbr, col, 22);
        t(ctx, pname(k, isRu), 210, y + 38, { size: 30, color: C.textBr, align: "left", weight: "700" });
        wrap(ctx, msg, 210, y + 74, W - 290, 48, { size: 26, color: C.text, align: "left", weight: "300" });
        y += 136;
      });
    }

    footer(ctx, "VEDIC ASTROLOGY", todayStr());
    return true;
  }

  // ── Format 5: Sign & Shadow ───────────────────────────────────────────────

  function renderSignShadow(ctx, chart, lang) {
    if (!chart) return false;
    const isRu   = lang === "ru";
    const lagna   = chart.lagna || {};
    const sign    = lagna.sign;
    if (!sign) return false;

    const elemKey = SIGN_ELEM[sign] || "Fire";
    const col     = ELEM_COLOR[elemKey] || C.gold;
    const signName = sname(sign, isRu);
    const birth   = chart.birth || {};

    drawStars(ctx, 31);
    drawNebula(ctx);
    corners(ctx);
    header(ctx, isRu ? "Знак и его тень" : "Sign & Its Shadow");

    // Name + birth
    const name = birth.name || "";
    if (name) t(ctx, name, W/2, 224, { size: 40, color: C.textBr, align: "center", weight: "600" });

    hline(ctx, name ? 258 : 240, 0.2);

    // Sign hero
    const heroY = name ? 280 : 260;
    t(ctx, signName, W/2, heroY + 96, { size: 120, color: col, align: "center", weight: "800", glow: col });
    const elemRu = isRu ? ELEM_RU[elemKey] : elemKey;
    const lagnaLine = elemRu || "";
    t(ctx, lagnaLine, W/2, heroY + 148, { size: 28, color: C.muted, align: "center" });

    hline(ctx, heroY + 218);

    const SIGN_DATA = {
      ru: {
        Aries:       { light:["Смелость","Инициатива","Энергия","Честность"],            shadow:["Импульсивность","Агрессия","Нетерпение","Эгоцентризм"],         essence:"Пионер Зодиака. Жизнь — это битва и победа." },
        Taurus:      { light:["Надёжность","Терпение","Практичность","Верность"],         shadow:["Упрямство","Жадность","Застой","Зависть"],                      essence:"Строитель Зодиака. Ценит стабильность и красоту." },
        Gemini:      { light:["Гибкость","Любопытство","Общение","Адаптивность"],         shadow:["Поверхностность","Двойственность","Тревога","Непостоянство"],   essence:"Посланник Зодиака. Жизнь — это поток информации." },
        Cancer:      { light:["Забота","Интуиция","Глубина","Преданность"],               shadow:["Обидчивость","Замкнутость","Манипуляция","Страх потери"],       essence:"Хранитель Зодиака. Дом и семья — его мир." },
        Leo:         { light:["Щедрость","Лидерство","Творчество","Великодушие"],         shadow:["Гордость","Эгоцентризм","Тщеславие","Потребность в признании"], essence:"Король Зодиака. Живёт, чтобы сиять." },
        Virgo:       { light:["Анализ","Служение","Точность","Скромность"],               shadow:["Критичность","Тревожность","Перфекционизм","Самоедство"],       essence:"Мастер Зодиака. Совершенство в деталях." },
        Libra:       { light:["Гармония","Справедливость","Красота","Дипломатия"],        shadow:["Нерешительность","Зависимость","Двуличие","Избегание"],         essence:"Дипломат Зодиака. Ищет баланс во всём." },
        Scorpio:     { light:["Глубина","Трансформация","Страсть","Проницательность"],    shadow:["Ревность","Манипуляция","Разрушение","Мстительность"],          essence:"Феникс Зодиака. Умирает и возрождается." },
        Sagittarius: { light:["Оптимизм","Мудрость","Свобода","Щедрость"],                shadow:["Безответственность","Догматизм","Самонадеянность","Беспечность"],essence:"Философ Зодиака. Горизонт зовёт." },
        Capricorn:   { light:["Амбиция","Дисциплина","Мастерство","Терпение"],            shadow:["Холодность","Жёсткость","Пессимизм","Страх неудачи"],           essence:"Архитектор Зодиака. Строит на века." },
        Aquarius:    { light:["Инновации","Гуманизм","Независимость","Оригинальность"],   shadow:["Отстранённость","Непредсказуемость","Упрямство","Бунт"],        essence:"Визионер Зодиака. Живёт в будущем." },
        Pisces:      { light:["Сострадание","Творчество","Духовность","Интуиция"],        shadow:["Уход от реальности","Жертвенность","Иллюзии","Непостоянство"],  essence:"Мистик Зодиака. Растворяется в бесконечном." },
      },
      en: {
        Aries:       { light:["Courage","Initiative","Energy","Honesty"],                  shadow:["Impulsiveness","Aggression","Impatience","Selfishness"],         essence:"The Pioneer of the Zodiac. Life is a battle to be won." },
        Taurus:      { light:["Reliability","Patience","Practicality","Loyalty"],          shadow:["Stubbornness","Greed","Stagnation","Envy"],                     essence:"The Builder. Values stability and beauty above all." },
        Gemini:      { light:["Flexibility","Curiosity","Communication","Adaptability"],   shadow:["Superficiality","Duality","Anxiety","Inconsistency"],           essence:"The Messenger. Life is an endless flow of ideas." },
        Cancer:      { light:["Care","Intuition","Depth","Devotion"],                      shadow:["Sensitivity","Withdrawal","Manipulation","Fear of loss"],       essence:"The Nurturer. Home and family are their world." },
        Leo:         { light:["Generosity","Leadership","Creativity","Magnanimity"],       shadow:["Pride","Ego","Vanity","Need for approval"],                    essence:"The King. Born to shine and be seen." },
        Virgo:       { light:["Analysis","Service","Precision","Humility"],                shadow:["Criticism","Anxiety","Perfectionism","Self-doubt"],            essence:"The Craftsman. Perfection lives in the details." },
        Libra:       { light:["Harmony","Justice","Beauty","Diplomacy"],                   shadow:["Indecision","Dependency","Duplicity","Avoidance"],              essence:"The Diplomat. Always seeking balance." },
        Scorpio:     { light:["Depth","Transformation","Passion","Perception"],            shadow:["Jealousy","Manipulation","Destruction","Vengeance"],            essence:"The Phoenix. Dies and is reborn." },
        Sagittarius: { light:["Optimism","Wisdom","Freedom","Generosity"],                 shadow:["Irresponsibility","Dogmatism","Overconfidence","Carelessness"], essence:"The Philosopher. The horizon always calls." },
        Capricorn:   { light:["Ambition","Discipline","Mastery","Patience"],               shadow:["Coldness","Rigidity","Pessimism","Fear of failure"],            essence:"The Architect. Builds for the ages." },
        Aquarius:    { light:["Innovation","Humanism","Independence","Originality"],       shadow:["Detachment","Unpredictability","Stubbornness","Rebellion"],     essence:"The Visionary. Lives in the future." },
        Pisces:      { light:["Compassion","Creativity","Spirituality","Intuition"],       shadow:["Escapism","Martyrdom","Illusions","Inconsistency"],             essence:"The Mystic. Dissolves into the infinite." },
      },
    };

    const data   = SIGN_DATA[lang]?.[sign] || { light:[], shadow:[], essence:"" };
    let y = heroY + 244;

    // Essence quote
    if (data.essence) {
      rrect(ctx, 80, y, W-160, 100, 14, "rgba(255,255,255,0.03)", col, 0.2);
      wrap(ctx, `"${data.essence}"`, W/2, y + 34, W - 180, 52, { size: 30, color: C.text, align: "center", weight: "300" });
      y += 120;
    }

    hline(ctx, y, 0.18);
    y += 42;

    // Light traits
    t(ctx, isRu ? "✦  СИЛА" : "✦  STRENGTHS", W/2, y, { size: 26, color: C.green, align: "center", weight: "700" });
    y += 42;
    const lCols = 2, lItemH = 64, lGap = 16, lW = (W - 160 - lGap) / lCols;
    data.light.slice(0, 4).forEach((item, i) => {
      const cx = 80 + (i % lCols) * (lW + lGap) + lW/2;
      const cy = y + Math.floor(i / lCols) * (lItemH + 10);
      rrect(ctx, cx - lW/2, cy, lW, lItemH, 10, "rgba(74,222,128,0.08)", C.green, 0.25);
      t(ctx, item, cx, cy + 40, { size: 28, color: C.green, align: "center", weight: "500", maxW: lW - 20 });
    });
    y += Math.ceil(data.light.length / lCols) * (lItemH + 10) + 14;

    hline(ctx, y, 0.15);
    y += 42;

    // Shadow traits
    t(ctx, isRu ? "☽  ТЕНЬ" : "☽  SHADOW", W/2, y, { size: 26, color: C.danger, align: "center", weight: "700" });
    y += 42;
    data.shadow.slice(0, 4).forEach((item, i) => {
      const cx = 80 + (i % lCols) * (lW + lGap) + lW/2;
      const cy = y + Math.floor(i / lCols) * (lItemH + 10);
      rrect(ctx, cx - lW/2, cy, lW, lItemH, 10, "rgba(255,106,106,0.08)", C.danger, 0.25);
      t(ctx, item, cx, cy + 40, { size: 28, color: C.danger, align: "center", weight: "500", maxW: lW - 20 });
    });

    footer(ctx, name || "VEDIC ASTROLOGY", todayStr());
    return true;
  }

  // ── Canvas helpers for multi-slot ───────────────────────────────────────────

  function makeCtxForSlot(index) {
    const canvas = document.getElementById(`cardsCanvas${index}`);
    const frame = getFrameConfig();
    W = frame.width;
    H = frame.height;
    canvas.width = frame.width;
    canvas.height = frame.height;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return ctx;
  }

  // ── Day Report Card 2: Warnings ───────────────────────────────────────────

  function renderDayWarnings(ctx, lang, transits) {
    const isRu   = lang === "ru";
    const compact = isPostFrame();
    const planets = transits.planets || [];
    const retros  = planets.filter(p => p.retrograde && p.planet !== "sun" && p.planet !== "moon");
    const stressP = planets.filter(p => p.dignity === "debilitated");

    const moon    = planets.find(p => p.planet === "moon")    || {};
    const sun     = planets.find(p => p.planet === "sun")     || {};
    const mercury = planets.find(p => p.planet === "mercury") || {};
    const venus   = planets.find(p => p.planet === "venus")   || {};
    const mars    = planets.find(p => p.planet === "mars")    || {};
    const jupiter = planets.find(p => p.planet === "jupiter") || {};
    const saturn  = planets.find(p => p.planet === "saturn")  || {};

    const warnLayout = compact ? {
      dateY: 82,
      dateSize: 26,
      badgeY: 138,
      dividerY: 176,
      startY: 204,
      sectionTitleSize: 20,
      sectionGap: 24,
      sectionDividerGap: 22,
      cleanBoxH: 118,
      cleanTextSize: 28,
      cleanLineH: 44,
      retroCardH: 96,
      retroGap: 12,
      retroLine1Size: 23,
      retroLine2Size: 20,
      retroLine2Y: 66,
      listCardH: 84,
      listGap: 12,
      listTextSize: 22,
      listLineH: 28,
      summaryTop: 34,
      summarySize: 25,
      summaryLineH: 42,
    } : {
      dateY: 88,
      dateSize: 28,
      badgeY: 144,
      dividerY: 182,
      startY: 212,
      sectionTitleSize: 22,
      sectionGap: 26,
      sectionDividerGap: 28,
      cleanBoxH: 130,
      cleanTextSize: 30,
      cleanLineH: 52,
      retroCardH: 116,
      retroGap: 14,
      retroLine1Size: 27,
      retroLine2Size: 23,
      retroLine2Y: 76,
      listCardH: 100,
      listGap: 14,
      listTextSize: 25,
      listLineH: 32,
      summaryTop: 44,
      summarySize: 30,
      summaryLineH: 54,
    };

    drawStars(ctx, 13);
    radialGlow(ctx, W*0.5, H*0.25, 0, W*0.8, "#d66b52", 0.10);
    radialGlow(ctx, W*0.8, H*0.6,  0, W*0.6, "#6c8cff", 0.07);
    corners(ctx, 60, 60);

    // ── HEADER ───────────────────────────────────────────────────────────
    t(ctx, todayStr(), W/2, warnLayout.dateY, { size: warnLayout.dateSize, color: C.muted, align: "center", weight: "300" });
    badge(ctx, W/2, warnLayout.badgeY, 460, 54, C.amber, (isRu ? "На что обратить внимание" : "Points of Attention").toUpperCase(), C.amber, 20);
    hline(ctx, warnLayout.dividerY, 0.25);

    let y = warnLayout.startY;

    // ── NO ISSUES: clean day ─────────────────────────────────────────────
    if (retros.length === 0 && stressP.length === 0) {
      rrect(ctx, 60, y, W-120, warnLayout.cleanBoxH, 16, "rgba(74,222,128,0.06)", C.green, 0.3);
      t(ctx, "✓", W/2, y + 52, { size: 56, color: C.green, align: "center", glow: C.green });
      t(ctx, isRu ? "Всё спокойно" : "All clear", W/2, y + warnLayout.cleanBoxH - 20, { size: compact ? 30 : 34, color: C.green, align: "center", weight: "600" });
      y += warnLayout.cleanBoxH + 18;

      // Explain what a clean day means
      const cleanText = isRu
        ? "Сегодня все планеты прямые, нет ни одной в падении. Это редкий, спокойный день — планетарные энергии работают без помех. Хорошее время для переговоров, принятия решений, начала новых проектов и укрепления отношений."
        : "Today all planets are direct with none debilitated. This is a rare, clean day — planetary energies flow without obstruction. A good time for negotiations, decisions, new project launches and strengthening relationships.";
      y = wrap(ctx, cleanText, 80, y + 16, W - 160, warnLayout.cleanLineH, { size: warnLayout.cleanTextSize, color: C.text, align: "left", weight: "300" });
      y += 20;
    } else {
      // ── RETROGRADES ─────────────────────────────────────────────────────
      if (retros.length > 0) {
        t(ctx, isRu ? "РЕТРОГРАДНЫЕ" : "RETROGRADE", W/2, y, { size: warnLayout.sectionTitleSize, color: C.danger, align: "center", weight: "700" });
        y += warnLayout.sectionGap;

        const RETRO_DATA = {
          ru: {
            mercury: { line1: "Меркурий ℞ — коммуникации под вопросом", line2: "Избегай подписей, дважды проверяй договоры и данные" },
            venus:   { line1: "Венера ℞ — пауза в отношениях и финансах", line2: "Время переосмыслить ценности, не начинать новых романов" },
            mars:    { line1: "Марс ℞ — энергия нестабильна", line2: "Сдержи импульсы, избегай конфликтов и рискованных действий" },
            jupiter: { line1: "Юпитер ℞ — внутренний рост важнее внешнего", line2: "Хорошее время для переосмысления убеждений и обязательств" },
            saturn:  { line1: "Сатурн ℞ — пересмотри долгосрочные структуры", line2: "Старые обязательства выходят на поверхность — разберись с ними" },
            rahu:    { line1: "Раху ℞ — иллюзии усиливаются", line2: "Проверяй факты, избегай манипуляций и чрезмерных обещаний" },
            ketu:    { line1: "Кету ℞ — время отпустить прошлое", line2: "Отстранись от ненужного, углубись в духовную практику" },
          },
          en: {
            mercury: { line1: "Mercury ℞ — communications are unreliable", line2: "Avoid signings, double-check contracts and all data" },
            venus:   { line1: "Venus ℞ — pause in relationships and finances", line2: "Time to reassess values, avoid starting new romances" },
            mars:    { line1: "Mars ℞ — energy is unstable", line2: "Restrain impulses, avoid conflicts and risky actions" },
            jupiter: { line1: "Jupiter ℞ — inner growth over outer achievement", line2: "Good time to reconsider beliefs and commitments" },
            saturn:  { line1: "Saturn ℞ — revisit long-term structures", line2: "Old commitments resurface — deal with them consciously" },
            rahu:    { line1: "Rahu ℞ — illusions are amplified", line2: "Verify facts, beware of manipulation and over-promising" },
            ketu:    { line1: "Ketu ℞ — time to release the past", line2: "Detach from the unnecessary, deepen spiritual practice" },
          },
        };

        retros.slice(0, compact ? 2 : 4).forEach(p => {
          const col  = PLANET_COLOR[p.planet] || C.danger;
          const data = RETRO_DATA[lang]?.[p.planet] || { line1: pname(p.planet, isRu) + " ℞", line2: "" };
          rrect(ctx, 60, y, W-120, warnLayout.retroCardH, 10, "rgba(255,106,106,0.05)", col, 0.22);
          glyphAt(ctx, PLANET_GLYPH[p.planet] || "★", 104, y + warnLayout.retroCardH / 2, compact ? 32 : 34, col);
          t(ctx, data.line1, 164, y + 34, { size: warnLayout.retroLine1Size, color: C.textBr, align: "left", weight: "600", maxW: W - 240 });
          wrap(ctx, data.line2, 164, y + warnLayout.retroLine2Y, W - 240, compact ? 24 : 28, {
            size: warnLayout.retroLine2Size,
            color: C.text,
            align: "left",
            weight: "300",
            alpha: 0.8,
            maxLines: compact ? 2 : 2,
          });
          y += warnLayout.retroCardH + warnLayout.retroGap;
        });
        y += 8;
      }

      // ── STRESSED PLANETS ─────────────────────────────────────────────────
      if (stressP.length > 0) {
        hline(ctx, y, 0.15);
        y += warnLayout.sectionDividerGap;
        t(ctx, isRu ? "ОСЛАБЛЕННЫЕ ПЛАНЕТЫ" : "STRESSED PLANETS", W/2, y, { size: warnLayout.sectionTitleSize, color: C.amber, align: "center", weight: "700" });
        y += warnLayout.sectionGap;

        const STRESS_DATA = {
          ru: {
            sun:     { line1: "Солнце в падении — самооценка снижена", line2: "Избегай публичных решений и конфронтации" },
            moon:    { line1: "Луна слаба — эмоциональная нестабильность", line2: "Время для тишины, отдыха и бережного отношения к себе" },
            mars:    { line1: "Марс в падении — энергия рассеяна", line2: "Не начинай крупных дел, береги физический ресурс" },
            mercury: { line1: "Меркурий ослаблен — мышление неясное", line2: "Перепроверяй важные данные и решения" },
            jupiter: { line1: "Юпитер в падении — оптимизм занижен", line2: "Осторожно с обещаниями, избегай чрезмерных трат" },
            venus:   { line1: "Венера ослаблена — отношения и финансы уязвимы", line2: "Выжди с новыми романами и крупными покупками" },
            saturn:  { line1: "Сатурн в падении — структуры шатаются", line2: "Держи дисциплину, избегай хаотичных решений" },
          },
          en: {
            sun:     { line1: "Sun debilitated — confidence is reduced", line2: "Avoid public decisions and confrontation today" },
            moon:    { line1: "Moon weak — emotional instability present", line2: "Time for quiet, rest and self-care" },
            mars:    { line1: "Mars debilitated — energy is scattered", line2: "Don't start major projects, preserve physical resources" },
            mercury: { line1: "Mercury debilitated — thinking is unclear", line2: "Double-check important data and decisions" },
            jupiter: { line1: "Jupiter debilitated — optimism is low", line2: "Be careful with promises, avoid excessive spending" },
            venus:   { line1: "Venus weak — relationships and finances vulnerable", line2: "Wait on new romances and large purchases" },
            saturn:  { line1: "Saturn debilitated — structures are shaky", line2: "Maintain discipline, avoid chaotic decisions" },
          },
        };

        stressP.slice(0, compact ? 2 : 3).forEach(p => {
          const col  = PLANET_COLOR[p.planet] || C.amber;
          const data = STRESS_DATA[lang]?.[p.planet] || { line1: pname(p.planet, isRu), line2: "" };
          rrect(ctx, 60, y, W-120, warnLayout.retroCardH, 10, "rgba(168,115,48,0.06)", col, 0.22);
          glyphAt(ctx, PLANET_GLYPH[p.planet] || "★", 104, y + warnLayout.retroCardH / 2, compact ? 32 : 34, col);
          t(ctx, data.line1, 164, y + 34, { size: warnLayout.retroLine1Size, color: C.textBr, align: "left", weight: "600", maxW: W - 240 });
          wrap(ctx, data.line2, 164, y + warnLayout.retroLine2Y, W - 240, compact ? 24 : 28, {
            size: warnLayout.retroLine2Size,
            color: C.text,
            align: "left",
            weight: "300",
            alpha: 0.8,
            maxLines: compact ? 2 : 2,
          });
          y += warnLayout.retroCardH + warnLayout.retroGap;
        });
        y += 8;
      }
    }

    // ── WHAT TO DO TODAY ─────────────────────────────────────────────────
    hline(ctx, y, 0.15);
    y += warnLayout.sectionDividerGap;
    t(ctx, isRu ? "ЧТО ДЕЛАТЬ СЕГОДНЯ" : "WHAT TO DO TODAY", W/2, y, { size: warnLayout.sectionTitleSize, color: C.green, align: "center", weight: "700" });
    y += warnLayout.sectionGap;

    const mercOk  = !mercury.retrograde && mercury.dignity !== "debilitated";
    const venusOk = !venus.retrograde   && venus.dignity   !== "debilitated";
    const marsOk  = !mars.retrograde    && mars.dignity    !== "debilitated";
    const jupOk   = !jupiter.retrograde && jupiter.dignity !== "debilitated";
    const satOk   = !saturn.retrograde  && saturn.dignity  !== "debilitated";
    const moonStr = moon.dignity === "exalted" || moon.dignity === "own_sign";

    const DO_ITEMS_RU = [
      mercOk ? `Меркурий активен в ${sname(mercury.sign, true)} — хорошее время для переговоров и планирования` : `Меркурий ослаблен — перепроверяй все коммуникации дважды`,
      venusOk ? `Венера благоприятна — уделяй время близким и творческим делам` : `Сохраняй гармонию в отношениях, избегай финансовых импульсов`,
      marsOk ? `Марс даёт энергию — направь её на конкретные задачи и физическую активность` : `Бери дела постепенно, не перегружай себя`,
      moonStr ? `Луна сильна — доверяй интуиции и принимай важные решения` : `Слушай эмоциональные сигналы, давай себе время на восстановление`,
    ];
    const DO_ITEMS_EN = [
      mercOk ? `Mercury active in ${mercury.sign} — good time for negotiations and planning` : `Mercury weakened — double-check all communications`,
      venusOk ? `Venus favorable — invest time in relationships and creative work` : `Maintain harmony in relationships, avoid financial impulses`,
      marsOk ? `Mars gives energy — direct it toward concrete tasks and physical activity` : `Take things gradually, don't overload yourself`,
      moonStr ? `Moon is strong — trust intuition and make important decisions` : `Listen to emotional signals, allow time for restoration`,
    ];
    const doItems = isRu ? DO_ITEMS_RU : DO_ITEMS_EN;
    doItems.slice(0, compact ? 3 : 4).forEach(item => {
      rrect(ctx, 60, y, W-120, warnLayout.listCardH, 10, "rgba(74,222,128,0.04)", C.green, 0.18);
      t(ctx, "✦", 104, y + warnLayout.listCardH / 2, { size: 22, color: C.green, align: "center" });
      wrap(ctx, item, 164, y + (compact ? 34 : 38), W - 240, warnLayout.listLineH, {
        size: warnLayout.listTextSize,
        color: C.text,
        align: "left",
        weight: "300",
        maxLines: compact ? 2 : 2,
      });
      y += warnLayout.listCardH + warnLayout.listGap;
    });

    // ── WHAT TO AVOID ────────────────────────────────────────────────────
    if (y + 200 < H - 60) {
      hline(ctx, y, 0.12);
      y += warnLayout.sectionDividerGap;
      t(ctx, isRu ? "ЧЕГО ИЗБЕГАТЬ" : "WHAT TO AVOID", W/2, y, { size: warnLayout.sectionTitleSize, color: C.danger, align: "center", weight: "700" });
      y += warnLayout.sectionGap;

      const AVOID_RU = [
        mercury.retrograde ? "Подписания договоров и важных документов" : "Невнимательных, поспешных решений",
        stressP.length > 0 ? "Публичных заявлений и смелых обещаний" : "Чрезмерной многозадачности",
        retros.length > 0 ? "Запуска новых крупных проектов сегодня" : "Откладывания важных дел на потом",
      ];
      const AVOID_EN = [
        mercury.retrograde ? "Signing contracts and important documents" : "Hasty and inattentive decisions",
        stressP.length > 0 ? "Public statements and bold promises" : "Excessive multitasking",
        retros.length > 0 ? "Launching major new projects today" : "Putting off important tasks",
      ];
      const avoidItems = isRu ? AVOID_RU : AVOID_EN;
      avoidItems.slice(0, compact ? 2 : 3).forEach(item => {
        rrect(ctx, 60, y, W-120, warnLayout.listCardH, 10, "rgba(255,106,106,0.04)", C.danger, 0.16);
        t(ctx, "✕", 104, y + warnLayout.listCardH / 2, { size: 20, color: C.danger, align: "center" });
        wrap(ctx, item, 164, y + (compact ? 34 : 38), W - 240, warnLayout.listLineH, {
          size: warnLayout.listTextSize,
          color: C.text,
          align: "left",
          weight: "300",
          maxLines: compact ? 2 : 2,
        });
        y += warnLayout.listCardH + warnLayout.listGap;
      });
    }

    // ── CLOSING SUMMARY BOX ──────────────────────────────────────────────
    const remaining = H - y - 70;
    if (remaining > 100) {
      rrect(ctx, 60, y, W-120, remaining, 14, "rgba(255,255,255,0.02)", C.amber, 0.15);
      const summaryText = isRu
        ? "Используй этот день осознанно. Астрологические паттерны — это подсказки, а не приговор. Твои действия всегда имеют значение."
        : "Use this day consciously. Astrological patterns are hints, not verdicts. Your actions always matter.";
      wrap(ctx, summaryText, 88, y + warnLayout.summaryTop, W-176, warnLayout.summaryLineH, {
        size: warnLayout.summarySize,
        color: C.text,
        align: "left",
        weight: "300",
        maxHeight: remaining - (warnLayout.summaryTop + 18),
      });
    }

    footer(ctx);
  }

  // ── Day Report Card 3: Energy of the Day ─────────────────────────────────

  function renderDayEnergy(ctx, lang, transits) {
    const isRu   = lang === "ru";
    const compact = isPostFrame();
    const planets = transits.planets || [];
    const lunar   = transits.lunar   || {};

    const moon    = planets.find(p => p.planet === "moon")    || {};
    const sun     = planets.find(p => p.planet === "sun")     || {};
    const venus   = planets.find(p => p.planet === "venus")   || {};
    const mars    = planets.find(p => p.planet === "mars")    || {};
    const jupiter = planets.find(p => p.planet === "jupiter") || {};
    const mercury = planets.find(p => p.planet === "mercury") || {};
    const saturn  = planets.find(p => p.planet === "saturn")  || {};
    const waxing  = lunar.paksha !== "krishna";
    const illum   = lunar.illumination ?? 50;
    const moonSign = moon.sign || "";

    const moonElem = SIGN_ELEM[moon.sign] || "Air";

    const mercOk    = !mercury.retrograde && mercury.dignity !== "debilitated";
    const venusOk   = !venus.retrograde   && venus.dignity   !== "debilitated";
    const marsOk    = !mars.retrograde    && mars.dignity    !== "debilitated";
    const jupOk     = !jupiter.retrograde && jupiter.dignity !== "debilitated";
    const satOk     = !saturn.retrograde  && saturn.dignity  !== "debilitated";
    const moonStrong = moon.dignity === "exalted" || moon.dignity === "own_sign";
    const moonWeak   = moon.dignity === "debilitated";

    const scores = {
      business:      Math.round(55 + (mercOk?15:0) + (satOk?12:0) + (marsOk?10:0) + (moonStrong?8:0) + (moonWeak?-15:0)),
      creative:      Math.round(50 + (venusOk?20:0) + (jupOk?15:0) + (moonElem==="Water"||moonElem==="Air"?10:0) + (moonStrong?8:0)),
      relationships: Math.round(50 + (venusOk?22:0) + (moonStrong?15:0) + (waxing?8:0) + (moonWeak?-18:0)),
      health:        Math.round(55 + (marsOk?15:0) + (moonStrong?10:0) + (satOk?8:0) + (moonWeak?-12:0)),
      spiritual:     Math.round(50 + (!waxing?15:0) + (jupOk?12:0) + (illum < 40 || illum > 90 ? 10:0)),
    };
    Object.keys(scores).forEach(k => { scores[k] = Math.min(100, Math.max(10, scores[k])); });

    const LABELS = {
      ru: { business:"Бизнес и карьера", creative:"Творчество", relationships:"Отношения", health:"Физическая активность", spiritual:"Медитация и духовность" },
      en: { business:"Business & Career", creative:"Creativity", relationships:"Relationships", health:"Physical Activity", spiritual:"Meditation & Spirit" },
    };

    const ICONS = { business:"♄", creative:"♀", relationships:"☽", health:"♂", spiritual:"♃" };
    const COLS  = { business:C.indigo, creative:C.violet, relationships:PLANET_COLOR.moon, health:"#d66b52", spiritual:C.gold };

    // Per-bar WHY text (dynamic, uses actual planet position)
    const WHY_RU = {
      business:      mercOk ? `Меркурий прямой в ${sname(mercury.sign, true)} — ясное мышление` : `Меркурий ℞ — осторожно с решениями`,
      creative:      venusOk ? `Венера в ${sname(venus.sign, true)} — вдохновение и вкус` : `Венера ослаблена — твори в тишине`,
      relationships: venusOk ? `Венера благоприятна, Луна в ${sname(moonSign, true)}` : `Луна в ${sname(moonSign, true)} — чуткость важна`,
      health:        marsOk ? `Марс в ${sname(mars.sign, true)} — энергия и сила` : `Марс ослаблен — умеренная активность`,
      spiritual:     !waxing ? `Убывающая Луна ${illum}% — время внутренней работы` : `Юпитер ${jupOk ? "прямой" : "ретро"} — поддержка медитации`,
    };
    const WHY_EN = {
      business:      mercOk ? `Mercury direct in ${mercury.sign} — clear thinking` : `Mercury ℞ — careful with decisions`,
      creative:      venusOk ? `Venus in ${venus.sign} — inspiration and taste` : `Venus weakened — create in quiet`,
      relationships: venusOk ? `Venus favorable, Moon in ${moonSign}` : `Moon in ${moonSign} — sensitivity matters`,
      health:        marsOk ? `Mars in ${mars.sign} — energy and strength` : `Mars weakened — moderate activity`,
      spiritual:     !waxing ? `Waning Moon ${illum}% — inner work time` : `Jupiter ${jupOk ? "direct" : "retrograde"} — meditation supported`,
    };
    const WHY = isRu ? WHY_RU : WHY_EN;

    const energyLayout = compact ? {
      dateY: 82,
      dateSize: 24,
      badgeY: 132,
      phaseY: 182,
      dividerY: 216,
      startY: 238,
      cardH: 116,
      iconY: 58,
      iconSize: 26,
      labelY: 30,
      labelSize: 22,
      scoreY: 30,
      scoreSize: 24,
      barY: 48,
      barH: 10,
      whyY: 72,
      whySize: 16,
      whyLineH: 20,
      qualityY: 98,
      qualitySize: 16,
      innerDividerY: 104,
      sectionGap: 14,
      sectionTitleSize: 17,
      tipMinH: 108,
      tipLineH: 28,
      tipSize: 18,
      tipTitleY: 24,
      adviceLineGap: 14,
      adviceTitleSize: 17,
      adviceLineH: 26,
      adviceSize: 18,
    } : {
      dateY: 88,
      dateSize: 28,
      badgeY: 144,
      phaseY: 210,
      dividerY: 248,
      startY: 300,
      cardH: 236,
      iconY: 112,
      iconSize: 36,
      labelY: 38,
      labelSize: 30,
      scoreY: 38,
      scoreSize: 30,
      barY: 74,
      barH: 14,
      whyY: 120,
      whySize: 22,
      whyLineH: 30,
      qualityY: 194,
      qualitySize: 22,
      innerDividerY: 188,
      sectionGap: 20,
      sectionTitleSize: 20,
      tipMinH: 180,
      tipLineH: 48,
      tipSize: 28,
      tipTitleY: 32,
      adviceLineGap: 20,
      adviceTitleSize: 20,
      adviceLineH: 46,
      adviceSize: 27,
    };

    drawStars(ctx, 21);
    radialGlow(ctx, W*0.3, H*0.3, 0, W*0.7, "#b796ff", 0.09);
    radialGlow(ctx, W*0.7, H*0.65, 0, W*0.6, "#d8b764", 0.08);
    corners(ctx, 60, 60);

    // ── HEADER ───────────────────────────────────────────────────────────
    t(ctx, todayStr(), W/2, energyLayout.dateY, { size: energyLayout.dateSize, color: C.muted, align: "center", weight: "300" });
    badge(ctx, W/2, energyLayout.badgeY, 340, 54, C.violet, (isRu ? "Энергия дня" : "Day Energy").toUpperCase(), C.violet, 22);

    const phaseName = waxing ? (isRu ? "Растущая · " : "Waxing · ") : (isRu ? "Убывающая · " : "Waning · ");
    badge(ctx, W/2, energyLayout.phaseY, 350, 46, PLANET_COLOR.moon, phaseName + illum + "%", PLANET_COLOR.moon, 21);

    hline(ctx, energyLayout.dividerY, 0.22);

    // ── ENERGY BARS with WHY ─────────────────────────────────────────────
    let y = energyLayout.startY;
    const barW = W - 330;
    const energyCardH = energyLayout.cardH;

    const scoreKeys = Object.keys(scores);
    Object.entries(scores).forEach(([key, score], idx) => {
      const col   = COLS[key];
      const label = LABELS[lang][key];
      const why   = WHY[key];

      rrect(ctx, 60, y, W-120, energyCardH, 10, "rgba(255,255,255,0.02)", col, 0.12);

      glyphAt(ctx, ICONS[key], 122, y + energyLayout.iconY, energyLayout.iconSize, col);

      t(ctx, label, 162, y + energyLayout.labelY, { size: energyLayout.labelSize, color: C.textBr, align: "left", weight: "600", maxW: W - 320 });
      t(ctx, score + "%", W - 80, y + energyLayout.scoreY, { size: energyLayout.scoreSize, color: col, align: "right", weight: "700" });

      progressBar(ctx, 162, y + energyLayout.barY, barW, energyLayout.barH, score / 100, col, 0.07);

      wrap(ctx, why, 162, y + energyLayout.whyY, barW, energyLayout.whyLineH, {
        size: energyLayout.whySize,
        color: C.muted,
        align: "left",
        weight: "300",
        alpha: 0.75,
        maxHeight: compact ? 48 : 60,
      });

      // Qualitative label
      const qScore = score >= 75 ? (isRu ? "Высокий" : "High") : score >= 50 ? (isRu ? "Средний" : "Medium") : (isRu ? "Низкий" : "Low");
      t(ctx, qScore, W/2, y + energyLayout.qualityY, { size: energyLayout.qualitySize, color: col, align: "center", weight: "400", alpha: 0.75 });

      // Divider inside block (not last)
      if (idx < scoreKeys.length - 1) {
        hline(ctx, y + energyLayout.innerDividerY, 0.08);
      }

      y += energyCardH;
    });

    hline(ctx, y, 0.15);
    y += energyLayout.sectionGap;

    // ── TOP ENERGY TIP (expanded) ────────────────────────────────────────
    const topKey = Object.entries(scores).sort((a,b) => b[1]-a[1])[0][0];
    const TOP_TIP = {
      ru: {
        business:      `Деловая и карьерная энергия сегодня на высоте. Хороший момент для переговоров, рабочих встреч и решения сложных вопросов. ${mercOk ? "Меркурий прямой — мысли ясны, слова точны." : ""} Используй утро для стратегии, а вторую половину дня — для реализации.`,
        creative:      `День насыщен творческой энергией. ${venusOk ? "Венера благоприятна — эстетическое чутьё обострено." : ""} Самое время писать, рисовать, создавать что-то новое. Не откладывай идеи — сегодня они имеют шанс материализоваться.`,
        relationships: `Энергия отношений сегодня благоприятна. ${venusOk ? "Венера поддерживает тёплый контакт." : ""} ${moonStrong ? "Луна сильна — интуиция подсказывает верные слова." : ""} Хорошее время для важных разговоров и сближения с близкими.`,
        health:        `Физическая активность сегодня особенно полезна. ${marsOk ? "Марс даёт выносливость и силу воли." : ""} Тренировки, прогулки, танцы — всё принесёт пользу. Тело откликается быстро, не теряй этот момент.`,
        spiritual:     `Глубокий день для медитации и внутренней работы. ${!waxing ? "Убывающая Луна помогает отпустить лишнее." : ""} ${jupOk ? "Юпитер поддерживает мудрость и расширение сознания." : ""} Практикуй осознанность, ведение дневника или молитву.`,
      },
      en: {
        business:      `Business and career energy is strong today. A good moment for negotiations, work meetings and tackling tough decisions. ${mercOk ? "Mercury direct — thinking is clear, words precise." : ""} Use the morning for strategy and the afternoon for execution.`,
        creative:      `The day is rich with creative energy. ${venusOk ? "Venus is favorable — aesthetic sense is heightened." : ""} This is the ideal time to write, draw, or create something new. Don't postpone ideas — today they have a chance to materialize.`,
        relationships: `Relationship energy is favorable today. ${venusOk ? "Venus supports warm connection." : ""} ${moonStrong ? "Moon is strong — intuition guides the right words." : ""} A good time for important conversations and deepening bonds.`,
        health:        `Physical activity is especially beneficial today. ${marsOk ? "Mars provides endurance and willpower." : ""} Workouts, walks, dancing — all will prove rewarding. The body responds quickly, don't miss this window.`,
        spiritual:     `A deep day for meditation and inner work. ${!waxing ? "Waning Moon helps release what is no longer needed." : ""} ${jupOk ? "Jupiter supports wisdom and expanded awareness." : ""} Practice mindfulness, journaling or prayer.`,
      },
    };
    const tipTextH = measureWrapHeight(ctx, TOP_TIP[lang][topKey], W - 160, energyLayout.tipLineH, {
      size: energyLayout.tipSize,
      weight: "300",
      maxLines: compact ? 3 : 5,
    });
    const tipAvailH = Math.max(energyLayout.tipMinH, H - y - (compact ? 130 : 220));
    const tipH = Math.min(compact ? 132 : 280, Math.min(tipAvailH, tipTextH + (compact ? 42 : 86)));
    rrect(ctx, 60, y, W-120, tipH, 14, "rgba(255,255,255,0.02)", COLS[topKey], 0.25);
    glyphAt(ctx, ICONS[topKey], 122, y + (compact ? 42 : 52), compact ? 34 : 38, COLS[topKey]);
    t(ctx, isRu ? "ЛУЧШЕЕ СЕГОДНЯ" : "TOP ENERGY TODAY", 168, y + energyLayout.tipTitleY, { size: energyLayout.sectionTitleSize, color: COLS[topKey], align: "left", weight: "700" });
      wrap(ctx, TOP_TIP[lang][topKey], 80, y + (compact ? 56 : 64), W - 160, energyLayout.tipLineH, {
        size: energyLayout.tipSize,
        color: C.text,
        align: "left",
        weight: "300",
        maxHeight: tipH - (compact ? 56 : 84),
      });

    y += tipH + energyLayout.adviceLineGap;

    // ── LUNAR COUNCIL ────────────────────────────────────────────────────
    {
      hline(ctx, y, 0.12);
      y += energyLayout.adviceLineGap;
      t(ctx, isRu ? "ЛУННЫЙ СОВЕТ" : "LUNAR ADVICE", W/2, y, { size: energyLayout.adviceTitleSize, color: PLANET_COLOR.moon, align: "center", weight: "700" });
      y += energyLayout.sectionGap;

      const MOON_ADVICE = {
        ru: {
          Aries:       `Луна в Овне зовёт к действию. Начинай новое, проявляй инициативу — но избегай поспешности и конфликтов. Хорошее время для смелых первых шагов.`,
          Taurus:      `Луна в Тельце создаёт потребность в комфорте и стабильности. Хорошее время для финансовых дел, кулинарии и наслаждения простыми удовольствиями.`,
          Gemini:      `Луна в Близнецах ускоряет мышление. Обменивайся идеями, звони друзьям, пиши письма. Информация сегодня в приоритете.`,
          Cancer:      `Луна в Раке усиливает эмоции и интуицию. День для семьи, домашних дел и заботы о близких. Доверяй внутреннему голосу.`,
          Leo:         `Луна во Льве зовёт сиять и радоваться. Хорошее время для творчества, развлечений и общения. Позволь себе быть замеченным.`,
          Virgo:       `Луна в Деве настраивает на работу и порядок. Хороший день для уборки, планирования, мелких дел и заботы о здоровье.`,
          Libra:       `Луна в Весах создаёт тягу к гармонии. Хороший день для переговоров, дипломатии и восстановления нарушенного баланса.`,
          Scorpio:     `Луна в Скорпионе углубляет эмоции. День для трансформации, разговоров по существу и работы с тем, что скрыто внутри.`,
          Sagittarius: `Луна в Стрельце зовёт к расширению. Хороший день для обучения, путешествий, философских бесед и оптимистичных планов.`,
          Capricorn:   `Луна в Козероге настраивает на дело. Хорошее время для карьерных шагов, структурирования планов и ответственных решений.`,
          Aquarius:    `Луна в Водолее поощряет нестандартность. Хороший день для инноваций, общения с единомышленниками и социальных инициатив.`,
          Pisces:      `Луна в Рыбах обостряет чувствительность. Хороший день для медитации, искусства и сострадания. Избегай иллюзий и ухода от реальности.`,
        },
        en: {
          Aries:       `Moon in Aries calls for action. Start new things and show initiative — but avoid haste and conflict. A good time for bold first steps.`,
          Taurus:      `Moon in Taurus creates a need for comfort and stability. Good for financial matters, cooking and simple pleasures.`,
          Gemini:      `Moon in Gemini speeds up thinking. Exchange ideas, call friends, write letters. Information is the priority today.`,
          Cancer:      `Moon in Cancer intensifies emotions and intuition. A day for family, home matters and caring for loved ones. Trust your inner voice.`,
          Leo:         `Moon in Leo calls you to shine and rejoice. Good time for creativity, entertainment and socializing. Let yourself be seen.`,
          Virgo:       `Moon in Virgo tunes you into work and order. A good day for cleaning, planning, small tasks and health care.`,
          Libra:       `Moon in Libra creates a pull toward harmony. Good day for negotiations, diplomacy and restoring balance.`,
          Scorpio:     `Moon in Scorpio deepens emotions. A day for transformation, honest conversations and working with what lies hidden within.`,
          Sagittarius: `Moon in Sagittarius calls for expansion. Good day for learning, travel, philosophical talks and optimistic planning.`,
          Capricorn:   `Moon in Capricorn tunes you toward work. Good time for career moves, structuring plans and responsible decisions.`,
          Aquarius:    `Moon in Aquarius encourages non-conformity. Good day for innovations, connecting with like-minded people and social initiatives.`,
          Pisces:      `Moon in Pisces heightens sensitivity. Good day for meditation, art and compassion. Avoid illusions and escapism.`,
        },
      };
      const moonAdv = MOON_ADVICE[lang]?.[moonSign] || (isRu ? "Слушай свою интуицию сегодня." : "Listen to your intuition today.");
      const advTextH = measureWrapHeight(ctx, moonAdv, W - 220, energyLayout.adviceLineH, {
        size: energyLayout.adviceSize,
        weight: "300",
        maxLines: compact ? 3 : 5,
      });
      const advAvailH = Math.max(compact ? 116 : 100, H - y - 70);
      const advH = Math.min(advAvailH, advTextH + (compact ? 36 : 64));
      rrect(ctx, 60, y, W-120, advH, 12, "rgba(200,216,255,0.03)", PLANET_COLOR.moon, 0.2);
      glyphAt(ctx, PLANET_GLYPH.moon, 114, y + advH/2, 32, PLANET_COLOR.moon);
      wrap(ctx, moonAdv, 152, y + (compact ? 28 : 32), W - 220, energyLayout.adviceLineH, {
        size: energyLayout.adviceSize,
        color: C.text,
        align: "left",
        weight: "300",
        maxHeight: advH - (compact ? 42 : 48),
      });
    }

    footer(ctx);
  }

  // ── Personal Card 1: Natal Portrait (compact) ────────────────────────────

  function renderPersonalNatal(ctx, chart, lang) {
    if (!chart) return false;
    const isRu  = lang === "ru";
    const compact = isPostFrame();
    const planets = chart.planets || {};
    const lagna   = chart.lagna   || {};
    const birth   = chart.birth   || {};

    const natalLayout = compact ? {
      nameY: 88,
      nameSize: 52,
      metaY: 136,
      metaSize: 25,
      placeY: 170,
      placeSize: 22,
      topLineY: 198,
      lagnaY: 220,
      lagnaH: 152,
      lagnaTitleY: 32,
      lagnaGlyphY: 96,
      lagnaGlyphSize: 52,
      lagnaNameY: 104,
      lagnaNameSize: 54,
      lagnaDescY: 138,
      lagnaDescSize: 20,
      lagnaLineY: 392,
      gridY: 412,
      gridH: 142,
      gridGap: 10,
      gridGlyphY: 48,
      gridGlyphSize: 34,
      gridNameY: 78,
      gridNameSize: 18,
      gridSignY: 108,
      gridSignSize: 21,
      gridDignityY: 132,
      gridDignitySize: 16,
      portraitGap: 20,
      portraitTop: 26,
      portraitSize: 24,
      portraitLineH: 40,
    } : {
      nameY: 98,
      nameSize: 56,
      metaY: 150,
      metaSize: 28,
      placeY: 188,
      placeSize: 24,
      topLineY: 220,
      lagnaY: 240,
      lagnaH: 174,
      lagnaTitleY: 36,
      lagnaGlyphY: 115,
      lagnaGlyphSize: 62,
      lagnaNameY: 118,
      lagnaNameSize: 62,
      lagnaDescY: 158,
      lagnaDescSize: 22,
      lagnaLineY: 434,
      gridY: 454,
      gridH: 168,
      gridGap: 10,
      gridGlyphY: 52,
      gridGlyphSize: 38,
      gridNameY: 84,
      gridNameSize: 19,
      gridSignY: 114,
      gridSignSize: 22,
      gridDignityY: 146,
      gridDignitySize: 18,
      portraitGap: 28,
      portraitTop: 32,
      portraitSize: 27,
      portraitLineH: 48,
    };

    drawStars(ctx, 17);
    drawNebula(ctx);
    corners(ctx, 60, 60);

    // ── HEADER ───────────────────────────────────────────────────────────
    const name = birth.name || (isRu ? "Натальная карта" : "Natal Chart");
    t(ctx, name, W/2, natalLayout.nameY, { size: natalLayout.nameSize, color: C.textBr, align: "center", weight: "800", glow: C.indigo });

    const bDate  = birth.local_date ? birth.local_date.split("-").reverse().join(".") : "";
    const bTime  = birth.local_time || "";
    const bPlace = [birth.city, birth.country].filter(Boolean).join(", ");
    t(ctx, [bDate, bTime].filter(Boolean).join("  ·  "), W/2, natalLayout.metaY, { size: natalLayout.metaSize, color: C.gold, align: "center" });
    if (bPlace) t(ctx, bPlace, W/2, natalLayout.placeY, { size: natalLayout.placeSize, color: C.muted, align: "center" });

    hline(ctx, natalLayout.topLineY, 0.25);

    // ── ASCENDANT BLOCK ──────────────────────────────────────────────────
    const lagnaSign  = lagna.sign || "";
    const elemCol    = ELEM_COLOR[SIGN_ELEM[lagnaSign]] || C.gold;
    const lagnaBlockH = natalLayout.lagnaH;
    rrect(ctx, 60, natalLayout.lagnaY, W-120, lagnaBlockH, 16, "rgba(108,140,255,0.05)", elemCol, 0.28);

    t(ctx, isRu ? "АСЦЕНДЕНТ" : "ASCENDANT", W/2, natalLayout.lagnaY + natalLayout.lagnaTitleY, { size: compact ? 19 : 20, color: elemCol, align: "center", weight: "700" });
    glyphAt(ctx, SIGN_GLYPH[lagnaSign] || "?", W/2 - (compact ? 94 : 110), natalLayout.lagnaY + natalLayout.lagnaGlyphY, natalLayout.lagnaGlyphSize, elemCol);
    t(ctx, sname(lagnaSign, isRu), W/2 + (compact ? 18 : 22), natalLayout.lagnaY + natalLayout.lagnaNameY, { size: natalLayout.lagnaNameSize, color: elemCol, align: "center", weight: "800", glow: elemCol });

    // 2-line ascendant description
    const ASC_DESC = {
      ru: {
        Aries:"Огненный Асцендент — прямой, смелый, инициативный человек. Внешность активная, взгляд прямой.", Taurus:"Земной Асцендент — надёжный, практичный, ценящий комфорт и красоту.", Gemini:"Воздушный Асцендент — острый ум, общительность, любопытство к миру.", Cancer:"Водный Асцендент — глубокая интуиция, чуткость, сильная связь с домом.", Leo:"Огненный Асцендент — харизма, щедрость, рождён для заметной роли.", Virgo:"Земной Асцендент — аналитичность, скромность, стремление к совершенству.", Libra:"Воздушный Асцендент — дипломатичность, красота, потребность в гармонии.", Scorpio:"Водный Асцендент — проницательность, интенсивность, сила преобразования.", Sagittarius:"Огненный Асцендент — философ и искатель, оптимизм и широкий кругозор.", Capricorn:"Земной Асцендент — амбициозность, дисциплина, ориентированность на цель.", Aquarius:"Воздушный Асцендент — оригинальность, гуманизм, нестандартный путь.", Pisces:"Водный Асцендент — сострадание, духовность, тонкая чувствительность.",
      },
      en: {
        Aries:"Fire Ascendant — direct, brave, initiative-driven. Active appearance, direct gaze.", Taurus:"Earth Ascendant — reliable, practical, values comfort and beauty.", Gemini:"Air Ascendant — sharp mind, sociable, curious about the world.", Cancer:"Water Ascendant — deep intuition, sensitivity, strong bond with home.", Leo:"Fire Ascendant — charisma, generosity, born for a prominent role.", Virgo:"Earth Ascendant — analytical, modest, striving for perfection.", Libra:"Air Ascendant — diplomatic, beautiful, need for harmony.", Scorpio:"Water Ascendant — perceptive, intense, power of transformation.", Sagittarius:"Fire Ascendant — philosopher and seeker, optimism and broad perspective.", Capricorn:"Earth Ascendant — ambitious, disciplined, goal-oriented.", Aquarius:"Air Ascendant — original, humanitarian, unconventional path.", Pisces:"Water Ascendant — compassionate, spiritual, refined sensitivity.",
      },
    };
    const ascDesc = ASC_DESC[lang]?.[lagnaSign] || "";
    if (ascDesc) t(ctx, ascDesc, W/2, natalLayout.lagnaY + natalLayout.lagnaDescY, { size: natalLayout.lagnaDescSize, color: C.muted, align: "center", weight: "300", maxW: W - 160, alpha: 0.85 });

    hline(ctx, natalLayout.lagnaLineY, 0.2);

    // ── PLANET GRID 3×3 ──────────────────────────────────────────────────
    const ORDER = ["sun","moon","mars","mercury","jupiter","venus","saturn","rahu","ketu"];
    const cw = (W - 120 - 20) / 3, ch = natalLayout.gridH, gap = natalLayout.gridGap;
    ORDER.forEach((key, i) => {
      const p = planets[key]; if (!p) return;
      const col  = PLANET_COLOR[key] || C.gold;
      const row  = Math.floor(i / 3), c = i % 3;
      const cx   = 60 + c * (cw + gap);
      const cy   = natalLayout.gridY + row * (ch + gap);

      rrect(ctx, cx, cy, cw, ch, 12, "rgba(255,255,255,0.025)", col, 0.20);
      ctx.save(); ctx.fillStyle = col; ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.roundRect(cx, cy, cw, 4, [12,12,0,0]); ctx.fill(); ctx.restore();

      glyphAt(ctx, PLANET_GLYPH[key] || "★", cx + cw/2, cy + natalLayout.gridGlyphY, natalLayout.gridGlyphSize, col);

      const nm = isRu
        ? { sun:"Солнце",moon:"Луна",mars:"Марс",mercury:"Меркурий",jupiter:"Юпитер",venus:"Венера",saturn:"Сатурн",rahu:"Раху",ketu:"Кету" }[key]
        : { sun:"Sun",moon:"Moon",mars:"Mars",mercury:"Mercury",jupiter:"Jupiter",venus:"Venus",saturn:"Saturn",rahu:"Rahu",ketu:"Ketu" }[key];
      t(ctx, nm, cx + cw/2, cy + natalLayout.gridNameY, { size: natalLayout.gridNameSize, color: C.muted, align: "center", maxW: cw - 8 });

      const sEl = ELEM_COLOR[SIGN_ELEM[p.sign]] || C.muted;
      glyphAt(ctx, SIGN_GLYPH[p.sign] || "?", cx + cw/2 - 18, cy + natalLayout.gridSignY, compact ? 22 : 24, sEl);
      t(ctx, sname(p.sign, isRu), cx + cw/2 + 16, cy + natalLayout.gridSignY, { size: natalLayout.gridSignSize, color: sEl, align: "left", weight: "600", maxW: cw/2 + 10 });

      const digs = { exalted: isRu?"↑ Сила":"↑ Strong", debilitated: isRu?"↓ Слаб":"↓ Weak", own_sign: isRu?"✦ Дома":"✦ Home" };
      const digC = { exalted: C.green, debilitated: C.danger, own_sign: C.gold };
      if (p.dignity && p.dignity !== "neutral") {
        t(ctx, digs[p.dignity] || "", cx + cw/2, cy + natalLayout.gridDignityY, { size: natalLayout.gridDignitySize, color: digC[p.dignity] || C.muted, align: "center", weight: "600" });
      }
      if (p.retrograde) t(ctx, "℞", cx + cw - 18, cy + 22, { size: 19, color: C.danger, align: "center" });
    });

    // ── PORTRAIT SUMMARY ─────────────────────────────────────────────────
    const afterGrid = natalLayout.gridY + 3 * ch + 2 * gap + natalLayout.portraitGap;
    hline(ctx, afterGrid, 0.18);
    const sy = afterGrid + natalLayout.portraitGap;

    const sunP  = planets.sun || {};
    const moonP = planets.moon || {};
    const sunSign  = sunP.sign  || "";
    const moonSign = moonP.sign || "";

    const PORTRAIT = {
      ru: `${name} — Асцендент ${sname(lagnaSign, true)}: ${ASC_DESC.ru[lagnaSign]?.split(".")[0] || ""}. Солнце в ${sname(sunSign, true)} определяет стержень личности, Луна в ${sname(moonSign, true)} — эмоциональный мир. Вместе эти три точки создают уникальный характер и жизненный путь.`,
      en: `${name} — Ascendant ${lagnaSign}: ${ASC_DESC.en[lagnaSign]?.split(".")[0] || ""}. Sun in ${sunSign} defines the core of personality, Moon in ${moonSign} — the emotional world. Together these three points create a unique character and life path.`,
    };
    const portraitAvailH = H - sy - 60;
    const portraitTextH = measureWrapHeight(ctx, PORTRAIT[lang], W - 160, natalLayout.portraitLineH, { size: natalLayout.portraitSize, weight: "300" });
    const portraitH = Math.min(portraitAvailH, Math.max(compact ? 148 : 176, portraitTextH + (compact ? 34 : 40)));
    rrect(ctx, 60, sy, W-120, portraitH, 12, "rgba(108,140,255,0.04)", C.indigo, 0.2);
    wrap(ctx, PORTRAIT[lang], 80, sy + natalLayout.portraitTop, W - 160, natalLayout.portraitLineH, { size: natalLayout.portraitSize, color: C.text, align: "left", weight: "300", maxHeight: portraitH - (natalLayout.portraitTop + 12) });

    footer(ctx);
    return true;
  }

  // ── Personal Card 2: Dasha + Forecast ───────────────────────────────────

  function renderPersonalDasha(ctx, chart, lang) {
    if (!chart) return false;
    const isRu  = lang === "ru";
    const compact = isPostFrame();
    const dasha  = chart.dashas?.current || {};
    const birth  = chart.birth || {};
    const mdKey  = (dasha.mahadasha   || "").toLowerCase();
    const adKey  = (dasha.antardasha  || "").toLowerCase();
    const ptKey  = (dasha.pratyantardasha || "").toLowerCase();
    const mdCol  = PLANET_COLOR[mdKey] || C.gold;
    const adCol  = PLANET_COLOR[adKey] || C.violet;
    const ptCol  = PLANET_COLOR[ptKey] || C.teal;

    const dashaLayout = compact ? {
      nameY: 88,
      nameSize: 48,
      dateY: 136,
      dateSize: 24,
      lineY: 168,
      tierY: 186,
      tierH: 126,
      tierGap: 10,
      glyphSize: 48,
      labelY: 34,
      labelSize: 17,
      titleY: 78,
      titleSize: 42,
      dateRowY: 106,
      dateRowSize: 18,
      barY: 114,
      sectionGap: 22,
      sectionTitleSize: 19,
      themeLineH: 38,
      themeSize: 23,
      themeMinH: 210,
      adviceCardH: 58,
      adviceTextSize: 22,
    } : {
      nameY: 98,
      nameSize: 52,
      dateY: 150,
      dateSize: 26,
      lineY: 182,
      tierY: 206,
      tierH: 150,
      tierGap: 12,
      glyphSize: 58,
      labelY: 40,
      labelSize: 19,
      titleY: 94,
      titleSize: 50,
      dateRowY: 130,
      dateRowSize: 22,
      barY: 140,
      sectionGap: 28,
      sectionTitleSize: 20,
      themeLineH: 46,
      themeSize: 27,
      themeMinH: 260,
      adviceCardH: 64,
      adviceTextSize: 25,
    };

    drawStars(ctx, 55);
    drawNebula(ctx);
    corners(ctx, 60, 60);

    // ── HEADER ───────────────────────────────────────────────────────────
    const name = birth.name || "";
    t(ctx, name || (isRu ? "Период жизни" : "Life Period"), W/2, dashaLayout.nameY, { size: dashaLayout.nameSize, color: C.textBr, align: "center", weight: "800", glow: mdCol });
    t(ctx, todayStr(), W/2, dashaLayout.dateY, { size: dashaLayout.dateSize, color: C.gold, align: "center" });

    hline(ctx, dashaLayout.lineY, 0.22);

    // ── THREE COMPACT DASHA TIERS ────────────────────────────────────────
    const tiers = [
      { key: mdKey, col: mdCol, label: isRu ? "Главный период" : "Main Period", start: dasha.mahadasha_start, end: dasha.mahadasha_end, showBar: true },
      { key: adKey, col: adCol, label: isRu ? "Подпериод" : "Sub-Period", start: dasha.antardasha_start, end: dasha.antardasha_end, showBar: false },
      { key: ptKey, col: ptCol, label: isRu ? "Мини-период" : "Mini-Period", start: null, end: dasha.pratyantardasha_end, showBar: false },
    ].filter(ti => ti.key);

    let ty = dashaLayout.tierY;
    const tierH = dashaLayout.tierH;
    const fmt = s => s ? s.split("-").reverse().join(".") : "—";

    tiers.forEach((ti) => {
      rrect(ctx, 60, ty, W-120, tierH, 14, "rgba(0,0,0,0.15)", ti.col, 0.28);

      // Left: glyph centered vertically in block
      glyphAt(ctx, PLANET_GLYPH[ti.key] || "★", 135, ty + tierH / 2, dashaLayout.glyphSize, ti.col);

      // Right: label + planet name + date range
      const rx = 222, rw = W - 300;
      t(ctx, ti.label.toUpperCase(), rx, ty + dashaLayout.labelY, { size: dashaLayout.labelSize, color: ti.col, align: "left", weight: "700" });
      t(ctx, pname(ti.key, isRu), rx, ty + dashaLayout.titleY, { size: dashaLayout.titleSize, color: C.textBr, align: "left", weight: "800", glow: ti.col, maxW: rw });

      if (ti.end) {
        const range = ti.start ? `${fmt(ti.start)} — ${fmt(ti.end)}` : (isRu?"до ":"until ") + fmt(ti.end);
        t(ctx, range, rx, ty + dashaLayout.dateRowY, { size: dashaLayout.dateRowSize, color: C.muted, align: "left", maxW: rw });
      }

      // Progress bar only for mahadasha
      if (ti.showBar && ti.start && ti.end) {
        const now = Date.now();
        const s = new Date(ti.start).getTime(), e = new Date(ti.end).getTime();
        const pct = Math.min(1, Math.max(0, (now - s) / (e - s)));
        const bw = rw, bY = ty + dashaLayout.barY;
        progressBar(ctx, rx, bY, bw, 8, pct, ti.col);
        t(ctx, Math.round(pct * 100) + "%", rx + bw + 36, bY + 6, { size: compact ? 17 : 19, color: ti.col, align: "right" });
      }

      ty += tierH + dashaLayout.tierGap;
    });

    hline(ctx, ty + 10, 0.18);
    ty += dashaLayout.sectionGap;

    // ── EXPANDED THEME SECTION ───────────────────────────────────────────
    const MAHA_LONG = {
      ru: {
        sun:     `Главный период Солнца — время самоопределения, карьеры и признания. Солнечный период усиливает волю, уверенность и желание занять видное место. Это годы, когда важно выражать себя аутентично, строить репутацию и брать на себя лидерство. Отец и авторитетные фигуры играют ключевую роль. Ограничения: риск эгоцентризма и жёсткости суждений.`,
        moon:    `Главный период Луны — период эмоций, семьи и интуиции. Чувствительность обострена, важны отношения с матерью, домом и общественностью. Этот период благоприятен для творчества, бизнеса в сфере питания и ухода. Интуиция подсказывает верные решения. Сложность: эмоциональная нестабильность и зависимость от настроения окружающих.`,
        mars:    `Главный период Марса — период энергии, смелости и преодоления. Активность высока: физическая работа, спорт, технические проекты, а также темы братьев, недвижимости и судебных дел. Этот период требует дисциплины и направленности усилий. Риск: конфликты, травмы, импульсивные решения — учись управлять марсианской силой.`,
        mercury: `Главный период Меркурия — период интеллекта, коммуникации и торговли. Время для обучения, письма, деловых переговоров и коротких поездок. Связи и информация становятся ключевыми ресурсами. Этот период особенно благоприятен для писателей, торговцев и аналитиков. Ограничения: нервозность и разбросанность внимания.`,
        jupiter: `Главный период Юпитера — лучший период в жизни многих людей: расширение, мудрость, удача и духовный рост. Возможны рождение детей, обучение у настоящих мастеров, международные связи и финансовый рост. Этот период развивает щедрость и оптимизм. Риск: самонадеянность и пренебрежение деталями — удача не вечна.`,
        venus:   `Главный период Венеры — самый долгий период (20 лет), наполненный удовольствиями, красотой и отношениями. Любовь, брак, искусство, роскошь и материальный комфорт — ключевые темы. Творческие начинания расцветают, а финансовый поток возрастает. Риск: пресыщение, лень и зависимость от внешних удовольствий.`,
        saturn:  `Главный период Сатурна — самый трудный, но и самый продуктивный период для долгосрочных результатов. Карма и уроки прошлого выходят на поверхность. Упорный труд, ограничения и дисциплина ведут к настоящим достижениям. Этот период формирует характер. Риск: депрессия, изоляция, пессимизм — практикуй терпение.`,
        rahu:    `Главный период Раху — период нестандартных амбиций и иллюзий. Жажда нового, иностранного и запретного. Карьерный взлёт возможен нетрадиционным путём. Технологии, политика и мистика — сферы влияния. Риск: обман, самообман и потеря ориентиров — сохраняй земную связь и ясность цели.`,
        ketu:    `Главный период Кету — период отречения, духовного поиска и растворения привязанностей. Прошлые умения всплывают на поверхность, а ненужное уходит. Этот период благоприятен для медитации, мистики и освобождения от кармических долгов. Риск: потеря интереса к мирскому, замкнутость, дезориентация — опирайся на практику и наставника.`,
      },
      en: {
        sun:     `Sun Main Period — a time of self-definition, career and recognition. This period strengthens will, confidence and the desire to occupy a prominent place. These are years to express yourself authentically, build reputation and take leadership. Father and authority figures play a key role. Risk: egocentrism and rigidity of judgment.`,
        moon:    `Moon Main Period — a period of emotions, family and intuition. Sensitivity is heightened, relationships with mother, home and the public are important. This period favors creativity and businesses related to nourishment and care. Intuition guides sound decisions. Challenge: emotional instability and dependence on the moods of others.`,
        mars:    `Mars Main Period — a period of energy, courage and overcoming. Activity is high: physical work, sports, technical projects, as well as themes of siblings, property and legal matters. This period demands discipline and directed effort. Risk: conflicts, injuries, impulsive decisions — learn to channel Martian force.`,
        mercury: `Mercury Main Period — a period of intellect, communication and trade. Time for learning, writing, business negotiations and short travel. Connections and information become key resources. Especially favorable for writers, traders and analysts. Limitation: nervousness and scattered attention.`,
        jupiter: `Jupiter Main Period — the best period in many people's lives: expansion, wisdom, luck and spiritual growth. Children may be born, learning from true masters, international connections and financial growth are possible. This period develops generosity and optimism. Risk: overconfidence and neglect of details — luck is not permanent.`,
        venus:   `Venus Main Period — the longest period (20 years), filled with pleasures, beauty and relationships. Love, marriage, art, luxury and material comfort are key themes. Creative endeavors flourish and financial flow increases. Risk: satiation, laziness and dependence on external pleasures.`,
        saturn:  `Saturn Main Period — the hardest but most productive period for long-term results. Karma and past lessons surface. Hard work, limitations and discipline lead to real achievement. This period builds character. Risk: depression, isolation, pessimism — practice patience.`,
        rahu:    `Rahu Main Period — a period of unconventional ambition and illusion. Craving for the new, foreign and forbidden. Career rise is possible through non-traditional paths. Technology, politics and mysticism are areas of influence. Risk: deception, self-deception and loss of direction — maintain grounded clarity of purpose.`,
        ketu:    `Ketu Main Period — a period of renunciation, spiritual seeking and dissolution of attachments. Past abilities surface while the unnecessary falls away. Favorable for meditation, mysticism and liberation from karmic debts. Risk: loss of interest in worldly matters, withdrawal, disorientation — rely on practice and a teacher.`,
      },
    };

    const ANTAR_MODIFY = {
      ru: {
        sun:"Подпериод Солнца добавляет ясность и карьерный импульс", moon:"Подпериод Луны усиливает эмоциональную сферу и семейные темы", mars:"Подпериод Марса придаёт энергию и решительность", mercury:"Подпериод Меркурия активизирует коммуникации и обучение", jupiter:"Подпериод Юпитера приносит возможности и расширение", venus:"Подпериод Венеры привлекает удовольствия и отношения", saturn:"Подпериод Сатурна требует терпения и структуры", rahu:"Подпериод Раху добавляет неожиданные повороты и амбиции", ketu:"Подпериод Кету ведёт к интроспекции и духовным инсайтам",
      },
      en: {
        sun:"Sun Sub-Period adds clarity and career momentum", moon:"Moon Sub-Period amplifies emotional and family themes", mars:"Mars Sub-Period adds energy and decisiveness", mercury:"Mercury Sub-Period activates communication and learning", jupiter:"Jupiter Sub-Period brings opportunities and expansion", venus:"Venus Sub-Period attracts pleasures and relationships", saturn:"Saturn Sub-Period demands patience and structure", rahu:"Rahu Sub-Period adds unexpected turns and ambition", ketu:"Ketu Sub-Period leads to introspection and spiritual insights",
      },
    };

    const DASHA_ADVICE = {
      ru: {
        sun:     ["Инвестируй в карьеру и публичную репутацию", "Работай с отцом и авторитетными наставниками", "Следи за самомнением — оставайся открытым"],
        moon:    ["Укрепляй семейные связи и домашний очаг", "Слушай интуицию — она сейчас особенно точна", "Береги эмоциональный ресурс, не реагируй импульсивно"],
        mars:    ["Направь энергию в спорт или физический труд", "Решай вопросы с братьями и недвижимостью", "Избегай конфликтов — направляй Марс созидательно"],
        mercury: ["Учись, пиши, развивай коммуникативные навыки", "Строй деловые связи и партнёрства", "Следи за нервной системой — делай паузы"],
        jupiter: ["Ищи наставника и развивайся духовно", "Инвестируй в образование и расширение", "Не пропускай возможности — Юпитер открывает двери"],
        venus:   ["Развивай творческие таланты и эстетику", "Инвестируй в отношения и красоту жизни", "Балансируй удовольствия с дисциплиной"],
        saturn:  ["Работай системно, уважай долгосрочные обязательства", "Принимай ограничения как школу мастерства", "Практикуй медитацию и терпение"],
        rahu:    ["Используй нестандартные подходы и технологии", "Проверяй информацию — иллюзии усилены", "Сохраняй ясность целей среди хаоса перемен"],
        ketu:    ["Практикуй медитацию и духовные практики", "Отпусти то, что больше не служит тебе", "Ищи уединения для переосмысления жизни"],
      },
      en: {
        sun:     ["Invest in career and public reputation", "Work with father and authoritative mentors", "Watch for pride — stay open to feedback"],
        moon:    ["Strengthen family bonds and home life", "Trust intuition — it is especially accurate now", "Protect emotional resources, don't react impulsively"],
        mars:    ["Direct energy into sport or physical work", "Resolve matters with siblings and property", "Avoid conflicts — channel Mars constructively"],
        mercury: ["Learn, write, develop communication skills", "Build business connections and partnerships", "Monitor the nervous system — take breaks"],
        jupiter: ["Seek a mentor and develop spiritually", "Invest in education and expansion", "Don't miss opportunities — Jupiter opens doors"],
        venus:   ["Develop creative talents and aesthetics", "Invest in relationships and the beauty of life", "Balance pleasures with discipline"],
        saturn:  ["Work systematically, respect long-term commitments", "Accept limitations as a school of mastery", "Practice meditation and patience"],
        rahu:    ["Use unconventional approaches and technology", "Verify information — illusions are amplified", "Maintain clarity of goals amid rapid change"],
        ketu:    ["Practice meditation and spiritual disciplines", "Release what no longer serves you", "Seek solitude for life reflection"],
      },
    };

    const mahaLong   = MAHA_LONG[lang]?.[mdKey] || "";
    const antarMod   = ANTAR_MODIFY[lang]?.[adKey] || "";
    const adviceList = DASHA_ADVICE[lang]?.[mdKey] || [];

    // Theme box
    t(ctx, isRu ? "ВАША ЖИЗНЕННАЯ ТЕМА" : "YOUR LIFE THEME", W/2, ty, { size: dashaLayout.sectionTitleSize, color: C.gold, align: "center", weight: "700" });
    ty += dashaLayout.sectionGap;

    const themeY = ty;
    const reservedAfterTheme = adviceList.length > 0 ? (compact ? 230 : 320) : (compact ? 130 : 180);
    const themeAvailH = Math.max(compact ? 180 : 220, H - themeY - reservedAfterTheme);
    const themeTextH = measureWrapHeight(ctx, mahaLong, W - 160, dashaLayout.themeLineH, { size: dashaLayout.themeSize, weight: "300" });
    const themeBoxH = Math.min(themeAvailH, Math.max(dashaLayout.themeMinH, themeTextH + (compact ? 40 : 56)));
    rrect(ctx, 60, themeY, W-120, themeBoxH, 12, "rgba(255,255,255,0.02)", mdCol, 0.18);
    wrap(ctx, mahaLong, 80, themeY + (compact ? 24 : 28), W - 160, dashaLayout.themeLineH, { size: dashaLayout.themeSize, color: C.text, align: "left", weight: "300", maxHeight: themeBoxH - (compact ? 40 : 56) });
    ty = themeY + themeBoxH + 14;

    // Antar modifier
    if (antarMod && ty + 60 < H - 220) {
      rrect(ctx, 60, ty, W-120, 60, 10, "rgba(255,255,255,0.02)", adCol, 0.15);
      glyphAt(ctx, PLANET_GLYPH[adKey] || "★", 108, ty + 30, 26, adCol);
      t(ctx, antarMod, 140, ty + 32, { size: compact ? 22 : 24, color: C.muted, align: "left", weight: "300", maxW: W - 200, alpha: 0.9 });
      ty += 72;
    }

    // Advice bullets
    if (adviceList.length > 0 && ty + 40 < H - 60) {
      hline(ctx, ty, 0.12);
      ty += dashaLayout.sectionGap;
      t(ctx, isRu ? "СОВЕТЫ" : "ADVICE", W/2, ty, { size: dashaLayout.sectionTitleSize, color: C.teal, align: "center", weight: "700" });
      ty += dashaLayout.sectionGap;
      adviceList.slice(0, 3).forEach(adv => {
        if (ty + dashaLayout.adviceCardH > H - 60) return;
        rrect(ctx, 60, ty, W-120, dashaLayout.adviceCardH, 10, "rgba(92,211,194,0.04)", C.teal, 0.15);
        t(ctx, "✦", 98, ty + dashaLayout.adviceCardH / 2 + 2, { size: 20, color: C.teal, align: "center" });
        wrap(ctx, adv, 124, ty + (compact ? 32 : 34), W - 192, compact ? 26 : 30, { size: dashaLayout.adviceTextSize, color: C.text, align: "left", weight: "300", maxLines: 2 });
        ty += dashaLayout.adviceCardH + 12;
      });
    }

    footer(ctx);
    return true;
  }

  // ── Personal Card 3: Today's Forecast (transits + natal) ────────────────

  async function renderPersonalForecast(ctx, chart, lang, transits) {
    if (!chart) return false;
    const isRu   = lang === "ru";
    const compact = isPostFrame();
    const transit = transits.planets || [];
    const natal   = chart.planets || {};
    const birth   = chart.birth   || {};
    const dasha   = chart.dashas?.current || {};
    const lagnaSign = (chart.lagna || {}).sign || "";

    const forecastLayout = compact ? {
      nameY: 86,
      nameSize: 40,
      subY: 126,
      subSize: 21,
      lineY: 154,
      startY: 172,
      barH: 64,
      barGap: 10,
      barTitleY: 24,
      barTitleSize: 14,
      barValueY: 48,
      barValueSize: 24,
      moonGlyphSize: 24,
      sectionGap: 18,
      sectionTitleSize: 17,
      narrativeTop: 20,
      narrativeSize: 18,
      narrativeLineH: 28,
      influenceH: 70,
      influenceGap: 8,
      influenceTitleSize: 18,
      influenceTextSize: 15,
      adviceTop: 26,
      adviceSize: 16,
      adviceStepGap: 34,
      adviceBoxMax: 126,
    } : {
      nameY: 90,
      nameSize: 48,
      subY: 144,
      subSize: 26,
      lineY: 174,
      startY: 196,
      barH: 84,
      barGap: 12,
      barTitleY: 28,
      barTitleSize: 17,
      barValueY: 62,
      barValueSize: 32,
      moonGlyphSize: 30,
      sectionGap: 28,
      sectionTitleSize: 21,
      narrativeTop: 28,
      narrativeSize: 27,
      narrativeLineH: 46,
      influenceH: 88,
      influenceGap: 10,
      influenceTitleSize: 27,
      influenceTextSize: 23,
      adviceTop: 36,
      adviceSize: 25,
      adviceStepGap: 58,
      adviceBoxMax: 200,
    };

    drawStars(ctx, 33);
    radialGlow(ctx, W*0.5, H*0.2, 0, W*0.8, "#6c8cff", 0.10);
    radialGlow(ctx, W*0.2, H*0.7, 0, W*0.6, "#d8b764", 0.07);
    corners(ctx, 60, 60);

    const name = birth.name || "";

    // ── HEADER ───────────────────────────────────────────────────────────
    t(ctx, name || (isRu ? "Прогноз" : "Forecast"), W/2, forecastLayout.nameY, { size: forecastLayout.nameSize, color: C.textBr, align: "center", weight: "800", glow: C.indigo });
    t(ctx, isRu ? "Прогноз на сегодня  ·  " + todayStr() : "Today's Forecast  ·  " + todayStr(), W/2, forecastLayout.subY, { size: forecastLayout.subSize, color: C.gold, align: "center" });

    hline(ctx, forecastLayout.lineY, 0.22);

    let y = forecastLayout.startY;

    // ── COMPACT DASHA BAR ────────────────────────────────────────────────
    if (dasha.mahadasha) {
      const mdKey = (dasha.mahadasha || "").toLowerCase();
      const adKey = (dasha.antardasha || "").toLowerCase();
      const ptKey = (dasha.pratyantardasha || "").toLowerCase();
      const mdCol = PLANET_COLOR[mdKey] || C.gold;
      rrect(ctx, 60, y, W-120, forecastLayout.barH, 10, "rgba(255,255,255,0.03)", mdCol, 0.25);
      t(ctx, isRu ? "ПЕРИОД" : "PERIOD", 92, y + forecastLayout.barTitleY, { size: forecastLayout.barTitleSize, color: mdCol, align: "left", weight: "700" });
      const dashaStr = [pname(mdKey,isRu), adKey ? pname(adKey,isRu) : null, ptKey ? pname(ptKey,isRu) : null].filter(Boolean).join("  →  ");
      t(ctx, dashaStr, 92, y + forecastLayout.barValueY, { size: forecastLayout.barValueSize, color: C.textBr, align: "left", weight: "600", glow: mdCol, maxW: W - 170 });
      y += forecastLayout.barH + forecastLayout.barGap;
    }

    // ── COMPACT MOON BAR ─────────────────────────────────────────────────
    const tMoon = transit.find(p => p.planet === "moon") || {};
    if (tMoon.sign) {
      const moonElemCol = ELEM_COLOR[SIGN_ELEM[tMoon.sign]] || C.gold;
      rrect(ctx, 60, y, W-120, forecastLayout.barH, 10, "rgba(200,216,255,0.04)", PLANET_COLOR.moon, 0.25);
      t(ctx, isRu ? "ЛУНА СЕГОДНЯ" : "MOON TODAY", 92, y + forecastLayout.barTitleY, { size: forecastLayout.barTitleSize, color: PLANET_COLOR.moon, align: "left", weight: "700" });
      glyphAt(ctx, SIGN_GLYPH[tMoon.sign] || "?", 104, y + forecastLayout.barValueY, forecastLayout.moonGlyphSize, moonElemCol);
      t(ctx, sname(tMoon.sign, isRu), 142, y + forecastLayout.barValueY, { size: forecastLayout.barValueSize, color: moonElemCol, align: "left", weight: "600", maxW: W - 220 });
      y += forecastLayout.barH + forecastLayout.barGap;
    }

    hline(ctx, y, 0.18);
    y += forecastLayout.sectionGap;

    // ── КАК ПРОЙДЁТ ДЕНЬ — narrative block ──────────────────────────────
    t(ctx, isRu ? "КАК ПРОЙДЁТ ДЕНЬ" : "HOW THE DAY WILL GO", W/2, y, { size: forecastLayout.sectionTitleSize, color: C.gold, align: "center", weight: "700" });
    y += forecastLayout.sectionGap;

    const mdKey2 = (dasha.mahadasha || "").toLowerCase();
    const adKey2 = (dasha.antardasha || "").toLowerCase();
    const tSun   = transit.find(p => p.planet === "sun")     || {};
    const tMerc  = transit.find(p => p.planet === "mercury") || {};
    const tVenus = transit.find(p => p.planet === "venus")   || {};
    const tMars  = transit.find(p => p.planet === "mars")    || {};
    const tJup   = transit.find(p => p.planet === "jupiter") || {};
    const tSat   = transit.find(p => p.planet === "saturn")  || {};
    const nSun   = natal.sun   || {};
    const nMoon  = natal.moon  || {};

    const mercRetro = tMerc.retrograde;
    const venusOk   = !tVenus.retrograde && tVenus.dignity !== "debilitated";
    const dayTone   = mercRetro ? (isRu?"осторожный":"cautious") : venusOk ? (isRu?"благоприятный":"favorable") : (isRu?"умеренный":"moderate");

    const DAY_NARRATIVE_RU = `Сегодня для ${name || "вас"} — ${dayTone} день. Даша ${pname(mdKey2, true)}${adKey2 ? " / " + pname(adKey2, true) : ""} задаёт общий вектор периода. Луна в ${sname(tMoon.sign || "", true)} затрагивает вашу natal-${sname(nMoon.sign || "", true)} природу: ${tMoon.sign === nMoon.sign ? "резонанс усилен" : "эмоциональный фон переменчив"}. Солнце в ${sname(tSun.sign || "", true)} освещает сферы, связанные с вашим natal-${sname(nSun.sign || "", true)} Солнцем. ${mercRetro ? "Меркурий ретроградный — будь вдвойне внимателен к деталям." : "Меркурий прямой — коммуникации чисты."} Используй этот день в соответствии с вашей дашей: ${mdKey2 === "jupiter" || mdKey2 === "venus" ? "расширяй и наслаждайся" : mdKey2 === "saturn" ? "работай методично" : "действуй и строй"}.`;
    const DAY_NARRATIVE_EN = `Today is a ${dayTone} day for ${name || "you"}. The ${pname(mdKey2, false)}${adKey2 ? " / " + pname(adKey2, false) : ""} Dasha sets the overall vector of this period. Moon in ${tMoon.sign || "—"} touches your natal ${nMoon.sign || "—"} Moon nature: ${tMoon.sign === nMoon.sign ? "resonance is amplified" : "emotional tone is variable"}. Sun in ${tSun.sign || "—"} illuminates areas connected to your natal ${nSun.sign || "—"} Sun. ${mercRetro ? "Mercury retrograde — be doubly careful with details." : "Mercury direct — communications are clear."} Use this day in accordance with your dasha: ${mdKey2 === "jupiter" || mdKey2 === "venus" ? "expand and enjoy" : mdKey2 === "saturn" ? "work methodically" : "act and build"}.`;

    const narrativeText = isRu ? DAY_NARRATIVE_RU : DAY_NARRATIVE_EN;
    const narrativeTextH = measureWrapHeight(ctx, narrativeText, W - 160, forecastLayout.narrativeLineH, { size: forecastLayout.narrativeSize, weight: "300", maxLines: compact ? 3 : 5 });
    const narrativeAvailH = Math.max(compact ? 144 : 180, H - y - (compact ? 360 : 560));
    const narrativeH = Math.min(compact ? 126 : 230, Math.min(narrativeAvailH, narrativeTextH + (compact ? 28 : 56)));
    rrect(ctx, 60, y, W-120, narrativeH, 12, "rgba(108,140,255,0.04)", C.indigo, 0.2);
    wrap(ctx, narrativeText, 80, y + forecastLayout.narrativeTop, W - 160, forecastLayout.narrativeLineH, { size: forecastLayout.narrativeSize, color: C.text, align: "left", weight: "300", maxHeight: narrativeH - (forecastLayout.narrativeTop + 10) });
    y += narrativeH + forecastLayout.sectionGap;

    // ── PLANETARY INFLUENCES (2-line each) ───────────────────────────────
    hline(ctx, y, 0.15);
    y += forecastLayout.sectionGap;
    t(ctx, isRu ? "ВЛИЯНИЕ ПЛАНЕТ" : "PLANETARY INFLUENCES", W/2, y, { size: forecastLayout.sectionTitleSize, color: C.gold, align: "center", weight: "700" });
    y += forecastLayout.sectionGap;

    const influences = [];
    const nLagna = chart.lagna?.sign || "";

    if (tSun.sign) influences.push({
      planet:"sun", col: PLANET_COLOR.sun, retro: false,
      line1: isRu ? `Солнце в ${sname(tSun.sign,true)}` : `Sun in ${tSun.sign}`,
      line2: isRu
        ? `Освещает сферу ${sname(tSun.sign,true)} — день для инициативы и самовыражения`
        : `Illuminates ${tSun.sign} sphere — a day for initiative and self-expression`,
    });
    if (tMoon.sign) influences.push({
      planet:"moon", col: PLANET_COLOR.moon, retro: false,
      line1: isRu ? `Луна в ${sname(tMoon.sign,true)}` : `Moon in ${tMoon.sign}`,
      line2: isRu
        ? `Эмоциональный тон дня — ${tMoon.sign === nMoon.sign ? "усиленная чувствительность" : "переменчивое настроение"}`
        : `Emotional tone — ${tMoon.sign === nMoon.sign ? "heightened sensitivity" : "shifting moods"}`,
    });
    if (tMerc.sign) influences.push({
      planet:"mercury", col: PLANET_COLOR.mercury, retro: mercRetro,
      line1: isRu ? `Меркурий ${mercRetro?"℞ ":""}в ${sname(tMerc.sign,true)}` : `Mercury ${mercRetro?"℞ ":""}in ${tMerc.sign}`,
      line2: isRu
        ? (mercRetro ? "Перепроверяй все данные, избегай важных решений" : "Коммуникации ясны — хорошее время для переговоров")
        : (mercRetro ? "Double-check all data, avoid important decisions" : "Communications clear — good time for negotiations"),
    });
    if (tVenus.sign) influences.push({
      planet:"venus", col: PLANET_COLOR.venus, retro: tVenus.retrograde,
      line1: isRu ? `Венера${tVenus.retrograde?" ℞":""} в ${sname(tVenus.sign,true)}` : `Venus${tVenus.retrograde?" ℞":""} in ${tVenus.sign}`,
      line2: isRu
        ? (venusOk ? "Благоприятно для отношений, красоты и творчества" : "Отношения требуют терпения и осторожности")
        : (venusOk ? "Favorable for relationships, beauty and creativity" : "Relationships require patience and care"),
    });
    if (tMars.sign) influences.push({
      planet:"mars", col: PLANET_COLOR.mars, retro: tMars.retrograde,
      line1: isRu ? `Марс${tMars.retrograde?" ℞":""} в ${sname(tMars.sign,true)}` : `Mars${tMars.retrograde?" ℞":""} in ${tMars.sign}`,
      line2: isRu
        ? (tMars.retrograde ? "Сдержи импульсы, избегай конфликтов" : `Энергия направлена в ${sname(tMars.sign,true)} — используй её`)
        : (tMars.retrograde ? "Restrain impulses, avoid conflicts" : `Energy directed toward ${tMars.sign} — use it`),
    });
    if (tJup.sign) influences.push({
      planet:"jupiter", col: PLANET_COLOR.jupiter, retro: tJup.retrograde,
      line1: isRu ? `Юпитер${tJup.retrograde?" ℞":""} в ${sname(tJup.sign,true)}` : `Jupiter${tJup.retrograde?" ℞":""} in ${tJup.sign}`,
      line2: isRu
        ? (tJup.retrograde ? "Внутренний рост важнее внешних достижений" : "Возможности для роста и расширения открыты")
        : (tJup.retrograde ? "Inner growth over outer achievement" : "Opportunities for growth and expansion are open"),
    });

    influences.slice(0, compact ? 3 : 5).forEach(h => {
      if (y + forecastLayout.influenceH > H - 120) return;
      rrect(ctx, 60, y, W-120, forecastLayout.influenceH, 10, "rgba(255,255,255,0.02)", h.col, 0.18);
      glyphAt(ctx, PLANET_GLYPH[h.planet] || "★", 104, y + forecastLayout.influenceH / 2, compact ? 30 : 34, h.col);
      if (h.retro) t(ctx, "℞", 164, y + 22, { size: 16, color: C.danger, align: "left" });
      t(ctx, h.line1, 164, y + 30, { size: forecastLayout.influenceTitleSize, color: C.textBr, align: "left", weight: "600", maxW: W - 240 });
      wrap(ctx, h.line2, 164, y + (compact ? 50 : 64), W - 240, compact ? 18 : 28, { size: forecastLayout.influenceTextSize, color: C.muted, align: "left", weight: "300", alpha: 0.8, maxLines: compact ? 1 : 2 });
      y += forecastLayout.influenceH + forecastLayout.influenceGap;
    });

    // ── СОВЕТ ДНЯ ────────────────────────────────────────────────────────
    if (y + 100 < H - 60) {
      hline(ctx, y, 0.12);
      y += forecastLayout.sectionGap;
      t(ctx, isRu ? "СОВЕТ ДНЯ" : "DAILY ADVICE", W/2, y, { size: forecastLayout.sectionTitleSize, color: C.teal, align: "center", weight: "700" });
      y += forecastLayout.sectionGap;

      const ADVICE_ITEMS_RU = [
        mercRetro ? "Дважды проверяй все договорённости и данные сегодня" : `Используй коммуникативную ясность Меркурия в ${sname(tMerc.sign||"",true)}`,
        venusOk ? "Инвестируй время в отношения и эстетические удовольствия" : "Поддерживай гармонию в отношениях, не требуй слишком много",
        mdKey2 === "jupiter" ? "Ищи возможности для роста и расширения — Юпитер открывает двери" : mdKey2 === "saturn" ? "Действуй методично и терпеливо — Сатурн ценит упорство" : "Действуй в русле своего текущего главного периода",
      ];
      const ADVICE_ITEMS_EN = [
        mercRetro ? "Double-check all agreements and data today" : `Use Mercury's communicative clarity in ${tMerc.sign||"—"}`,
        venusOk ? "Invest time in relationships and aesthetic pleasures" : "Maintain harmony in relationships, don't demand too much",
        mdKey2 === "jupiter" ? "Seek opportunities for growth — Jupiter opens doors" : mdKey2 === "saturn" ? "Act methodically and patiently — Saturn rewards persistence" : "Act in alignment with your current Main Period",
      ];
      const advItems = isRu ? ADVICE_ITEMS_RU : ADVICE_ITEMS_EN;
      const advBoxH = Math.min(H - y - 60, forecastLayout.adviceBoxMax);
      rrect(ctx, 60, y, W-120, advBoxH, 12, "rgba(92,211,194,0.04)", C.teal, 0.2);
      advItems.forEach((item, idx) => {
        if (y + forecastLayout.adviceTop + idx * forecastLayout.adviceStepGap + 30 > H - 60) return;
        t(ctx, `${idx+1}.`, 90, y + forecastLayout.adviceTop + idx * forecastLayout.adviceStepGap, { size: compact ? 20 : 22, color: C.teal, align: "left", weight: "700" });
        wrap(ctx, item, 122, y + forecastLayout.adviceTop + idx * forecastLayout.adviceStepGap, W - 190, compact ? 24 : 28, { size: forecastLayout.adviceSize, color: C.text, align: "left", weight: "300", maxLines: 2 });
      });
    }

    footer(ctx);
    return true;
  }

  // ── Public ────────────────────────────────────────────────────────────────

  async function generateAll(format, chart, lang) {
    const date = new Date().toISOString().slice(0, 10);

    if (format === "day_report") {
      const res = await fetch(`/api/transits/today?lang=${lang}`);
      if (!res.ok) throw new Error("Transit API: " + res.status);
      const transits = await res.json();

      const ctx0 = makeCtxForSlot(0); clearBg(ctx0); await renderDayReport(ctx0, lang, transits);
      const ctx1 = makeCtxForSlot(1); clearBg(ctx1); renderDayWarnings(ctx1, lang, transits);
      const ctx2 = makeCtxForSlot(2); clearBg(ctx2); renderDayEnergy(ctx2, lang, transits);
      return { count: 3, labels: [isRu(lang)?"отчёт":"report", isRu(lang)?"предупреждения":"warnings", isRu(lang)?"энергия":"energy"], date };
    }

    if (format === "personal") {
      if (!chart) return null;
      const res = await fetch(`/api/transits/today?lang=${lang}`);
      if (!res.ok) throw new Error("Transit API: " + res.status);
      const transits = await res.json();

      const ctx0 = makeCtxForSlot(0); clearBg(ctx0); renderPersonalNatal(ctx0, chart, lang);
      const ctx1 = makeCtxForSlot(1); clearBg(ctx1); renderPersonalDasha(ctx1, chart, lang);
      const ctx2 = makeCtxForSlot(2); clearBg(ctx2); await renderPersonalForecast(ctx2, chart, lang, transits);
      document.getElementById("cardsSlot3")?.classList.add("hidden");
      return { count: 3, labels: [isRu(lang)?"натал":"natal", isRu(lang)?"даша":"dasha", isRu(lang)?"прогноз":"forecast"], date };
    }

    return null;
  }

  function isRu(lang) { return lang === "ru"; }

  function downloadSlot(index, label, date, lang) {
    const canvas = document.getElementById(`cardsCanvas${index}`);
    if (!canvas) return;
    const frame = getFrameConfig();
    const a = document.createElement("a");
    a.download = `astro_${label}_${frame.slug}_${lang}_${date}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  return {
    generateAll,
    downloadSlot,
    getFrameConfig,
    getFrameKey: () => currentFrameKey,
    setFrameKey,
  };
})();

// ── UI wiring ─────────────────────────────────────────────────────────────────
(function initCardsUI() {
  const fmtSel = document.getElementById("cardsFormat");
  const cardsRow = document.getElementById("cardsRow");
  const lightboxEl = document.getElementById("cardsLightbox");
  const lightboxBackdrop = document.getElementById("cardsLightboxBackdrop");
  const lightboxClose = document.getElementById("cardsLightboxClose");
  const lightboxCanvas = document.getElementById("cardsLightboxCanvas");
  const lightboxTitle = document.getElementById("cardsLightboxTitle");
  const lightboxRatio = document.getElementById("cardsLightboxRatio");
  if (!fmtSel) return;

  // Use app's global language (document.documentElement.lang set by applyI18n)
  function getLang() {
    return document.documentElement.lang === "en" ? "en" : "ru";
  }

  function updatePreviewChrome(result = null) {
    const frameKey = "story";
    const frameLabel = "9:16";
    if (cardsRow) {
      cardsRow.dataset.frame = frameKey;
      cardsRow.dataset.format = fmtSel.value;
    }
    for (let i = 0; i < 4; i += 1) {
      const ratioEl = document.getElementById(`cardsSlotRatio${i}`);
      const titleEl = document.getElementById(`cardsSlotTitle${i}`);
      const slotEl = document.getElementById(`cardsSlot${i}`);
      if (ratioEl) ratioEl.textContent = frameLabel;
      if (titleEl) titleEl.textContent = result?.labels?.[i] || `Preview ${i + 1}`;
      if (slotEl) {
        slotEl.dataset.frame = frameKey;
        slotEl.dataset.format = fmtSel.value;
      }
    }
  }

  let lastResult = null;
  let generating = false;
  updatePreviewChrome();

  function openLightbox(index) {
    if (!lightboxEl || !lightboxCanvas) return;
    const source = document.getElementById(`cardsCanvas${index}`);
    if (!source) return;
    const ratioLabel = "9:16";
    lightboxCanvas.width = source.width;
    lightboxCanvas.height = source.height;
    const ctx = lightboxCanvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, source.width, source.height);
    ctx.drawImage(source, 0, 0);
    if (lightboxTitle) {
      lightboxTitle.textContent = lastResult?.labels?.[index] || `Preview ${index + 1}`;
    }
    if (lightboxRatio) {
      lightboxRatio.textContent = ratioLabel;
    }
    lightboxEl.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightboxEl) return;
    lightboxEl.classList.add("hidden");
    document.body.style.overflow = "";
  }

  async function autoGenerate() {
    if (generating) return;
    const format = fmtSel.value;
    const lang   = getLang();
    const chart  = window._cardsState?.chart || null;
    updatePreviewChrome(lastResult);

    if (format === "personal" && !chart) {
      const frame = CARDS.getFrameConfig();
      [0,1,2].forEach(i => {
        const cv   = document.getElementById(`cardsCanvas${i}`);
        const slot = document.getElementById(`cardsSlot${i}`);
        if (!cv || !slot) return;
        slot.classList.remove("hidden");
        const ctx = cv.getContext("2d");
        cv.width = frame.width; cv.height = frame.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, frame.width, frame.height);
        ctx.fillStyle = "#07060f"; ctx.fillRect(0, 0, frame.width, frame.height);
        ctx.font = "bold 48px system-ui,sans-serif";
        ctx.fillStyle = "rgba(169,163,194,0.5)";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(lang === "ru" ? "Рассчитайте карту" : "Calculate a chart first", frame.width / 2, frame.height / 2);
      });
      document.getElementById("cardsSlot3")?.classList.add("hidden");
      lastResult = null;
      updatePreviewChrome();
      return;
    }

    generating = true;
    fmtSel.disabled = true;
    try {
      lastResult = await CARDS.generateAll(format, chart, lang);
      if (lastResult) {
        for (let i = 0; i < 4; i++) {
          const slot = document.getElementById(`cardsSlot${i}`);
          if (!slot) continue;
          if (i < lastResult.count) slot.classList.remove("hidden");
          else slot.classList.add("hidden");
        }
        updatePreviewChrome(lastResult);
      }
    } catch (e) {
      console.error("Cards error:", e);
    } finally {
      generating = false;
      fmtSel.disabled = false;
    }
  }

  fmtSel.addEventListener("change", autoGenerate);

  // Re-generate when app language changes (observer on html[lang])
  new MutationObserver(() => {
    const tab = document.getElementById("tab-content");
    if (tab?.classList.contains("active")) autoGenerate();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  document.querySelectorAll('.tab[data-tab="content"]').forEach(btn => {
    btn.addEventListener("click", () => setTimeout(autoGenerate, 50));
  });

  if (document.getElementById("tab-content")?.classList.contains("active")) {
    autoGenerate();
  }

  document.getElementById("cardsRow")?.addEventListener("click", async e => {
    const btn = e.target.closest(".cards-action-btn");
    if (btn && lastResult) {
      const idx    = parseInt(btn.dataset.slot, 10);
      const action = btn.dataset.action;
      const label  = lastResult.labels?.[idx] || `card${idx}`;

      if (action === "download") {
        CARDS.downloadSlot(idx, label, lastResult.date, getLang());
      } else if (action === "copy") {
        const canvas = document.getElementById(`cardsCanvas${idx}`);
        if (!canvas) return;
        try {
          const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          btn.classList.add("copied");
          const orig = btn.innerHTML;
          btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>`;
          setTimeout(() => { btn.classList.remove("copied"); btn.innerHTML = orig; }, 1800);
        } catch (err) {
          console.error("Copy failed:", err);
        }
      }
      return;
    }

    const wrap = e.target.closest(".cards-wrap");
    if (!wrap || !cardsRow?.contains(wrap)) return;
    const slot = wrap.closest(".cards-slot");
    if (!slot || slot.classList.contains("hidden")) return;
    const idx = parseInt(slot.id.replace("cardsSlot", ""), 10);
    if (!Number.isFinite(idx)) return;
    openLightbox(idx);
  });

  lightboxBackdrop?.addEventListener("click", closeLightbox);
  lightboxClose?.addEventListener("click", closeLightbox);
  lightboxEl?.addEventListener("click", (e) => {
    if (e.target === lightboxEl) closeLightbox();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightboxEl && !lightboxEl.classList.contains("hidden")) {
      closeLightbox();
    }
  });
})();
