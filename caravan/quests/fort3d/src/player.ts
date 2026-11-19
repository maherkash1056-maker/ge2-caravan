import * as THREE from "three";
import { Colliders } from "./colliders";

// First-person controller: WASD / arrows + mouse-look (pointer lock) on desktop; a virtual joystick on the left half and
// drag-to-look on the right half of the screen on touch devices. Gravity, step-up for stairs, acceleration and friction.
export interface PlayerInput { f: boolean; b: boolean; l: boolean; r: boolean; run: boolean; jump: boolean; interact: boolean }
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export class Player {
  readonly pos = new THREE.Vector3();
  readonly vel = new THREE.Vector3();
  yaw = 0; pitch = 0;
  readonly input: PlayerInput = { f: false, b: false, l: false, r: false, run: false, jump: false, interact: false };
  stick = { x: 0, y: 0 }; // virtual joystick (-1..1), y = forward
  grounded = false; hitWall = false; locked = false; enabled = true;
  readonly r = 0.35; readonly h = 1.7; readonly eye = 1.55; readonly stepUp = 0.45;
  walk = 4.2; run = 7; accel = 24; gravity = 22; jumpV = 6.2;
  distance = 0; interactPressed = false;
  private joyEl: HTMLDivElement | null = null; private knob: HTMLDivElement | null = null; private joyId = -1; private lookId = -1; private lx = 0; private ly = 0; private joyC = { x: 0, y: 0 };
  readonly touch: boolean;
  constructor(private readonly el: HTMLElement, private readonly colliders: Colliders, touch?: boolean) {
    this.touch = touch !== undefined ? touch : (("ontouchstart" in window) || (navigator.maxTouchPoints || 0) > 0);
    this.bindKeys(); this.bindMouse(); if (this.touch) this.bindTouch();
  }
  spawn(x: number, y: number, z: number, yaw = 0, pitch = 0): void { this.pos.set(x, y, z); this.vel.set(0, 0, 0); this.yaw = yaw; this.pitch = pitch; this.grounded = false; }
  private bindKeys(): void {
    const map: Record<string, keyof PlayerInput> = { w: "f", arrowup: "f", s: "b", arrowdown: "b", a: "l", arrowleft: "l", d: "r", arrowright: "r", shift: "run", " ": "jump", e: "interact", enter: "interact" };
    const on = (e: KeyboardEvent, v: boolean) => { if (!this.enabled) return; const t = e.target as HTMLElement; if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return; if (document.querySelector(".qov,.cv-ovl")) return; const k = map[e.key.toLowerCase()]; if (!k) return; if (v && !this.input[k] && k === "interact") this.interactPressed = true; this.input[k] = v; if (k !== "interact" || v) e.preventDefault(); };
    addEventListener("keydown", e => on(e, true)); addEventListener("keyup", e => on(e, false));
    addEventListener("blur", () => { for (const k of Object.keys(this.input) as (keyof PlayerInput)[]) this.input[k] = false; });
  }
  private bindMouse(): void {
    const c = this.el;
    c.addEventListener("click", () => { if (!this.enabled || this.touch || this.locked) return; try { const p = (c as any).requestPointerLock({ unadjustedMovement: true }); if (p && p.catch) p.catch(() => c.requestPointerLock()); } catch { try { c.requestPointerLock(); } catch { } } });
    document.addEventListener("pointerlockchange", () => { this.locked = document.pointerLockElement === c; });
    document.addEventListener("mousemove", e => { if (!this.locked || !this.enabled) return; this.look(e.movementX, e.movementY, 0.0024); });
  }
  // called by tests and by mouse/touch: rotate the view by pixel deltas
  look(dx: number, dy: number, k = 0.0024): void { this.yaw -= dx * k; this.pitch = clamp(this.pitch - dy * k, -1.2, 1.2); }
  private bindTouch(): void {
    const c = this.el; c.style.touchAction = "none";
    const joy = document.createElement("div"); joy.id = "fjoy"; joy.innerHTML = '<div id="fknob"></div>'; c.parentElement!.appendChild(joy); this.joyEl = joy; this.knob = joy.querySelector("#fknob") as HTMLDivElement;
    const act = document.createElement("button"); act.id = "fact"; act.type = "button"; act.textContent = "✋"; act.title = "Interact"; c.parentElement!.appendChild(act);
    act.addEventListener("touchstart", e => { e.preventDefault(); this.interactPressed = true; this.input.interact = true; }, { passive: false }); act.addEventListener("touchend", e => { e.preventDefault(); this.input.interact = false; }, { passive: false });
    const jr = () => joy.getBoundingClientRect();
    const setJoy = (x: number, y: number) => { const r = jr(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2; let vx = (x - cx) / (r.width / 2), vy = (y - cy) / (r.height / 2); const m = Math.hypot(vx, vy); if (m > 1) { vx /= m; vy /= m; } this.stick.x = vx; this.stick.y = -vy; this.knob!.style.transform = `translate(${vx * r.width * 0.3}px,${vy * r.height * 0.3}px)`; };
    const start = (e: TouchEvent) => { for (const t of Array.from(e.changedTouches)) { const r = c.getBoundingClientRect(); const left = t.clientX < r.left + r.width * 0.45; if (left && this.joyId < 0) { this.joyId = t.identifier; const R = jr(); this.joyC = { x: R.left + R.width / 2, y: R.top + R.height / 2 }; setJoy(t.clientX, t.clientY); } else if (!left && this.lookId < 0) { this.lookId = t.identifier; this.lx = t.clientX; this.ly = t.clientY; } } e.preventDefault(); };
    const move = (e: TouchEvent) => { for (const t of Array.from(e.changedTouches)) { if (t.identifier === this.joyId) setJoy(t.clientX, t.clientY); else if (t.identifier === this.lookId) { this.look(t.clientX - this.lx, t.clientY - this.ly, 0.005); this.lx = t.clientX; this.ly = t.clientY; } } e.preventDefault(); };
    const end = (e: TouchEvent) => { for (const t of Array.from(e.changedTouches)) { if (t.identifier === this.joyId) { this.joyId = -1; this.stick.x = this.stick.y = 0; this.knob!.style.transform = ""; } else if (t.identifier === this.lookId) this.lookId = -1; } };
    for (const [ev, fn] of [["touchstart", start], ["touchmove", move], ["touchend", end], ["touchcancel", end]] as const) { c.addEventListener(ev, fn as any, { passive: false }); joy.addEventListener(ev, fn as any, { passive: false }); }
  }
  // one physics step; dt in seconds
  step(dt: number): void {
    const i = this.input; let fx = (i.r ? 1 : 0) - (i.l ? 1 : 0), fz = (i.f ? 1 : 0) - (i.b ? 1 : 0);
    if (this.stick.x || this.stick.y) { fx += this.stick.x; fz += this.stick.y; }
    const m = Math.hypot(fx, fz); if (m > 1) { fx /= m; fz /= m; }
    const max = (i.run ? this.run : this.walk) * (this.stick.x || this.stick.y ? Math.min(1, Math.hypot(this.stick.x, this.stick.y)) : 1);
    // world-space wish direction from yaw (yaw 0 looks toward -z)
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const wx = (fx * cos - fz * sin) * max, wz = (-fz * cos - fx * sin) * max;
    const a = this.grounded ? this.accel : this.accel * 0.35;
    this.vel.x += clamp(wx - this.vel.x, -a * dt, a * dt); this.vel.z += clamp(wz - this.vel.z, -a * dt, a * dt);
    if (!fx && !fz && this.grounded) { const f = Math.exp(-12 * dt); this.vel.x *= f; this.vel.z *= f; }
    if (i.jump && this.grounded) { this.vel.y = this.jumpV; this.grounded = false; }
    this.vel.y -= this.gravity * dt; if (this.vel.y < -30) this.vel.y = -30;
    const before = this.pos.clone();
    const res = this.colliders.move(this.pos, this.vel.x * dt, this.vel.z * dt, this.vel.y * dt, this.r, this.h, this.stepUp);
    this.grounded = res.grounded; this.hitWall = res.hitWall; if (res.grounded && this.vel.y < 0) this.vel.y = 0; if (res.hitHead && this.vel.y > 0) this.vel.y = 0;
    if (res.hitWall) { this.vel.x *= 0.2; this.vel.z *= 0.2; }
    this.distance += Math.hypot(this.pos.x - before.x, this.pos.z - before.z);
  }
  applyCamera(cam: THREE.PerspectiveCamera, bob: number): void {
    cam.position.set(this.pos.x, this.pos.y + this.eye + bob, this.pos.z);
    cam.rotation.set(0, 0, 0, "YXZ"); cam.rotation.y = this.yaw; cam.rotation.x = this.pitch;
  }
  get speed(): number { return Math.hypot(this.vel.x, this.vel.z); }
  forward(out: THREE.Vector3): THREE.Vector3 { return out.set(-Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw) * Math.cos(this.pitch)); }
}
