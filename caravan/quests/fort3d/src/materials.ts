import * as THREE from "three";

// Procedural textures so the page stays a single file with no asset downloads.
function canvasTexture(w: number, h: number, paint: (c: CanvasRenderingContext2D) => void, repeat = 1): THREE.CanvasTexture {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h; const c = cv.getContext("2d")!; paint(c);
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
let rnd = 7; const rand = () => { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; };

export function stoneTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, c => {
    c.fillStyle = "#c9b48c"; c.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 64) { const ox = (y / 32) % 2 ? 32 : 0; const g = 185 + rand() * 40; c.fillStyle = `rgb(${g + 20},${g},${g - 35})`; c.fillRect(x + ox + 2, y + 2, 60, 28); c.fillStyle = "rgba(90,70,40,.35)"; c.fillRect(x + ox, y, 64, 2); c.fillRect(x + ox, y, 2, 32); }
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(60,45,25,${rand() * 0.18})`; c.fillRect(rand() * 256, rand() * 256, 2, 2); }
  }, 3);
}
export function plasterTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 128, c => { c.fillStyle = "#e7d8b4"; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(120,95,60,${rand() * 0.14})`; c.fillRect(rand() * 128, rand() * 128, 2, 2); } }, 4);
}
export function rockTexture(): THREE.CanvasTexture {
  return canvasTexture(256, 256, c => { c.fillStyle = "#7f6d55"; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 2600; i++) { const g = 90 + rand() * 70; c.fillStyle = `rgba(${g + 10},${g},${g - 20},${0.3 + rand() * 0.5})`; c.fillRect(rand() * 256, rand() * 256, 2 + rand() * 6, 2 + rand() * 3); } }, 6);
}
export function woodTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 128, c => { for (let y = 0; y < 128; y += 4) { const g = 70 + rand() * 30; c.fillStyle = `rgb(${g + 40},${g + 10},${g - 20})`; c.fillRect(0, y, 128, 4); } }, 2);
}
export function sailTexture(): THREE.CanvasTexture {
  return canvasTexture(128, 128, c => { c.fillStyle = "#f1e8d2"; c.fillRect(0, 0, 128, 128); for (let y = 0; y < 128; y += 16) { c.fillStyle = "rgba(120,90,50,.25)"; c.fillRect(0, y, 128, 1); } for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(100,80,50,${rand() * 0.12})`; c.fillRect(rand() * 128, rand() * 128, 2, 2); } }, 1);
}
export function bannerTexture(label: string, color: string): THREE.CanvasTexture {
  const t = canvasTexture(128, 64, c => { c.fillStyle = color; c.fillRect(0, 0, 128, 64); c.fillStyle = "#fff8e6"; c.font = "bold 44px sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(label, 64, 34); });
  t.repeat.set(1, 1); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
}

export class Mats {
  readonly stone = new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: 0.92, metalness: 0 });
  readonly plaster = new THREE.MeshStandardMaterial({ map: plasterTexture(), roughness: 0.95, color: 0xf0e4c6 });
  readonly rock = new THREE.MeshStandardMaterial({ map: rockTexture(), roughness: 1 });
  readonly wood = new THREE.MeshStandardMaterial({ map: woodTexture(), roughness: 0.8 });
  readonly darkWood = new THREE.MeshStandardMaterial({ color: 0x4a3222, roughness: 0.85 });
  readonly sail = new THREE.MeshStandardMaterial({ map: sailTexture(), roughness: 0.9, side: THREE.DoubleSide });
  readonly iron = new THREE.MeshStandardMaterial({ color: 0x2b2a28, roughness: 0.45, metalness: 0.7 });
  readonly brass = new THREE.MeshStandardMaterial({ color: 0xc8a048, roughness: 0.35, metalness: 0.8 });
  readonly flag = new THREE.MeshStandardMaterial({ color: 0xb8322a, roughness: 0.8, side: THREE.DoubleSide });
  readonly green = new THREE.MeshStandardMaterial({ color: 0x4e7d3a, roughness: 0.9 });
  readonly sand = new THREE.MeshStandardMaterial({ color: 0xd9c89a, roughness: 1 });
  readonly ember = new THREE.MeshBasicMaterial({ color: 0xffb347 });
  readonly ball = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.6, metalness: 0.3 });
  readonly shield = new THREE.MeshBasicMaterial({ color: 0x7fd3ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
}
