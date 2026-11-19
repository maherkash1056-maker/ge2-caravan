// Pointer orbit for the rampart camera: drag (mouse or one finger) to look around within limits, wheel / pinch for a
// small zoom range; the camera drifts back toward its rest pose when released. Taps are not swallowed (the answer buttons
// live outside the canvas).
export class Orbit {
  yaw = 0; pitch = 0; zoom = 0; // offsets from the rest pose
  private dragging = false; private lx = 0; private ly = 0; private pinch = 0; private idle = 0;
  constructor(private readonly el: HTMLElement) {
    el.addEventListener("pointerdown", e => { this.dragging = true; this.lx = e.clientX; this.ly = e.clientY; this.idle = 0; try { el.setPointerCapture(e.pointerId); } catch { } });
    el.addEventListener("pointermove", e => { if (!this.dragging) return; const dx = e.clientX - this.lx, dy = e.clientY - this.ly; this.lx = e.clientX; this.ly = e.clientY; this.yaw = clamp(this.yaw - dx * 0.004, -0.7, 0.7); this.pitch = clamp(this.pitch - dy * 0.003, -0.25, 0.3); });
    const up = () => { this.dragging = false; this.pinch = 0; }; el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("pointerleave", up);
    el.addEventListener("wheel", e => { this.zoom = clamp(this.zoom + Math.sign(e.deltaY) * 0.08, -0.5, 0.6); e.preventDefault(); }, { passive: false });
    el.addEventListener("touchmove", e => { if (e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); if (this.pinch) this.zoom = clamp(this.zoom + (this.pinch - d) * 0.003, -0.5, 0.6); this.pinch = d; e.preventDefault(); } }, { passive: false });
  }
  update(dt: number): void { if (this.dragging) return; this.idle += dt; if (this.idle > 2.5) { const k = Math.min(1, dt * 0.8); this.yaw += (0 - this.yaw) * k; this.pitch += (0 - this.pitch) * k; } }
  get isDragging(): boolean { return this.dragging; }
}
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
