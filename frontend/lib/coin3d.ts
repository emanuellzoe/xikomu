import * as THREE from "three";

// 3D HEAD/TAIL coin used in two places:
//   - landing hero: decorative — auto-spins, drag to orbit, click for a random flip;
//   - in-game (CeloFlip): controlled — tumbles while a tx is pending, then lands on
//     the real on-chain result and rests there showing the last side.
//
// Procedural face + reeded-edge textures; renderer is transparent (alpha) so the
// coin floats on a light background. Colors match the in-app orange (#FF5E00).
//
// initCoin3D(canvas, opts) returns a handle: drive it with setSpinning / land /
// setFace, and call dispose() on unmount to free the GL context + GPU resources.

const C = {
  orange: "#FF5E00",
  orangeDark: "#CC4B00",
  orangeText: "#3a1f06",
  gray: "#C4BFB6",
  grayDark: "#948F86",
  grayText: "#33302B",
  edge: "#E6B455",
};

export interface Coin3DOptions {
  /** Continuous idle spin around Y when not flipping (landing). Default true. */
  autoSpin?: boolean;
  /** Drag-to-orbit + click-to-flip listeners (landing). Default true. */
  interactive?: boolean;
  /** Initial resting face: true = HEAD, false = TAIL. Default true. */
  face?: boolean;
}

export interface Coin3DHandle {
  /** Tumble continuously while a result is pending. */
  setSpinning(on: boolean): void;
  /** Decelerate and land on a specific side (true = HEAD). */
  land(heads: boolean): void;
  /** Snap to a side with no animation. */
  setFace(heads: boolean): void;
  dispose(): void;
}

// rotation.x convention: HEAD faces camera at multiples of 2π, TAIL at π + 2π·k.
const faceMod = (heads: boolean) => (heads ? 0 : Math.PI);

/** Canvas-drawn coin face (radial-shaded base, rim rings, dot ring, embossed label). */
function faceTexture(label: string, bg: string, bgEdge: string, fg: string): THREE.CanvasTexture {
  const s = 1024;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const x = cv.getContext("2d")!;
  const r = s / 2;

  const g = x.createRadialGradient(r * 0.78, r * 0.72, r * 0.1, r, r, r);
  g.addColorStop(0, bg);
  g.addColorStop(1, bgEdge);
  x.fillStyle = g;
  x.beginPath();
  x.arc(r, r, r, 0, Math.PI * 2);
  x.fill();

  x.strokeStyle = "rgba(0,0,0,.16)";
  x.lineWidth = s * 0.012;
  x.beginPath();
  x.arc(r, r, r * 0.86, 0, Math.PI * 2);
  x.stroke();
  x.strokeStyle = "rgba(255,255,255,.18)";
  x.lineWidth = s * 0.006;
  x.beginPath();
  x.arc(r, r, r * 0.835, 0, Math.PI * 2);
  x.stroke();

  const dots = 60;
  for (let i = 0; i < dots; i++) {
    const a = (i / dots) * Math.PI * 2;
    const dx = r + Math.cos(a) * r * 0.78;
    const dy = r + Math.sin(a) * r * 0.78;
    x.fillStyle = "rgba(0,0,0,.18)";
    x.beginPath();
    x.arc(dx, dy, s * 0.006, 0, Math.PI * 2);
    x.fill();
  }

  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `800 ${s * 0.26}px ui-sans-serif, "Segoe UI", Arial, sans-serif`;
  x.save();
  x.translate(r, r);
  x.fillStyle = "rgba(0,0,0,.30)";
  x.fillText(label, 0, s * 0.012);
  x.fillStyle = "rgba(255,255,255,.30)";
  x.fillText(label, 0, -s * 0.01);
  x.fillStyle = fg;
  x.fillText(label, 0, 0);
  x.restore();

  const tex = new THREE.CanvasTexture(cv);
  tex.anisotropy = 8;
  return tex;
}

