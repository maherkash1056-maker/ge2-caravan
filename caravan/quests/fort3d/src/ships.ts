import * as THREE from "three";
import { Mats, bannerTexture } from "./materials";
import type { Raider } from "./types";

// Raider dhows. Three lanes fan out across the bay; x=1 is the horizon, x=0 is the wall. Each ship shows its number on a
// banner, bobs on the swell, heels when turning, and sinks when the cannon gets it or crashes when it reaches the wall.
const LANE_Z = [-58, -70, -82], LANE_X = [-30, 0, 30];
export const WALL = new THREE.Vector3(0, 10, -22);
export function lanePoint(x: number, lane: number, out: THREE.Vector3): THREE.Vector3 {
  const k = Math.max(0, Math.min(1, x)); const far = new THREE.Vector3(LANE_X[lane % 3] * 1.7 - 10, 0, -150 + (lane % 3) * 8), near = new THREE.Vector3(LANE_X[lane % 3] * 0.5 - 4, 0, LANE_Z[lane % 3] + 12);
  return out.copy(far).lerp(near, 1 - k);
}

interface ShipRec { raider: Raider; obj: THREE.Group; mast: THREE.Group; sail: THREE.Mesh; sailBase: Float32Array; marker: THREE.Mesh; phase: number; state: "sail" | "sinking" | "crash" | "done"; t0: number; wreck: number }

export class Ships {
  private readonly recs = new Map<Raider, ShipRec>();
  private readonly low: boolean;
  constructor(private readonly scene: THREE.Scene, private readonly m: Mats, low: boolean) { this.low = low; }
  private hull(): THREE.Mesh {
    const pts: THREE.Vector2[] = []; for (let i = 0; i <= 8; i++) { const k = i / 8; pts.push(new THREE.Vector2(0.2 + Math.sin(k * Math.PI) * 2.2, k * 7 - 3.5)); }
    const geo = new THREE.LatheGeometry(pts, 12); geo.rotateX(Math.PI / 2); geo.scale(1, 0.55, 1.25); geo.computeVertexNormals();
    const hull = new THREE.Mesh(geo, this.m.wood); hull.castShadow = !this.low; return hull;
  }
  private build(r: Raider): ShipRec {
    const obj = new THREE.Group(); obj.name = "Raider_" + r.n; obj.scale.setScalar(1.7);
    const hull = this.hull(); hull.position.y = 0.1; obj.add(hull);
    // deck closes the hull; raised stern cabin and a gunwale strip
    const deck = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.3, 7.6), this.m.darkWood); deck.position.y = 0.9; obj.add(deck);
    const stern = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.1, 1.8), this.m.wood); stern.position.set(0, 1.5, 2.9); obj.add(stern);
    const rail = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.25, 7.9), this.m.wood); rail.position.y = 1.15; obj.add(rail);
    const mast = new THREE.Group(); mast.position.set(0, 1.0, -0.4); obj.add(mast);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.17, 7.5, 6), this.m.darkWood); pole.position.y = 3.6; pole.rotation.z = 0.08; mast.add(pole);
    // lateen rig: a long slanted yard carrying a triangular sail
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 10, 5), this.m.darkWood); yard.rotation.x = -0.95; yard.position.set(0.3, 5.3, -0.6); mast.add(yard);
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0, 8.2); shape.lineTo(6.2, 1.2); shape.lineTo(0, 0);
    const sg = new THREE.ShapeGeometry(shape); sg.rotateY(Math.PI / 2); sg.rotateX(-0.95); sg.translate(0.3, 1.0, 2.6);
    const sail = new THREE.Mesh(sg, this.m.sail); sail.castShadow = !this.low; mast.add(sail);
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.1), new THREE.MeshBasicMaterial({ map: bannerTexture(String(r.n), r.lane === 1 ? "#8c2f22" : r.lane === 0 ? "#6a3d8f" : "#2f6f69"), side: THREE.DoubleSide })); banner.position.set(0, 8.1, 0); mast.add(banner);
    const marker = new THREE.Mesh(new THREE.RingGeometry(3.4, 4.1, 24), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false })); marker.rotation.x = -Math.PI / 2; marker.position.y = 0.35; marker.visible = false; obj.add(marker);
    this.scene.add(obj);
    return { raider: r, obj, mast, sail, sailBase: new Float32Array(0), marker, phase: Math.random() * 6.28, state: "sail", t0: 0, wreck: 0 };
  }
  sync(raiders: Raider[], cur: Raider | null, t: number, dt: number, seaHeight: (x: number, z: number) => number): void {
    for (const r of raiders) { let rec = this.recs.get(r); if (!rec) { rec = this.build(r); this.recs.set(r, rec); }
      if (rec.state === "sail" && r.gone) { rec.state = (r.reached || r.x <= 0) ? "crash" : "sinking"; rec.t0 = t; }
      this.animate(rec, t, dt, seaHeight, rec.raider === cur);
    }
    // ships whose raider is no longer in the list (new wave) are removed
    for (const [r, rec] of this.recs) if (!raiders.includes(r)) { this.scene.remove(rec.obj); this.recs.delete(r); }
  }
  private animate(rec: ShipRec, t: number, dt: number, seaHeight: (x: number, z: number) => number, isCur: boolean): void {
    const o = rec.obj, r = rec.raider; const p = lanePoint(r.x, r.lane, new THREE.Vector3());
    const ahead = lanePoint(r.x - 0.02, r.lane, new THREE.Vector3()); const heading = Math.atan2(ahead.x - p.x, ahead.z - p.z);
    const bob = seaHeight(p.x, p.z) * 0.6;
    if (rec.state === "sail") { o.position.set(p.x, bob, p.z); o.rotation.set(Math.sin(t * 1.3 + rec.phase) * 0.04, heading, Math.sin(t * 0.9 + rec.phase) * 0.07); }
    else if (rec.state === "sinking") { const k = Math.min(1, Math.max(0, (t - rec.t0 - 0.56) / 1.6)); if (k === 0) { o.position.set(p.x, bob, p.z); o.rotation.set(Math.sin(t * 1.3 + rec.phase) * 0.04, heading, Math.sin(t * 0.9 + rec.phase) * 0.07); } o.position.set(p.x, bob - k * 6, p.z); o.rotation.set(k * 0.9, heading, k * 0.5); if (k >= 1) { rec.state = "done"; o.visible = false; } }
    else if (rec.state === "crash") { const k = Math.min(1, (t - rec.t0) / 1.2); o.position.set(p.x, bob - k * 3, p.z); o.rotation.set(-k * 0.5, heading + k * 0.6, k * 0.8); if (k >= 1) { rec.state = "done"; o.visible = false; } }
    // sail billows
    rec.mast.rotation.y = 0.95 + Math.sin(t * 0.8 + rec.phase) * 0.12; rec.mast.rotation.x = Math.sin(t * 1.1 + rec.phase) * 0.03;
    rec.marker.visible = isCur && rec.state === "sail" && !r.gone; if (rec.marker.visible) { const s = 1 + Math.sin(t * 5) * 0.08; rec.marker.scale.set(s, s, 1); }
  }
  positionOf(r: Raider, out: THREE.Vector3): THREE.Vector3 { const rec = this.recs.get(r); return rec ? out.copy(rec.obj.position) : lanePoint(r.x, r.lane, out); }
  debug(): { ships: number; sailing: number; sinking: number; done: number } {
    let sailing = 0, sinking = 0, done = 0; for (const rec of this.recs.values()) { if (rec.state === "sail") sailing++; else if (rec.state === "done") done++; else sinking++; }
    return { ships: this.recs.size, sailing, sinking, done };
  }
}
