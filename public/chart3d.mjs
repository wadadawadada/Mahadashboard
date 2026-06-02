import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { FilmShader } from "three/addons/shaders/FilmShader.js";
import { VignetteShader } from "three/addons/shaders/VignetteShader.js";

const PLANETS = {
  sun: { glyph: "☉", color: 0xffc864, emissive: 0xff8a1f, size: 0.46, label: "Sun" },
  moon: { glyph: "☽", color: 0xe6efff, emissive: 0x6c8cff, size: 0.36, label: "Moon" },
  mars: { glyph: "♂", color: 0xff6a4a, emissive: 0xb01b0a, size: 0.33, label: "Mars" },
  mercury: { glyph: "☿", color: 0x86f0d4, emissive: 0x1f8a78, size: 0.30, label: "Mercury" },
  jupiter: { glyph: "♃", color: 0xf3d27a, emissive: 0xa7741a, size: 0.42, label: "Jupiter" },
  venus: { glyph: "♀", color: 0xffb2d5, emissive: 0xb44b87, size: 0.35, label: "Venus" },
  saturn: { glyph: "♄", color: 0xc9bfa6, emissive: 0x5e5040, size: 0.39, label: "Saturn" },
  rahu: { glyph: "☊", color: 0xb796ff, emissive: 0x4a2bb8, size: 0.32, label: "Rahu" },
  ketu: { glyph: "☋", color: 0x9ab8ff, emissive: 0x2a47b5, size: 0.32, label: "Ketu" },
};

const SIGN_NAMES = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
const SIGN_GLYPHS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

const JYOTISH_ASPECTS = {
  sun: [7],
  moon: [7],
  mercury: [7],
  venus: [7],
  mars: [4, 7, 8],
  jupiter: [5, 7, 9],
  saturn: [3, 7, 10],
  rahu: [5, 7, 9],
  ketu: [5, 7, 9],
};

const ASPECT_COLORS = {
  7: 0xd8b764,
  4: 0xff6a4a,
  8: 0xff6a4a,
  3: 0xc9bfa6,
  10: 0xc9bfa6,
  5: 0xf3d27a,
  9: 0xf3d27a,
};

const LEGEND_SAFE_ZONE_RIGHT = 128;