/** Reeded (milled) coin edge: vertical gold ridges tiled around the cylinder. */
function edgeTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 64;
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const x = cv.getContext("2d")!;
  for (let i = 0; i < w; i++) {
    const v = (Math.sin((i / w) * Math.PI * 2 * 160) + 1) / 2; // 160 ridges
    const shade = 150 + v * 95;
    x.fillStyle = `rgb(${shade},${(shade * 0.82) | 0},${(shade * 0.5) | 0})`;
    x.fillRect(i, 0, 1, h);
  }
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function initCoin3D(canvas: HTMLCanvasElement, opts: Coin3DOptions = {}): Coin3DHandle {
  const autoSpinDefault = opts.autoSpin ?? true;
  const interactive = opts.interactive ?? true;

  const scene = new THREE.Scene();

  const CAM_Z = 8;
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 0.6, CAM_Z);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(4, 6, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9a8, 0.6);
  rim.position.set(-5, 2, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x9fb6ff, 0.35);
  fill.position.set(-3, -4, 5);
  scene.add(fill);

  // Coin
  const R = 2;
  const TH = 0.34;
  const coin = new THREE.Group();
  coin.rotation.x = faceMod(opts.face ?? true);

  const edgeMap = edgeTexture();
  edgeMap.repeat.set(40, 1);
  const edgeMat = new THREE.MeshStandardMaterial({
    map: edgeMap,
    color: 0xffffff,
    metalness: 0.85,
    roughness: 0.42,
  });
  const bodyGeo = new THREE.CylinderGeometry(R, R, TH, 160, 1, true);
  const body = new THREE.Mesh(bodyGeo, edgeMat);
  body.rotation.x = Math.PI / 2; // coin axis -> Z (faces toward camera)
  coin.add(body);

  const headTex = faceTexture("HEAD", C.orange, C.orangeDark, C.orangeText);
  const headMat = new THREE.MeshStandardMaterial({ map: headTex, metalness: 0.25, roughness: 0.55 });
  const faceGeo = new THREE.CircleGeometry(R * 0.995, 160);
  const head = new THREE.Mesh(faceGeo, headMat);
  head.position.z = TH / 2 + 0.001;
  coin.add(head);

  const tailTex = faceTexture("TAIL", C.gray, C.grayDark, C.grayText);
  const tailMat = new THREE.MeshStandardMaterial({ map: tailTex, metalness: 0.25, roughness: 0.55 });
  const tail = new THREE.Mesh(faceGeo, tailMat);
  tail.position.z = -TH / 2 - 0.001;
  tail.rotation.y = Math.PI;
  coin.add(tail);

  scene.add(coin);

  // --- state ---
  let autoSpin = autoSpinDefault;
  let tumbling = false; // fast continuous flip while a result is pending
  let dragging = false;
  let moved = false;
  let px = 0;
  let py = 0;
  let velX = 0;
  let velY = 0;

  let flipping = false;
  let flipStart = 0;
  let flipFrom = 0;
  let flipTo = 0;
  let flipDur = 0;
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  // Build a target rotation.x that lands on `heads`, a few turns past `from`.
  function targetFor(from: number, heads: boolean): number {
    const mod = faceMod(heads);
    const baseTurns = 6 + Math.floor(Math.random() * 4);
    let t = Math.ceil(from / Math.PI) * Math.PI;
    while (((t - mod) % (Math.PI * 2)) !== 0 || t < from + baseTurns * Math.PI) {
      t += Math.PI;
    }
    return t;
  }
  function startFlip(heads: boolean) {
    autoSpin = false;
    tumbling = false;
    flipFrom = coin.rotation.x;
    flipTo = targetFor(flipFrom, heads);
    coin.rotation.y %= Math.PI * 2;
    flipStart = performance.now();
    flipDur = 1400 + (flipTo - flipFrom) * 30;
    flipping = true;
  }

  // --- interaction (landing only) ---
  function pt(e: MouseEvent | TouchEvent) {
    const t = "touches" in e ? e.touches[0] : e;
    return { x: t.clientX, y: t.clientY };
  }
  function down(e: MouseEvent | TouchEvent) {
    dragging = true;
    moved = false;
    autoSpin = false;
    const p = pt(e);
    px = p.x;
    py = p.y;
    velX = velY = 0;
  }
  function move(e: MouseEvent | TouchEvent) {
    if (!dragging) return;
    const p = pt(e);
    const dx = p.x - px;
    const dy = p.y - py;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    px = p.x;
    py = p.y;
    coin.rotation.y += dx * 0.01;
    coin.rotation.x += dy * 0.01;
    velX = dy * 0.01;
    velY = dx * 0.01;
    e.preventDefault();
  }
  function up() {
    dragging = false;
  }
  function onClick() {
    if (!moved && !flipping) startFlip(Math.random() < 0.5);
  }

  if (interactive) {
    canvas.addEventListener("mousedown", down);
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    canvas.addEventListener("touchstart", down, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", up);
    canvas.addEventListener("click", onClick);
  }

  // Size to the canvas's CSS box.
  function resize() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  let rafId = 0;
  function tick(now: number) {
    rafId = requestAnimationFrame(tick);
    if (flipping) {
      const t = Math.min(1, (now - flipStart) / flipDur);
      coin.rotation.x = flipFrom + (flipTo - flipFrom) * easeOutCubic(t);
      coin.position.y = Math.sin(t * Math.PI) * 1.0; // hop
      if (t >= 1) {
        flipping = false;
        coin.position.y = 0;
        coin.rotation.x = flipTo; // exact rest on the landed side
        autoSpin = autoSpinDefault; // landing resumes idle spin; game rests
      }
    } else if (tumbling) {
      coin.rotation.x += 0.32; // fast end-over-end tumble while pending
    } else {
      if (autoSpin) coin.rotation.y += 0.012;
      if (!dragging) {
        coin.rotation.y += velY;
        coin.rotation.x += velX;
        velX *= 0.94;
        velY *= 0.94;
      }
    }
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  rafId = requestAnimationFrame(tick);

  return {
    setSpinning(on: boolean) {
      tumbling = on;
      if (on) {
        autoSpin = false;
        flipping = false;
      }
    },
    land(heads: boolean) {
      startFlip(heads);
    },
    setFace(heads: boolean) {
      if (flipping || tumbling) return;
      coin.rotation.x = faceMod(heads);
      coin.position.y = 0;
    },
    dispose() {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      if (interactive) {
        canvas.removeEventListener("mousedown", down);
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
        canvas.removeEventListener("touchstart", down);
        canvas.removeEventListener("touchmove", move);
        canvas.removeEventListener("touchend", up);
        canvas.removeEventListener("click", onClick);
      }
      bodyGeo.dispose();
      faceGeo.dispose();
      edgeMat.dispose();
      headMat.dispose();
      tailMat.dispose();
      edgeMap.dispose();
      headTex.dispose();
      tailTex.dispose();
      renderer.dispose();
    },
  };
}
