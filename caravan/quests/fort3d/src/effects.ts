import * as THREE from "three";
import { Mats } from "./materials";

// Cannonballs, muzzle flash, explosions, splashes, smoke and the wall-hit flash. Cheap sprites and spheres; everything is
// pooled per effect type, so steady-state allocation is zero.
interface Ball { mesh: THREE.Mesh; from: THREE.Vector3; to: THREE.Vector3; t0: number; dur: number; done: boolean }
interface Puff { sprite: THREE.Sprite; v: THREE.Vector3; t0: number; life: number; size: number }
interface Burst { mesh: THREE.Mesh; t0: number; life: number; size: number }

function dotTexture(color: string, soft: number): THREE.CanvasTexture {
  const cv = document.createElement("canvas"); cv.width = cv.height = 64; const c = cv.getContext("2d")!; const g = c.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, color); g.addColorStop(soft, color.replace(/[\d.]+\)$/, "0.35)")); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Effects {
  private readonly balls: Ball[] = []; private readonly puffs: Puff[] = []; private readonly bursts: Burst[] = [];
  private readonly smokeMat: THREE.SpriteMaterial; private readonly fireMat: THREE.SpriteMaterial; private readonly sprayMat: THREE.SpriteMaterial;
  private readonly flash: THREE.Sprite;
  shake = 0; fired = 0; splashes = 0; wallHits = 0;
  constructor(private readonly scene: THREE.Scene, private readonly m: Mats) {
    this.smokeMat = new THREE.SpriteMaterial({ map: dotTexture("rgba(230,220,205,0.9)", 0.4), transparent: true, depthWrite: false, opacity: 0.8 });
    this.fireMat = new THREE.SpriteMaterial({ map: dotTexture("rgba(255,170,60,1)", 0.3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    this.sprayMat = new THREE.SpriteMaterial({ map: dotTexture("rgba(235,245,250,0.95)", 0.35), transparent: true, depthWrite: false });
    this.flash = new THREE.Sprite(this.fireMat.clone()); this.flash.scale.setScalar(0.01); this.flash.visible = false; scene.add(this.flash);
  }
  fire(from: THREE.Vector3, to: THREE.Vector3, delayMs: number, now: number): void {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), this.m.ball); mesh.visible = false; this.scene.add(mesh);
    this.balls.push({ mesh, from: from.clone(), to: to.clone(), t0: now + delayMs, dur: 560, done: false }); this.fired++;
  }
  private puff(mat: THREE.SpriteMaterial, pos: THREE.Vector3, v: THREE.Vector3, life: number, size: number, now: number): void {
    const s = new THREE.Sprite(mat); s.position.copy(pos); s.scale.setScalar(size); this.scene.add(s); this.puffs.push({ sprite: s, v, t0: now, life, size });
  }
  private burst(pos: THREE.Vector3, color: number, size: number, life: number, now: number): void {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 })); mesh.position.copy(pos); this.scene.add(mesh); this.bursts.push({ mesh, t0: now, life, size });
  }
  splash(pos: THREE.Vector3, now: number): void {
    this.splashes++; this.burst(pos.clone().setY(0.5), 0xffa347, 3.5, 420, now);
    for (let i = 0; i < 14; i++) { const a = Math.random() * 6.28, sp = 4 + Math.random() * 6; this.puff(this.sprayMat, pos.clone().setY(0.8), new THREE.Vector3(Math.cos(a) * sp * 0.5, 6 + Math.random() * 7, Math.sin(a) * sp * 0.5), 900 + Math.random() * 400, 1.6 + Math.random() * 1.6, now); }
    for (let i = 0; i < 6; i++) this.puff(this.smokeMat, pos.clone().add(new THREE.Vector3((Math.random() - .5) * 3, 2 + Math.random() * 2, (Math.random() - .5) * 3)), new THREE.Vector3((Math.random() - .5) * 2, 2.5 + Math.random() * 2, (Math.random() - .5) * 2), 1800 + Math.random() * 800, 3 + Math.random() * 3, now);
  }
  wallHit(now: number): void { this.wallHits++; this.shake = 1; const p = new THREE.Vector3((Math.random() - .5) * 20, 14, -15.6); this.burst(p, 0xff7a3d, 3, 320, now); for (let i = 0; i < 10; i++) this.puff(this.fireMat, p.clone(), new THREE.Vector3((Math.random() - .5) * 8, 2 + Math.random() * 6, -1 - Math.random() * 6), 600 + Math.random() * 300, 0.6 + Math.random(), now); for (let i = 0; i < 8; i++) this.puff(this.smokeMat, p.clone(), new THREE.Vector3((Math.random() - .5) * 2, 3 + Math.random() * 2, -1), 2200, 2.5 + Math.random() * 2, now); }
  muzzleFlash(pos: THREE.Vector3, now: number): void { this.flash.position.copy(pos); this.flash.visible = true; this.flash.userData.t0 = now; for (let i = 0; i < 5; i++) this.puff(this.smokeMat, pos.clone(), new THREE.Vector3((Math.random() - .5) * 2, 1.5 + Math.random(), -3 - Math.random() * 3), 1600, 1.5 + Math.random() * 1.5, now); }
  update(now: number, dt: number): void {
    for (const b of this.balls) { if (b.done) continue; const k = (now - b.t0) / b.dur; if (k < 0) continue; if (!b.mesh.visible) { b.mesh.visible = true; this.muzzleFlash(b.from, now); }
      if (k >= 1) { b.done = true; this.scene.remove(b.mesh); this.splash(b.to, now); continue; }
      b.mesh.position.lerpVectors(b.from, b.to, k); b.mesh.position.y += Math.sin(k * Math.PI) * 9; }
    for (let i = this.balls.length - 1; i >= 0; i--) if (this.balls[i].done) this.balls.splice(i, 1);
    for (let i = this.puffs.length - 1; i >= 0; i--) { const p = this.puffs[i]; const k = (now - p.t0) / p.life; if (k >= 1) { this.scene.remove(p.sprite); this.puffs.splice(i, 1); continue; }
      p.sprite.position.addScaledVector(p.v, dt); p.v.y -= (p.sprite.material === this.sprayMat ? 18 : -1.5) * dt; p.sprite.scale.setScalar(p.size * (0.6 + k * (p.sprite.material === this.smokeMat ? 1.6 : 0.6))); (p.sprite.material as THREE.SpriteMaterial).opacity = (1 - k) * (p.sprite.material === this.smokeMat ? 0.7 : 0.95); }
    for (let i = this.bursts.length - 1; i >= 0; i--) { const b = this.bursts[i]; const k = (now - b.t0) / b.life; if (k >= 1) { this.scene.remove(b.mesh); this.bursts.splice(i, 1); continue; } b.mesh.scale.setScalar(0.3 + k * b.size); (b.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - k); }
    if (this.flash.visible) { const k = (now - this.flash.userData.t0) / 160; if (k >= 1) this.flash.visible = false; else this.flash.scale.setScalar(3 + k * 6); }
    this.shake = Math.max(0, this.shake - dt * 2.2);
  }
  debug(): Record<string, number> { return { balls: this.balls.length, puffs: this.puffs.length, bursts: this.bursts.length, fired: this.fired, splashes: this.splashes, wallHits: this.wallHits }; }
}