export function renderChart3D(container, chart, options = {}) {
  cleanup(container);
  container.innerHTML = `
    <div class="three-chart-stage"></div>
    <div class="chart-labels"></div>
    <div class="chart-tooltip hidden"></div>
    <div class="chart-planet-list">${buildPlanetListHTML(chart)}</div>
    <div class="chart-controls">
      <div class="chart-view-toggle" role="tablist">
        <button class="view-toggle-btn active" data-action="view-3d" type="button">3D</button>
        <button class="view-toggle-btn" data-action="view-2d" type="button">2D</button>
      </div>
      <button class="chart-control-btn active" data-action="aspects" title="Aspect lines">
        <svg viewBox="0 0 24 24" class="icon"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        <span>Aspects</span>
      </button>
      <button class="chart-control-btn active" data-action="orbits" title="Orbit trails">
        <svg viewBox="0 0 24 24" class="icon"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/></svg>
        <span>Orbits</span>
      </button>
      <button class="chart-control-btn active" data-action="rotate" title="Auto rotate">
        <svg viewBox="0 0 24 24" class="icon"><path d="M21 12a9 9 0 0 1-15.4 6.4L3 16"/><path d="M3 12A9 9 0 0 1 18.4 5.6L21 8"/></svg>
        <span>Auto</span>
      </button>
      <button class="chart-control-btn" data-action="reset" title="Reset view">
        <svg viewBox="0 0 24 24" class="icon"><path d="M12 2v20M2 12h20"/></svg>
        <span>Reset</span>
      </button>
    </div>
  `;

  const stage = container.querySelector(".three-chart-stage");
  const labelsEl = container.querySelector(".chart-labels");
  const tooltip = container.querySelector(".chart-tooltip");
  const planetList = container.querySelector(".chart-planet-list");
  const controls = container.querySelector(".chart-controls");
  const onPlanetSelect = typeof options.onPlanetSelect === "function" ? options.onPlanetSelect : null;

  const state = {
    showAspects: true,
    showOrbits: true,
    autoRotate: true,
    mode: "3d",
  };

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05060e, 0.024);

  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const VIEW_3D = { rotX: -0.42, camY: 8.4, camZ: 11.6 };
  const VIEW_2D = { rotX: -Math.PI / 2, camY: 14.0, camZ: 0.1 };
  const cameraTarget = { rotX: VIEW_3D.rotX, camY: VIEW_3D.camY, camZ: VIEW_3D.camZ };
  camera.position.set(0, VIEW_3D.camY, VIEW_3D.camZ);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(stage.clientWidth || 1, stage.clientHeight || 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.78;
  stage.appendChild(renderer.domElement);

  const root = new THREE.Group();
  root.rotation.x = -0.42;
  scene.add(root);

  addLights(scene);
  const nebula = addNebula(scene);
  const stars = addStarLayers(scene);
  const orbits = addOrbitRings(root);
  addZodiacBand(root);
  addHouseLines(root);
  const signAnchors = addSignLabels(root);
  const lagnaData = addLagnaCore(root, chart);

  const planetObjects = addPlanets(root, chart);
  const aspectGroup = buildAspectLines(root, chart, planetObjects);

  const planetLabelEls = buildPlanetLabels(labelsEl, planetObjects);
  const signLabelEls = buildSignLabels(labelsEl, signAnchors);
  const lagnaEl = buildLagnaLabel(labelsEl, lagnaData);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  composer.setSize(stage.clientWidth || 1, stage.clientHeight || 1);
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(stage.clientWidth || 1, stage.clientHeight || 1), 0.32, 0.45, 0.85);
  composer.addPass(bloomPass);

  const filmPass = new ShaderPass(FilmShader);
  filmPass.uniforms.intensity.value = 0.14;
  filmPass.uniforms.grayscale.value = 0;
  composer.addPass(filmPass);

  const vignettePass = new ShaderPass(VignetteShader);
  vignettePass.uniforms.offset.value = 1.0;
  vignettePass.uniforms.darkness.value = 1.0;
  composer.addPass(vignettePass);

  const fxaaPass = new ShaderPass(FXAAShader);
  composer.addPass(fxaaPass);

  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hoverTargets = planetObjects.map((p) => p.hitMesh);
  let pointerActive = false;

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let parallaxX = 0;
  let parallaxY = 0;
  let downX = 0;
  let downY = 0;

  function selectPlanetByKey(key, source = "chart") {
    if (!onPlanetSelect || !key) return;
    const planet = chart.planets?.[key];
    if (!planet) return;
    onPlanetSelect({
      division: "D1",
      source,
      planet_key: key,
      planet,
    });
  }

  const onPointerDown = (event) => {
    pointerActive = true;
    updatePointer(event, stage, pointer);
    dragging = true;
    state.autoRotate = false;
    syncControls();
    lastX = event.clientX;
    lastY = event.clientY;
    downX = event.clientX;
    downY = event.clientY;
    stage.setPointerCapture?.(event.pointerId);
  };

  const onPointerMove = (event) => {
    pointerActive = true;
    updatePointer(event, stage, pointer);
    parallaxX = pointer.x;
    parallaxY = pointer.y;
    updateHover();
    if (!dragging) return;
    const dx = event.clientX - lastX;
    const dy = event.clientY - lastY;
    root.rotation.y += dx * 0.0085;
    root.rotation.x += dy * 0.006;
    root.rotation.x = Math.max(-1.2, Math.min(0.45, root.rotation.x));
    cameraTarget.rotX = root.rotation.x;
    lastX = event.clientX;
    lastY = event.clientY;
  };

  const onPointerUp = (event) => {
    dragging = false;
    cameraTarget.rotX = root.rotation.x;
    const moved = Math.hypot((event.clientX || 0) - downX, (event.clientY || 0) - downY);
    if (moved < 6) {
      updatePointer(event, stage, pointer);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hoverTargets, false);
      if (hits.length) {
        selectPlanetByKey(hits[0].object.userData.key, "chart-object");
      }
    }
    stage.releasePointerCapture?.(event.pointerId);
  };

  const onWheel = (event) => {
    event.preventDefault();
    if (state.mode === "2d") {
      cameraTarget.camY = Math.max(7, Math.min(26, cameraTarget.camY + event.deltaY * 0.01));
    } else {
      const next = Math.max(7.4, Math.min(18, camera.position.z + event.deltaY * 0.006));
      camera.position.z = next;
      camera.position.y = Math.max(5.4, Math.min(11, 0.75 * next));
      camera.lookAt(0, 0, 0);
    }
  };

  const onLeave = () => {
    pointerActive = false;
    tooltip.classList.add("hidden");
    planetObjects.forEach((p) => p.setHover(false));
  };

  const onResize = () => {
    const width = stage.clientWidth || 1;
    const height = stage.clientHeight || 1;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    composer.setSize(width, height);
    fxaaPass.uniforms.resolution.value.set(1 / (width * renderer.getPixelRatio()), 1 / (height * renderer.getPixelRatio()));
    bloomPass.setSize(width, height);
  };

  function updateHover() {
    if (!pointerActive) {
      tooltip.classList.add("hidden");
      planetObjects.forEach((p) => p.setHover(false));
      return;
    }
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hoverTargets, false);
    if (!hits.length) {
      tooltip.classList.add("hidden");
      planetObjects.forEach((p) => p.setHover(false));
      return;
    }
    const planetMeta = hits[0].object.userData.planet;
    planetObjects.forEach((p) => p.setHover(p.userData.planet === planetMeta));
    tooltip.classList.remove("hidden");
    tooltip.innerHTML = `
      <strong>${escapeHtml(planetMeta.name)}</strong>
      <span>${escapeHtml(planetMeta.sign)} ${escapeHtml(planetMeta.degree_formatted)} &middot; H${escapeHtml(planetMeta.house)}</span>
      <span>${escapeHtml(planetMeta.nakshatra)} Pada ${escapeHtml(planetMeta.pada)}${planetMeta.retrograde ? " &middot; Rx" : ""}</span>
    `;
  }

  function syncControls() {
    controls.querySelectorAll(".chart-control-btn").forEach((btn) => {
      const action = btn.dataset.action;
      if (action === "aspects") btn.classList.toggle("active", state.showAspects);
      if (action === "orbits") btn.classList.toggle("active", state.showOrbits);
      if (action === "rotate") btn.classList.toggle("active", state.autoRotate);
    });
    controls.querySelectorAll(".view-toggle-btn").forEach((btn) => {
      const isActive = (btn.dataset.action === "view-3d" && state.mode === "3d") || (btn.dataset.action === "view-2d" && state.mode === "2d");
      btn.classList.toggle("active", isActive);
    });
  }

  function setMode(mode) {
    state.mode = mode;
    const target = mode === "2d" ? VIEW_2D : VIEW_3D;
    cameraTarget.camY = target.camY;
    cameraTarget.camZ = target.camZ;
    if (mode === "2d") {
      state.autoRotate = false;
      root.rotation.y = 0;
      camera.up.set(0, 0, -1);
    } else {
      camera.up.set(0, 1, 0);
    }
    syncControls();
  }

  const onControlClick = (event) => {
    const viewBtn = event.target.closest(".view-toggle-btn");
    if (viewBtn) {
      setMode(viewBtn.dataset.action === "view-2d" ? "2d" : "3d");
      return;
    }
    const btn = event.target.closest(".chart-control-btn");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "aspects") {
      state.showAspects = !state.showAspects;
      aspectGroup.visible = state.showAspects;
    } else if (action === "orbits") {
      state.showOrbits = !state.showOrbits;
      orbits.visible = state.showOrbits;
    } else if (action === "rotate") {
      if (state.mode === "2d") return;
      state.autoRotate = !state.autoRotate;
    } else if (action === "reset") {
      root.rotation.set(VIEW_3D.rotX, 0, 0);
      cameraTarget.rotX = VIEW_3D.rotX;
      setMode("3d");
      state.autoRotate = true;
    }
    syncControls();
  };

  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointermove", onPointerMove);
  stage.addEventListener("pointerup", onPointerUp);
  stage.addEventListener("pointerleave", onLeave);
  stage.addEventListener("wheel", onWheel, { passive: false });
  controls.addEventListener("click", onControlClick);
  planetList?.addEventListener("click", (event) => {
    const row = event.target.closest(".cpl-row[data-planet-key]");
    if (!row) return;
    selectPlanetByKey(row.dataset.planetKey, "chart-list");
  });
  window.addEventListener("resize", onResize);

  syncControls();
  onResize();

  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    if (state.autoRotate && state.mode === "3d") root.rotation.y += 0.0018;

    const is2d = state.mode === "2d";
    const targetX = is2d ? 0 : parallaxX * 0.6;
    const targetY = cameraTarget.camY - (is2d ? 0 : parallaxY * 0.35);
    camera.position.x += (targetX - camera.position.x) * 0.06;
    camera.position.y += (targetY - camera.position.y) * 0.06;
    camera.position.z += (cameraTarget.camZ - camera.position.z) * 0.06;
    if (!is2d) {
      root.rotation.x += (cameraTarget.rotX - root.rotation.x) * 0.06;
    }
    camera.lookAt(0, 0, 0);

    planetObjects.forEach((p) => p.update(t, state.mode));
    if (pointerActive) updateHover();

    if (nebula.material.uniforms) {
      nebula.material.uniforms.uTime.value = t;
    }
    stars.forEach((layer, idx) => {
      layer.rotation.y = t * (idx === 0 ? 0.004 : 0.008);
    });

    filmPass.uniforms.time.value = t;
    composer.render();
    updatePlanetLabels(planetLabelEls, planetObjects, camera, stage);
    updateAnchorLabels(signLabelEls, signAnchors, camera, stage, root);
    updateAnchorLabel(lagnaEl, lagnaData.anchor, camera, stage, root);
  });

  container.__chart3dCleanup = () => {
    renderer.setAnimationLoop(null);
    stage.removeEventListener("pointerdown", onPointerDown);
    stage.removeEventListener("pointermove", onPointerMove);
    stage.removeEventListener("pointerup", onPointerUp);
    stage.removeEventListener("pointerleave", onLeave);
    stage.removeEventListener("wheel", onWheel);
    controls.removeEventListener("click", onControlClick);
    window.removeEventListener("resize", onResize);
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach((m) => disposeMaterial(m));
        else disposeMaterial(object.material);
      }
    });
    composer.dispose?.();
    renderer.dispose();
  };
}

