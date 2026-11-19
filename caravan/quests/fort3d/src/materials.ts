import * as THREE from "three";

// Procedural PBR-ish textures (colour + normal maps generated from a height canvas) so the page stays a single file.
let rnd = 7; const rand = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; };
function canvas(w: number, h: number, paint: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement { const cv = document.createElement("canvas"); cv.width = w; cv.height = h; paint(cv.getContext("2d")!); return cv; }
function tex(cv: HTMLCanvasElement, repeat = 1, srgb = true): THREE.CanvasTexture { const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
// Sobel normal map from a greyscale height canvas
function normalFrom(hc: HTMLCanvasElement, strength = 2): THREE.CanvasTexture {
  const w = hc.width, h = hc.height; const src = hc.getContext("2d")!.getImageData(0, 0, w, h).data; const out = canvas(w, h, () => { }); const g = out.getContext("2d")!; const img = g.createImageData(w, h); const d = img.data;
  const H = (x: number, y: number) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * strength, dy = (H(x, y + 1) - H(x, y - 1)) * strength; const l = Math.hypot(dx, dy, 1); const i = (y * w + x) * 4; d[i] = (-dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255; }
  g.putImageData(img, 0, 0); return tex(out, 1, false);
}
interface Pair { map: THREE.CanvasTexture; normalMap: THREE.CanvasTexture }
function pair(color: HTMLCanvasElement, height: HTMLCanvasElement, repeat: number, strength: number): Pair { const map = tex(color, repeat), normalMap = normalFrom(height, strength); normalMap.repeat.set(repeat, repeat); return { map, normalMap }; }

// ashlar stone: rows of blocks with mortar joints, per-block tone, chips and speckle
export function stonePair(): Pair {
  const W = 512, rows: number[][] = []; const color = canvas(W, W, c => {
    c.fillStyle = "#6e6150"; c.fillRect(0, 0, W, W); let y = 0;
    while (y < W) { const rh = 40 + Math.floor(rand() * 24); let x = (rand() * 60) | 0; const row: number[] = [y, rh]; x = -x;
      while (x < W) { const bw = 70 + Math.floor(rand() * 70); const g = 150 + rand() * 50; const warm = rand() * 18; c.fillStyle = `rgb(${g + warm + 10},${g + 2},${g - 30})`; c.fillRect(x + 3, y + 3, bw - 6, rh - 6); c.fillStyle = `rgba(255,245,220,0.18)`; c.fillRect(x + 3, y + 3, bw - 6, 3); c.fillStyle = "rgba(40,30,15,0.28)"; c.fillRect(x + 3, y + rh - 6, bw - 6, 3); row.push(x, bw); x += bw; }
      rows.push(row); y += rh; }
    for (let i = 0; i < 6000; i++) { c.fillStyle = `rgba(50,40,25,${rand() * 0.16})`; c.fillRect(rand() * W, rand() * W, 2, 2); }
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(255,240,210,${rand() * 0.12})`; c.fillRect(rand() * W, rand() * W, 2, 1); }
  });
  const height = canvas(W, W, c => { c.fillStyle = "#303030"; c.fillRect(0, 0, W, W); for (const row of rows) { const [y, rh] = row; for (let k = 2; k < row.length; k += 2) { const x = row[k], bw = row[k + 1]; const l = 150 + rand() * 60; c.fillStyle = `rgb(${l},${l},${l})`; c.fillRect(x + 3, y + 3, bw - 6, rh - 6); } } for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(0,0,0,${rand() * 0.25})`; c.fillRect(rand() * W, rand() * W, 3, 2); } });
  return pair(color, height, 1, 2.2);
}
// lime plaster: cream base, soft weathering blotches, hairline cracks, a dusty foot
export function plasterPair(): Pair {
  const W = 256; const color = canvas(W, W, c => { c.fillStyle = "#e8dab8"; c.fillRect(0, 0, W, W);
    for (let i = 0; i < 70; i++) { const g = c.createRadialGradient(rand() * W, rand() * W, 2, rand() * W, rand() * W, 30 + rand() * 50); g.addColorStop(0, `rgba(${150 + rand() * 60},${120 + rand() * 50},${80 + rand() * 40},${0.06 + rand() * 0.12})`); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, W, W); }
    for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(110,90,60,${rand() * 0.12})`; c.fillRect(rand() * W, rand() * W, 2, 2); }
    c.strokeStyle = "rgba(90,70,45,0.35)"; c.lineWidth = 1; for (let i = 0; i < 9; i++) { c.beginPath(); let x = rand() * W, y = rand() * W; c.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (rand() - .5) * 40; y += rand() * 30; c.lineTo(x, y); } c.stroke(); } });
  const height = canvas(W, W, c => { c.fillStyle = "#808080"; c.fillRect(0, 0, W, W); for (let i = 0; i < 3000; i++) { const l = 100 + rand() * 90; c.fillStyle = `rgba(${l},${l},${l},0.5)`; c.fillRect(rand() * W, rand() * W, 2 + rand() * 4, 2 + rand() * 4); } });
  return pair(color, height, 1, 0.9);
}
export function rockPair(): Pair {
  const W = 256; const color = canvas(W, W, c => { c.fillStyle = "#7a6a52"; c.fillRect(0, 0, W, W); for (let i = 0; i < 2600; i++) { const g = 85 + rand() * 75; c.fillStyle = `rgba(${g + 12},${g},${g - 22},${0.3 + rand() * 0.5})`; c.fillRect(rand() * W, rand() * W, 2 + rand() * 7, 2 + rand() * 4); } });
  const height = canvas(W, W, c => { c.fillStyle = "#707070"; c.fillRect(0, 0, W, W); for (let i = 0; i < 1400; i++) { const l = 60 + rand() * 140; c.fillStyle = `rgba(${l},${l},${l},0.7)`; c.fillRect(rand() * W, rand() * W, 3 + rand() * 9, 2 + rand() * 6); } });
  return pair(color, height, 1, 2.5);
}
export function woodPair(): Pair {
  const W = 256; const color = canvas(W, W, c => { for (let y = 0; y < W; y += 32) { const g = 95 + rand() * 30; c.fillStyle = `rgb(${g + 45},${g + 12},${g - 25})`; c.fillRect(0, y, W, 32); c.fillStyle = "rgba(40,25,10,0.55)"; c.fillRect(0, y, W, 2); for (let k = 0; k < 14; k++) { c.fillStyle = `rgba(60,40,20,${0.15 + rand() * 0.2})`; const yy = y + 4 + rand() * 26; c.fillRect(0, yy, W, 1); } if (rand() < 0.5) { c.fillStyle = "rgba(50,30,15,0.6)"; c.beginPath(); c.ellipse(rand() * W, y + 16, 5, 3, 0, 0, 6.3); c.fill(); } } });
  const height = canvas(W, W, c => { c.fillStyle = "#909090"; c.fillRect(0, 0, W, W); for (let y = 0; y < W; y += 32) { c.fillStyle = "#404040"; c.fillRect(0, y, W, 3); for (let k = 0; k < 10; k++) { c.fillStyle = "rgba(60,60,60,0.5)"; c.fillRect(0, y + 4 + rand() * 26, W, 1); } } });
  return pair(color, height, 1, 1.2);
}
export function sandPair(): Pair {
  const W = 256; const color = canvas(W, W, c => { c.fillStyle = "#d8c59a"; c.fillRect(0, 0, W, W); for (let i = 0; i < 5000; i++) { c.fillStyle = `rgba(${150 + rand() * 60},${125 + rand() * 50},${80 + rand() * 40},${rand() * 0.25})`; c.fillRect(rand() * W, rand() * W, 2, 2); } for (let i = 0; i < 24; i++) { c.strokeStyle = "rgba(120,95,60,0.18)"; c.lineWidth = 2; c.beginPath(); const y = rand() * W; c.moveTo(0, y); for (let x = 0; x <= W; x += 16) c.lineTo(x, y + Math.sin(x / 20 + i) * 4); c.stroke(); } });
  const height = canvas(W, W, c => { c.fillStyle = "#808080"; c.fillRect(0, 0, W, W); for (let i = 0; i < 3000; i++) { const l = 90 + rand() * 80; c.fillStyle = `rgba(${l},${l},${l},0.4)`; c.fillRect(rand() * W, rand() * W, 2, 2); } });
  return pair(color, height, 1, 0.5);
}
// Omani geometric rug: red field, black and cream diamonds and a zigzag border
export function rugTexture(): THREE.CanvasTexture {
  return tex(canvas(256, 384, c => { c.fillStyle = "#8c2f22"; c.fillRect(0, 0, 256, 384); c.fillStyle = "#1e1a16"; c.fillRect(12, 12, 232, 360); c.fillStyle = "#a8382a"; c.fillRect(22, 22, 212, 340);
    for (let y = 40; y < 360; y += 48) for (let x = 40; x < 240; x += 48) { c.fillStyle = (x + y) % 96 ? "#f1e3c2" : "#1e1a16"; c.beginPath(); c.moveTo(x, y - 16); c.lineTo(x + 16, y); c.lineTo(x, y + 16); c.lineTo(x - 16, y); c.fill(); c.fillStyle = "#8c2f22"; c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 7, y); c.lineTo(x, y + 7); c.lineTo(x - 7, y); c.fill(); }
    c.strokeStyle = "#f1e3c2"; c.lineWidth = 3; c.beginPath(); for (let x = 12; x <= 244; x += 16) c.lineTo(x, (x / 16) % 2 ? 16 : 24); c.stroke(); c.beginPath(); for (let x = 12; x <= 244; x += 16) c.lineTo(x, (x / 16) % 2 ? 368 : 360); c.stroke(); }), 1);
}
export function sailTexture(): THREE.CanvasTexture {
  return tex(canvas(128, 128, c => { c.fillStyle = "#f1e8d2"; c.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 16) { c.fillStyle = "rgba(120,90,50,.25)"; c.fillRect(0, y, 128, 1); } for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(100,80,50,${rand() * 0.12})`; c.fillRect(rand() * 128, rand() * 128, 2, 2); } }), 1);
}
export function bannerTexture(label: string, color: string): THREE.CanvasTexture {
  const t = tex(canvas(128, 64, c => { c.fillStyle = color; c.fillRect(0, 0, 128, 64); c.fillStyle = "#fff8e6"; c.font = "bold 44px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(label, 64, 34); }), 1);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}
export function cloudTexture(): THREE.CanvasTexture { const t = tex(canvas(128, 64, c => { for (let i = 0; i < 9; i++) { const g = c.createRadialGradient(20 + i * 11, 36 + Math.sin(i) * 8, 2, 20 + i * 11, 36 + Math.sin(i) * 8, 22); g.addColorStop(0, "rgba(255,255,255,0.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, 128, 64); } }), 1); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; }

export class Mats {
  private readonly st = stonePair(); private readonly pl = plasterPair(); private readonly rk = rockPair(); private readonly wd = woodPair(); private readonly sd = sandPair();
  readonly stone = new THREE.MeshStandardMaterial({ map: this.st.map, normalMap: this.st.normalMap, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.93, metalness: 0 });
  readonly plaster = new THREE.MeshStandardMaterial({ map: this.pl.map, normalMap: this.pl.normalMap, normalScale: new THREE.Vector2(0.5, 0.5), roughness: 0.96, color: 0xf4e8cc });
  readonly rock = new THREE.MeshStandardMaterial({ map: this.rk.map, normalMap: this.rk.normalMap, normalScale: new THREE.Vector2(1, 1), roughness: 1 });
  readonly wood = new THREE.MeshStandardMaterial({ map: this.wd.map, normalMap: this.wd.normalMap, normalScale: new THREE.Vector2(0.6, 0.6), roughness: 0.78 });
  readonly darkWood = new THREE.MeshStandardMaterial({ map: this.wd.map, normalMap: this.wd.normalMap, color: 0x6a4a32, roughness: 0.85 });
  readonly sand = new THREE.MeshStandardMaterial({ map: this.sd.map, normalMap: this.sd.normalMap, normalScale: new THREE.Vector2(0.4, 0.4), roughness: 1 });
  readonly rug = new THREE.MeshStandardMaterial({ map: rugTexture(), roughness: 0.95 });
  readonly sail = new THREE.MeshStandardMaterial({ map: sailTexture(), roughness: 0.9, side: THREE.DoubleSide });
  readonly iron = new THREE.MeshStandardMaterial({ color: 0x2b2a28, roughness: 0.45, metalness: 0.7 });
  readonly brass = new THREE.MeshStandardMaterial({ color: 0xc8a048, roughness: 0.35, metalness: 0.8 });
  readonly flag = new THREE.MeshStandardMaterial({ color: 0xb8322a, roughness: 0.8, side: THREE.DoubleSide });
  readonly green = new THREE.MeshStandardMaterial({ color: 0x4e7d3a, roughness: 0.9 });
  readonly ember = new THREE.MeshBasicMaterial({ color: 0xffb347 });
  readonly lantern = new THREE.MeshStandardMaterial({ color: 0xffd9a0, emissive: 0xffa040, emissiveIntensity: 1.6, roughness: 0.6 });
  readonly ball = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.6, metalness: 0.3 });
  readonly shield = new THREE.MeshBasicMaterial({ color: 0x7fd3ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
  readonly mountain = new THREE.MeshStandardMaterial({ color: 0x6f7f5a, roughness: 1, flatShading: true });
  readonly cloud = new THREE.SpriteMaterial({ map: cloudTexture(), transparent: true, depthWrite: false, opacity: 0.9 });
}

// Scale a BoxGeometry's UVs so each face tiles the texture every `metres` metres (box faces otherwise map 0..1).
export function boxUV(geo: THREE.BoxGeometry, w: number, h: number, d: number, metres = 2): THREE.BoxGeometry {
  const uv = geo.attributes.uv as THREE.BufferAttribute; const faces = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]; // +x -x +y -y +z -z
  for (let f = 0; f < 6; f++) { const [fw, fh] = faces[f]; for (let i = f * 4; i < f * 4 + 4; i++) uv.setXY(i, uv.getX(i) * fw / metres, uv.getY(i) * fh / metres); }
  uv.needsUpdate = true; return geo;
}
