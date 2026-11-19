import * as THREE from "three";
import { FortScene } from "./scene";
import { Sea } from "./sea";
import { Mats } from "./materials";
import { Fort } from "./fort";
import { Ships } from "./ships";
import { Effects } from "./effects";
import { Colliders } from "./colliders";
import { World, Station } from "./world";
import { Player } from "./player";
import type { FortState, FortView, MountOptions } from "./types";

// Fort of Taqah — adventure mode. First-person exploration of the fort; fort.js still owns every rule and this view
// reads F each frame (raiders, shots, hits, wall, shield). Stations (cannons, reading room, shop) raise events on
// `onStation` so the page can open the matching panel; the page decides what the student may do.
export class AdventureView implements FortView {
  readonly fs: FortScene; readonly sea: Sea; readonly mats = new Mats(); readonly fort: Fort; readonly ships: Ships; readonly fx: Effects;
  readonly col = new Colliders(); readonly world: World; readonly player: Player;
  onStation: ((s: Station | null) => void) | null = null; onInteract: ((s: Station) => void) | null = null;
  station: Station | null = null; readonly low: boolean; private last = 0; private frames = 0; private bobT = 0; private readonly seen = new Set<number>(); private lastHit = 0;
  private readonly tmp = new THREE.Vector3(); private readonly tmp2 = new THREE.Vector3(); private readonly flashEl: HTMLDivElement; private readonly promptEl: HTMLDivElement; private readonly cross: HTMLDivElement;
  frameMs: number[] = []; quality: "low" | "medium" | "high" = "high"; auto = true; private ema = 16; private slowFor = 0; private sinceApply = 0; private readonly gfxBtn: HTMLButtonElement;
  constructor(container: HTMLElement, opts: MountOptions) {
    const hashQ = (location.hash.match(/[#&]gfx=(low|medium|high)/) || [])[1] as "low" | "medium" | "high" | undefined; const cores = navigator.hardwareConcurrency || 4, mem = (navigator as any).deviceMemory || 4, touch = opts.touch !== undefined ? opts.touch : ("ontouchstart" in window);
    this.quality = hashQ || opts.quality || (cores <= 2 || mem <= 2 ? "low" : (touch || cores <= 4 || mem <= 4) ? "medium" : "high"); if (hashQ) this.auto = false;
    this.low = this.quality === "low";
    this.fs = new FortScene(container, this.low, 72, 0.08); this.sea = new Sea(this.low); this.fs.scene.add(this.sea.mesh);
    this.fort = new Fort(this.mats, this.low, true); this.fs.scene.add(this.fort.group);
    this.world = new World(this.col, this.mats, this.fort, this.low); this.fs.scene.add(this.world.group);
    this.ships = new Ships(this.fs.scene, this.mats, this.low); this.fx = new Effects(this.fs.scene, this.mats);
    this.fs.mount(); this.player = new Player(this.fs.canvas, this.col, opts.touch); this.player.spawn(this.world.spawn.pos.x, this.world.spawn.pos.y, this.world.spawn.pos.z, this.world.spawn.yaw);
    this.flashEl = document.createElement("div"); this.flashEl.style.cssText = "position:absolute;inset:0;pointer-events:none;background:#e2452d;opacity:0;transition:opacity .12s;z-index:1"; container.appendChild(this.flashEl);
    this.cross = document.createElement("div"); this.cross.id = "fcross"; container.appendChild(this.cross);
    this.promptEl = document.createElement("div"); this.promptEl.id = "fprompt"; this.promptEl.hidden = true; container.appendChild(this.promptEl);
    new ResizeObserver(() => this.fs.resize()).observe(container);
    this.gfxBtn = document.createElement("button"); this.gfxBtn.id = "fgfx"; this.gfxBtn.type = "button"; this.gfxBtn.title = "Graphics preset (G)"; this.gfxBtn.onclick = () => this.cycleQuality(); container.appendChild(this.gfxBtn);
    addEventListener("keydown", e => { if (e.key.toLowerCase() === "g" && !e.repeat && !(e.target as HTMLElement).closest("input,textarea")) this.cycleQuality(); });
    this.applyQuality(this.quality);
    // shadows follow the player so the courtyard and rampart stay crisp
    this.fs.sun.target.position.set(0, 9, 0); this.fs.scene.add(this.fs.sun.target);
  }
  cycleQuality(): void { const order = ["low", "medium", "high"] as const; this.auto = false; this.setQuality(order[(order.indexOf(this.quality) + 1) % 3]); }
  setQuality(q: "low" | "medium" | "high"): void { this.quality = q; this.applyQuality(q); }
  private applyQuality(q: "low" | "medium" | "high"): void {
    const dpr = window.devicePixelRatio || 1; const r = this.fs.renderer, sun = this.fs.sun;
    const P = { low: { pr: 1, shadow: 0, props: false, far: 420 }, medium: { pr: Math.min(dpr, 1.25), shadow: 1024, props: true, far: 600 }, high: { pr: Math.min(dpr, 2), shadow: 2048, props: true, far: 900 } }[q];
    r.setPixelRatio(P.pr); r.shadowMap.enabled = P.shadow > 0; sun.castShadow = P.shadow > 0; if (P.shadow) { sun.shadow.mapSize.set(P.shadow, P.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); (sun.shadow as any).map = null; } }
    this.world.props.visible = P.props; this.fs.camera.far = P.far; this.fs.camera.updateProjectionMatrix(); this.fs.scene.traverse(o => { const mat = (o as THREE.Mesh).material as THREE.Material; if (mat) mat.needsUpdate = true; });
    this.fs.resize(); this.sinceApply = 0; this.slowFor = 0; this.gfxBtn.textContent = "⚙ " + q[0].toUpperCase() + q.slice(1) + (this.auto ? " · auto" : "");
  }
  // adaptive fallback: a sustained slow frame time (EMA > 30 ms for 3 s) steps the preset down once per 5 s
  private adapt(dt: number): void { if (!this.auto) return; const ms = dt * 1000; if (ms > 250 && this.sinceApply < 1) return; this.ema += (ms - this.ema) * 0.08; this.sinceApply += dt; if (this.sinceApply < 2) return;
    if (this.ema > 30) { this.slowFor += dt; if (this.slowFor > 3 && this.quality !== "low") { this.applyQuality(this.quality = this.quality === "high" ? "medium" : "low"); } } else this.slowFor = Math.max(0, this.slowFor - dt); }
  // deterministic stepping for tests: n physics steps of dt seconds without rendering
  tick(dt: number, n = 1): void { for (let i = 0; i < n; i++) this.player.step(dt); }
  update(now: number, F: FortState): void {
    const t = now / 1000, dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0.016; if (this.last) this.frameMs.push(now - this.last); if (this.frameMs.length > 300) this.frameMs.shift(); this.last = now; this.frames++;
    if (this.player.enabled && !F.over) { const sub = Math.max(1, Math.ceil(dt / (1 / 60))); for (let i = 0; i < sub; i++) this.player.step(dt / sub); }
    this.bobT += this.player.grounded ? this.player.speed * dt * 1.8 : 0; const bob = this.player.grounded ? Math.sin(this.bobT) * 0.03 * Math.min(1, this.player.speed / 4) : 0;
    this.player.applyCamera(this.fs.camera, bob);
    // station proximity + prompt
    const s = this.world.nearest(this.player.pos); if (s !== this.station) { this.station = s; this.promptEl.hidden = !s; if (s) this.promptEl.innerHTML = "<b>" + s.label + "</b><span>" + s.hint + "</span>"; if (this.onStation) this.onStation(s); }
    if (this.player.interactPressed) { this.player.interactPressed = false; if (s && this.onInteract) this.onInteract(s); }
    this.sea.update(t); this.fort.update(t, dt, F.shield > 0); this.fort.setDamage(F.wall, this.fs.scene, this.mats); this.world.update(t);
    this.ships.sync(F.raiders, F.cur, t, dt, (x, z) => this.sea.heightAt(x, z, t));
    for (const sh of F.shots) { if (this.seen.has(sh.t)) continue; this.seen.add(sh.t); const target = F.raiders.find(r => r.lane === sh.lane && Math.abs(r.x - sh.x) < 1e-6) || F.raiders.find(r => r.lane === sh.lane && r.gone);
      const to = target ? this.ships.positionOf(target, this.tmp2).clone() : this.tmp2.set(0, 0, -90); this.fx.fire(this.fort.muzzleWorld(this.tmp, sh.lane % 3), to, Math.max(0, sh.t - now), now); }
    if (this.seen.size > 60) { const keep = new Set<number>(F.shots.map(x => x.t)); for (const k of this.seen) if (!keep.has(k)) this.seen.delete(k); }
    if (F.hit && F.hit !== this.lastHit) { this.lastHit = F.hit; this.fx.wallHit(now); }
    this.flashEl.style.opacity = F.hit && now - F.hit < 450 ? String(0.35 * (1 - (now - F.hit) / 450)) : "0";
    for (const r of F.raiders) if (!r.gone) this.fort.aimAt(this.ships.positionOf(r, this.tmp), dt, r.lane % 3);
    this.fx.update(now, dt); this.adapt(dt);
    const sh = this.fx.shake; if (sh > 0) this.fs.camera.position.add(this.tmp.set((Math.random() - .5) * sh * 0.15, (Math.random() - .5) * sh * 0.1, 0));
    this.fs.render();
  }
  resize(): void { this.fs.resize(); }
  dispose(): void { this.fs.dispose(); this.flashEl.remove(); this.promptEl.remove(); this.cross.remove(); this.gfxBtn.remove(); const j = document.getElementById("fjoy"); if (j) j.remove(); const a = document.getElementById("fact"); if (a) a.remove(); if (document.pointerLockElement) try { document.exitPointerLock(); } catch { } }
  debug(): Record<string, unknown> { const info = this.fs.renderer.info; const p = this.player; const ms = this.frameMs.slice().sort((a, b) => a - b); return { mode: "adventure", frames: this.frames, low: this.low, quality: this.quality, auto: this.auto, ema: +this.ema.toFixed(1), player: { x: +p.pos.x.toFixed(2), y: +p.pos.y.toFixed(2), z: +p.pos.z.toFixed(2), yaw: +p.yaw.toFixed(3), pitch: +p.pitch.toFixed(3), grounded: p.grounded, hitWall: p.hitWall, speed: +p.speed.toFixed(2), locked: p.locked, touch: p.touch, distance: +p.distance.toFixed(1) }, station: this.station && this.station.id, colliders: this.col.boxes.length, ...this.ships.debug(), fx: this.fx.debug(), calls: info.render.calls, triangles: info.render.triangles, pixelRatio: this.fs.renderer.getPixelRatio(), frameP50: ms.length ? +ms[ms.length >> 1].toFixed(1) : null, frameP90: ms.length ? +ms[Math.floor(ms.length * 0.9)].toFixed(1) : null }; }
}
