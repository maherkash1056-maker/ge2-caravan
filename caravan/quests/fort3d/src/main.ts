import * as THREE from "three";
import { FortScene } from "./scene";
import { Sea } from "./sea";
import { Mats } from "./materials";
import { Fort } from "./fort";
import { Ships, WALL } from "./ships";
import { Effects } from "./effects";
import { Orbit } from "./input";
import type { FortState, FortView, MountOptions } from "./types";

// Fort of Taqah — the 3D presentation. fort.js owns every rule; this module only reads its state object each frame:
//   raiders (x, lane, n, gone, sunk/reached) → dhows; shots (t, lane) → cannonballs; hit → wall flash + shake;
//   wall → cracks; cur → highlighted raider; shield → dome. fort.js keeps its 2D canvas as the fallback.
function webglOk(): boolean { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; } }

class View implements FortView {
  private readonly fs: FortScene; private readonly sea: Sea; private readonly mats = new Mats(); private readonly fort: Fort; private readonly ships: Ships; private readonly fx: Effects; private readonly orbit: Orbit;
  private readonly seen = new Set<number>(); private lastHit = 0; private last = 0; private frames = 0; private readonly low: boolean;
  private readonly rest = { pos: new THREE.Vector3(10, 34, 16), look: new THREE.Vector3(-4, 2, -80) };
  private readonly tmp = new THREE.Vector3(); private readonly tmp2 = new THREE.Vector3();
  private readonly flashEl: HTMLDivElement;
  constructor(container: HTMLElement, opts: MountOptions) {
    this.low = opts.quality === "low" || (navigator.hardwareConcurrency || 4) <= 2;
    this.fs = new FortScene(container, this.low); this.sea = new Sea(this.low); this.fs.scene.add(this.sea.mesh);
    this.fort = new Fort(this.mats, this.low); this.fs.scene.add(this.fort.group);
    this.ships = new Ships(this.fs.scene, this.mats, this.low); this.fx = new Effects(this.fs.scene, this.mats);
    this.fs.mount(); this.orbit = new Orbit(this.fs.canvas);
    this.flashEl = document.createElement("div"); this.flashEl.style.cssText = "position:absolute;inset:0;pointer-events:none;background:#e2452d;opacity:0;transition:opacity .12s;z-index:1"; container.appendChild(this.flashEl);
    this.fs.camera.position.copy(this.rest.pos); this.fs.camera.lookAt(this.rest.look);
    new ResizeObserver(() => this.fs.resize()).observe(container);
  }
  update(now: number, F: FortState): void {
    const t = now / 1000, dt = this.last ? Math.min(0.1, (now - this.last) / 1000) : 0.016; this.last = now; this.frames++;
    this.sea.update(t); this.fort.update(t, dt, F.shield > 0); this.fort.setDamage(F.wall, this.fs.scene, this.mats);
    this.ships.sync(F.raiders, F.cur, t, dt, (x, z) => this.sea.heightAt(x, z, t));
    // new shots in fort.js's list → cannonballs toward the raider in that lane; the raider sinks itself via its `gone` flag
    for (const s of F.shots) { if (this.seen.has(s.t)) continue; this.seen.add(s.t); const target = F.raiders.find(r => r.lane === s.lane && Math.abs(r.x - s.x) < 1e-6) || F.raiders.find(r => r.lane === s.lane && r.gone);
      const to = target ? this.ships.positionOf(target, this.tmp2).clone() : this.tmp2.set(0, 0, -90); this.fx.fire(this.fort.muzzleWorld(this.tmp), to, Math.max(0, s.t - now), now); }
    if (this.seen.size > 60) { const keep = new Set<number>(F.shots.map(s => s.t)); for (const k of this.seen) if (!keep.has(k)) this.seen.delete(k); }
    if (F.hit && F.hit !== this.lastHit) { this.lastHit = F.hit; this.fx.wallHit(now); }
    this.flashEl.style.opacity = F.hit && now - F.hit < 450 ? String(0.35 * (1 - (now - F.hit) / 450)) : "0";
    if (F.cur && !F.cur.gone) this.fort.aimAt(this.ships.positionOf(F.cur, this.tmp), dt);
    this.fx.update(now, dt); this.orbit.update(dt);
    // camera: rest pose + orbit offsets + breathing + shake
    const c = this.fs.camera, yaw = this.orbit.yaw, pitch = this.orbit.pitch, zoom = this.orbit.zoom;
    c.position.set(this.rest.pos.x + Math.sin(yaw) * 30 + Math.sin(t * 0.5) * 0.25, this.rest.pos.y + pitch * 20 + Math.sin(t * 0.7) * 0.15 - zoom * 6, this.rest.pos.z + (1 - Math.cos(yaw)) * 30 + zoom * 18);
    const sh = this.fx.shake; if (sh > 0) c.position.add(this.tmp.set((Math.random() - .5) * sh * 1.2, (Math.random() - .5) * sh * 0.8, 0));
    this.tmp.copy(this.rest.look); this.tmp.x += Math.sin(yaw) * 80; this.tmp.y += pitch * 60; c.lookAt(this.tmp);
    this.fs.render();
  }
  resize(): void { this.fs.resize(); }
  dispose(): void { this.fs.dispose(); this.flashEl.remove(); }
  debug(): Record<string, unknown> { const info = this.fs.renderer.info; return { frames: this.frames, low: this.low, ...this.ships.debug(), fx: this.fx.debug(), calls: info.render.calls, triangles: info.render.triangles, cameraYaw: +this.orbit.yaw.toFixed(3), cameraZoom: +this.orbit.zoom.toFixed(2), shield: this.fort.shield.visible, pixelRatio: this.fs.renderer.getPixelRatio() }; }
}

const api = {
  available: webglOk,
  mount(container: HTMLElement, opts: MountOptions = {}): FortView | null { try { if (!webglOk()) return null; const v = new View(container, opts); (window as any).__fortView = v; return v; } catch (e) { console.warn("FortView3D failed, using 2D", e); return null; } },
  WALL,
};
(window as any).FortView3D = api;
export default api;