function disposeMaterial(material) {
  if (!material) return;
  for (const key of ["map", "alphaMap", "emissiveMap", "normalMap"]) {
    if (material[key]) material[key].dispose?.();
  }
  material.dispose();
}

function cleanup(container) {
  if (typeof container.__chart3dCleanup === "function") {
    container.__chart3dCleanup();
    container.__chart3dCleanup = null;
  }
}

function addLights(scene) {
  scene.add(new THREE.AmbientLight(0x6678a8, 0.55));
  const key = new THREE.PointLight(0xffd07a, 1.6, 80, 1.6);
  key.position.set(0, 9, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0x6c8cff, 0.9, 60, 1.8);
  rim.position.set(-9, 4, -8);
  scene.add(rim);
  const accent = new THREE.PointLight(0xb796ff, 0.7, 50, 1.8);
  accent.position.set(7, 2, 5);
  scene.add(accent);
}

function addNebula(scene) {
  const geometry = new THREE.SphereGeometry(60, 32, 32);
  const material = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    side: THREE.BackSide,
    depthWrite: false,
    transparent: true,
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vPos;

      float hash(vec3 p) {
        p = fract(p * 0.3183099 + .1);
        p *= 17.0;
        return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
      }
      float noise(vec3 p) {
        vec3 i = floor(p);
        vec3 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float n = mix(mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
                          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
                          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        return n;
      }
      float fbm(vec3 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 5; i++) {
          v += a * noise(p);
          p *= 2.05;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec3 dir = normalize(vPos);
        float t = uTime * 0.015;
        float n = fbm(dir * 2.2 + vec3(t, t * 0.6, -t * 0.4));
        float n2 = fbm(dir * 5.0 - vec3(t * 0.5, -t, t * 0.7));

        vec3 deepSpace = vec3(0.012, 0.014, 0.038);
        vec3 indigo = vec3(0.10, 0.07, 0.32);
        vec3 magenta = vec3(0.42, 0.14, 0.55);
        vec3 gold = vec3(0.85, 0.62, 0.22);
        vec3 teal = vec3(0.12, 0.42, 0.46);

        vec3 col = mix(deepSpace, indigo, smoothstep(0.35, 0.75, n) * 0.6);
        col = mix(col, magenta * 0.4, smoothstep(0.55, 0.92, n) * 0.3);
        col = mix(col, gold * 0.28, smoothstep(0.65, 0.95, n * n2) * 0.35);
        col = mix(col, teal * 0.2, smoothstep(0.7, 0.95, 1.0 - n2) * 0.22);
        col *= 0.7;

        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  return mesh;
}

function addStarLayers(scene) {
  const layers = [];
  const configs = [
    { count: 1400, radius: 38, size: 0.035, color: 0xffffff, opacity: 0.75 },
    { count: 600, radius: 30, size: 0.055, color: 0xffe8c0, opacity: 0.55 },
    { count: 180, radius: 26, size: 0.10, color: 0xb796ff, opacity: 0.4 },
  ];
  for (const cfg of configs) {
    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(cfg.count * 3);
    for (let i = 0; i < cfg.count; i += 1) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const r = cfg.radius * (0.7 + Math.random() * 0.3);
      vertices[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      vertices[i * 3 + 1] = r * Math.cos(phi);
      vertices[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    const material = new THREE.PointsMaterial({
      color: cfg.color,
      size: cfg.size,
      transparent: true,
      opacity: cfg.opacity,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      map: makeStarTexture(),
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    layers.push(points);
  }
  return layers;
}

function makeStarTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.25, "rgba(255,255,255,0.6)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addOrbitRings(root) {
  const group = new THREE.Group();
  const radii = [2.5, 3.1, 3.7, 4.3];
  radii.forEach((radius, idx) => {
    const geometry = new THREE.RingGeometry(radius - 0.005, radius + 0.005, 256);
    const material = new THREE.MeshBasicMaterial({
      color: idx % 2 ? 0x6c8cff : 0xd8b764,
      transparent: true,
      opacity: idx % 2 ? 0.12 : 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
  });

  const outerGeom = new THREE.RingGeometry(4.92, 4.97, 256);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0xd8b764,
    transparent: true,
    opacity: 0.32,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const outerRing = new THREE.Mesh(outerGeom, outerMat);
  outerRing.rotation.x = Math.PI / 2;
  group.add(outerRing);

  root.add(group);
  return group;
}

function addZodiacBand(root) {
  const bandGeom = new THREE.RingGeometry(4.95, 5.55, 192, 1);
  const bandMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {},
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      void main() {
        float a = atan(vUv.y - 0.5, vUv.x - 0.5);
        float wave = 0.5 + 0.5 * sin(a * 12.0);
        float r = distance(vUv, vec2(0.5));
        float edge = smoothstep(0.5, 0.46, r) * smoothstep(0.34, 0.4, r);
        vec3 gold = vec3(0.85, 0.72, 0.39);
        vec3 indigo = vec3(0.35, 0.30, 0.62);
        vec3 col = mix(indigo, gold, wave);
        gl_FragColor = vec4(col, edge * 0.55);
      }
    `,
  });
  const band = new THREE.Mesh(bandGeom, bandMat);
  band.rotation.x = Math.PI / 2;
  band.position.y = -0.001;
  root.add(band);
}

function addHouseLines(root) {
  const innerR = 1.0;
  const outerR = 4.95;
  for (let i = 0; i < 12; i += 1) {
    const angle = THREE.MathUtils.degToRad(i * 30);
    const points = [
      new THREE.Vector3(Math.cos(angle) * innerR, 0.003, Math.sin(angle) * innerR),
      new THREE.Vector3(Math.cos(angle) * outerR, 0.003, Math.sin(angle) * outerR),
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xd8b764,
      transparent: true,
      opacity: i % 3 === 0 ? 0.32 : 0.16,
      blending: THREE.AdditiveBlending,
    });
    root.add(new THREE.Line(geometry, material));
  }
}

function addSignLabels(root) {
  return SIGN_NAMES.map((sign, index) => {
    const angle = THREE.MathUtils.degToRad(index * 30 + 15 - 90);
    const radius = 5.30;
    const anchor = new THREE.Object3D();
    anchor.position.set(Math.cos(angle) * radius, 0.05, Math.sin(angle) * radius);
    root.add(anchor);
    return { anchor, glyph: SIGN_GLYPHS[index], name: sign.slice(0, 3).toUpperCase() };
  });
}

function addLagnaCore(root, chart) {
  const group = new THREE.Group();

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 64, 32),
    new THREE.MeshStandardMaterial({
      color: 0xffd887,
      emissive: 0xb47a1a,
      emissiveIntensity: 0.28,
      roughness: 0.48,
      metalness: 0.4,
    })
  );
  core.position.y = 0.18;
  group.add(core);

  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 32, 16),
    new THREE.MeshBasicMaterial({
      color: 0xffd887,
      transparent: true,
      opacity: 0.06,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  halo.position.y = 0.18;
  group.add(halo);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 0.76, 80),
    new THREE.MeshBasicMaterial({
      color: 0xd8b764,
      transparent: true,
      opacity: 0.32,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.18;
  group.add(ring);

  const lagnaAnchor = new THREE.Object3D();
  lagnaAnchor.position.set(0, 1.15, 0);
  group.add(lagnaAnchor);

  root.add(group);
  return { anchor: lagnaAnchor, text: `Lagna · ${chart.lagna?.sign || ""}` };
}

function addPlanets(root, chart) {
  const planetEntries = Object.entries(chart.planets || {});
  return planetEntries.map(([key, planet], index) => {
    const meta = PLANETS[key] || { glyph: "•", color: 0xd8b764, emissive: 0x5e5040, size: 0.32, label: planet.name || key };
    const angle = THREE.MathUtils.degToRad(Number(planet.longitude_sidereal || 0) - 90);
    const ring = 2.5 + (index % 4) * 0.5;
    const yLevel = 0.30;

    const group = new THREE.Group();
    group.position.set(Math.cos(angle) * ring, yLevel, Math.sin(angle) * ring);
    group.userData.baseY = yLevel;
    group.userData.planet = planet;
    group.userData.key = key;
    group.userData.angle = angle;

    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(meta.size, 64, 32),
      new THREE.MeshStandardMaterial({
        color: meta.color,
        emissive: meta.emissive,
        emissiveIntensity: 0.18,
        roughness: 0.55,
        metalness: 0.25,
      })
    );
    sphere.userData.planet = planet;
    group.add(sphere);

    const ringMesh = new THREE.Mesh(
      new THREE.RingGeometry(meta.size * 1.32, meta.size * 1.40, 64),
      new THREE.MeshBasicMaterial({
        color: meta.color,
        transparent: true,
        opacity: 0.20,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    ringMesh.rotation.x = Math.PI / 2;
    group.add(ringMesh);

    const glow = createGlowSprite(meta.color, meta.size * 2.8);
    group.add(glow);

    if (planet.retrograde) {
      const rx = makeLabel("Rx", "#ff6a4a", 48, 28, 16);
      rx.position.set(meta.size * 1.1, meta.size * 0.9, 0);
      rx.scale.setScalar(0.28);
      group.add(rx);
    }

    const hitMesh = new THREE.Mesh(
      new THREE.SphereGeometry(meta.size * 2.2, 12, 8),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitMesh.userData.planet = planet;
    hitMesh.userData.key = key;
    group.add(hitMesh);

    root.add(group);

    const _worldPos = new THREE.Vector3();

    return {
      group,
      sphere,
      glow,
      ringMesh,
      hitMesh,
      meta,
      planet,
      userData: group.userData,
      getWorldPos() {
        group.getWorldPosition(_worldPos);
        return _worldPos;
      },
      update(t, mode) {
        const wobble = mode === "2d" ? 0 : Math.sin(t * 1.3 + index * 0.8) * 0.06;
        group.position.y = group.userData.baseY + wobble;
        sphere.rotation.y += 0.012;
        ringMesh.rotation.z += 0.003;
      },
      setHover(active) {
        sphere.material.emissiveIntensity = active ? 0.42 : 0.18;
        glow.scale.setScalar(meta.size * (active ? 3.8 : 2.8));
      },
    };
  });
}

function buildAspectLines(root, chart, planetObjects) {
  const group = new THREE.Group();
  const houseMap = new Map();
  planetObjects.forEach((p) => {
    const house = Number(p.userData.planet?.house);
    if (Number.isFinite(house)) {
      if (!houseMap.has(house)) houseMap.set(house, []);
      houseMap.get(house).push(p);
    }
  });

  planetObjects.forEach((source) => {
    const key = source.userData.key;
    const sourceHouse = Number(source.userData.planet?.house);
    if (!Number.isFinite(sourceHouse)) return;
    const aspects = JYOTISH_ASPECTS[key] || [7];

    aspects.forEach((offset) => {
      const targetHouse = ((sourceHouse - 1 + (offset - 1)) % 12) + 1;
      const targets = houseMap.get(targetHouse) || [];
      targets.forEach((target) => {
        if (target === source) return;
        const color = ASPECT_COLORS[offset] || 0xd8b764;
        const line = makeAspectLine(source.group.position, target.group.position, color, offset === 7 ? 0.32 : 0.20);
        group.add(line);
      });
    });
  });

  root.add(group);
  return group;
}

function makeAspectLine(a, b, color, opacity) {
  const mid = new THREE.Vector3((a.x + b.x) * 0.5, Math.min(a.y, b.y) + 0.15, (a.z + b.z) * 0.5);
  const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
  const points = curve.getPoints(40);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  return new THREE.Line(geometry, material);
}

function buildPlanetLabels(container, planetObjects) {
  container.innerHTML = "";
  return planetObjects.map((p) => {
    const colorHex = `#${p.meta.color.toString(16).padStart(6, "0")}`;
    const el = document.createElement("div");
    el.className = "planet-label-html";
    el.innerHTML = `<span class="plh-glyph">${escapeHtml(p.meta.glyph)}</span><span class="plh-name">${escapeHtml(p.meta.label)}${p.planet.retrograde ? '<em>Rx</em>' : ''}</span>`;
    el.style.setProperty("--pc", colorHex);
    container.appendChild(el);
    return el;
  });
}

const _proj = new THREE.Vector3();
function updatePlanetLabels(els, planetObjects, camera, stage) {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const safeRight = w - LEGEND_SAFE_ZONE_RIGHT;
  planetObjects.forEach((p, i) => {
    const el = els[i];
    if (!el) return;
    const world = p.getWorldPos();
    _proj.copy(world).project(camera);
    const x = (_proj.x * 0.5 + 0.5) * w;
    const y = (-_proj.y * 0.5 + 0.5) * h;
    const behind = _proj.z > 1;
    if (behind || x < -60 || x > safeRight || y < -60 || y > h + 60) {
      el.style.display = "none";
    } else {
      el.style.display = "flex";
      el.style.transform = `translate(${x}px,${y}px)`;
    }
  });
}

function buildSignLabels(container, signAnchors) {
  return signAnchors.map(({ glyph, name }) => {
    const el = document.createElement("div");
    el.className = "sign-label-html";
    el.innerHTML = `<span class="slh-glyph">${escapeHtml(glyph)}</span><span class="slh-name">${escapeHtml(name)}</span>`;
    container.appendChild(el);
    return el;
  });
}

function buildLagnaLabel(container, lagnaData) {
  const el = document.createElement("div");
  el.className = "lagna-label-html";
  el.textContent = lagnaData.text;
  container.appendChild(el);
  return el;
}

const _anchorWorld = new THREE.Vector3();
function updateAnchorLabels(els, anchors, camera, stage, root) {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const safeRight = w - LEGEND_SAFE_ZONE_RIGHT;
  anchors.forEach(({ anchor }, i) => {
    const el = els[i];
    if (!el) return;
    anchor.getWorldPosition(_anchorWorld);
    _proj.copy(_anchorWorld).project(camera);
    const x = (_proj.x * 0.5 + 0.5) * w;
    const y = (-_proj.y * 0.5 + 0.5) * h;
    const behind = _proj.z > 1;
    if (behind || x < -80 || x > safeRight || y < -80 || y > h + 80) {
      el.style.display = "none";
    } else {
      el.style.display = "";
      el.style.transform = `translate(-50%,-50%) translate(${x}px,${y}px)`;
    }
  });
}

function updateAnchorLabel(el, anchor, camera, stage) {
  if (!el || !anchor) return;
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  const safeRight = w - LEGEND_SAFE_ZONE_RIGHT;
  anchor.getWorldPosition(_anchorWorld);
  _proj.copy(_anchorWorld).project(camera);
  const x = (_proj.x * 0.5 + 0.5) * w;
  const y = (-_proj.y * 0.5 + 0.5) * h;
  const behind = _proj.z > 1;
  if (behind || x < -80 || x > safeRight || y < -80 || y > h + 80) {
    el.style.display = "none";
  } else {
    el.style.display = "";
    el.style.transform = `translate(-50%,-100%) translate(${x}px,${y}px)`;
  }
}

function renderLegend(container, chart) {
  if (!container) return;
  container.innerHTML = Object.entries(chart.planets || {})
    .map(([key, planet]) => {
      const meta = PLANETS[key] || { glyph: "•", color: 0xd8b764, label: planet.name || key };
      const color = `#${meta.color.toString(16).padStart(6, "0")}`;
      return `
        <div class="legend-row">
          <i style="--legend-color:${escapeHtml(color)}">${escapeHtml(meta.glyph)}</i>
          <span>${escapeHtml(meta.label)}</span>
        </div>
      `;
    })
    .join("");
}

function makeLabel(text, color, width = 120, height = 36, size = 22) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const canvas = document.createElement("canvas");
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  ctx.font = `700 ${size}px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0,0,0,.95)";
  ctx.shadowBlur = 10;
  ctx.fillText(text, width / 2, height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(width / 78, height / 78, 1);
  return sprite;
}

function createGlowSprite(color, size) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const hex = `#${color.toString(16).padStart(6, "0")}`;
  const gradient = ctx.createRadialGradient(64, 64, 4, 64, 64, 60);
  gradient.addColorStop(0, `${hex}ff`);
  gradient.addColorStop(0.3, `${hex}aa`);
  gradient.addColorStop(0.55, `${hex}44`);
  gradient.addColorStop(1, `${hex}00`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  sprite.scale.set(size, size, 1);
  return sprite;
}

function updatePointer(event, element, pointer) {
  const rect = element.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function buildPlanetListHTML(chart) {
  return Object.entries(chart.planets || {}).map(([key, planet]) => {
    const meta = PLANETS[key] || { glyph: "•", color: 0xd8b764, label: planet.name || key };
    const color = `#${meta.color.toString(16).padStart(6, "0")}`;
    const sign = planet.sign ? planet.sign.slice(0, 3).toUpperCase() : "";
    const rx = planet.retrograde ? `<em>Rx</em>` : "";
    return `<button type="button" class="cpl-row" data-planet-key="${escapeHtml(key)}"><span class="cpl-glyph" style="color:${color}">${escapeHtml(meta.glyph)}</span><span class="cpl-name">${escapeHtml(meta.label)}${rx}</span><span class="cpl-sign">${sign}</span></button>`;
  }).join("");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
