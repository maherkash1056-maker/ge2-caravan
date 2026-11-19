import * as THREE from "three";
import { Mats, boxUV } from "./materials";
import { Colliders } from "./colliders";
import { Fort } from "./fort";

// The walkable fortress: colliders for everything Fort builds, plus the pieces an explorer needs — the stone staircase
// from the courtyard to the rampart, parapets, the hollow keep with its reading room, the market stall, the gate passage
// and the invisible boundary at the edge of the headland. Interactive stations are listed here so the view can prompt.
export interface Station { id: "cannon0" | "cannon1" | "cannon2" | "reading" | "shop" | "gate" | "lookout"; pos: THREE.Vector3; radius: number; label: string; hint: string; marker?: THREE.Object3D }

export class World {
  readonly stations: Station[] = [];
  readonly spawn = { pos: new THREE.Vector3(-3.5, 9, 12), yaw: 0 };
  readonly group = new THREE.Group();
  constructor(readonly col: Colliders, m: Mats, fort: Fort, low: boolean) {
    const g = this.group; g.name = "World";
    const box = (x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material, shadow = true, collide = true, tag?: string) => { const mesh = new THREE.Mesh(boxUV(new THREE.BoxGeometry(w, h, d), w, h, d, mat === m.stone ? 1.6 : 2.4), mat); mesh.position.set(x, y + h / 2, z); mesh.castShadow = shadow && !low; mesh.receiveShadow = true; g.add(mesh); if (collide) col.addBox(x, y, z, w, h, d, tag); return mesh; };
    // --- ground + fort solids (visuals come from Fort) ---
    col.add([-40, -20, -40], [40, 9.0, 40], "courtyard");                  // headland top (sand disc top is y=9)
    col.add([-17, 9, -15.5], [17, 17, -12.5], "wall");                      // curtain wall
    col.add([-17, 17, -15.6], [17, 18.3, -15.0], "parapet");                // merlon row treated as a solid parapet (sea side)
    for (let i = -8; i <= 8; i++) col.add([i * 2 - 0.7, 17, -15.6], [i * 2 + 0.7, 18.3, -12.4], "merlon");
    col.add([-17, 16.4, -14], [17, 17, -9], "walk");                        // rampart walkway top y=17
    for (const sx of [-1, 1]) { col.add([sx * 15.5, 9, -14], [sx * 18.5, 16, 8], "sidewall"); col.add([sx * 17.5 - 4.8, 9, -18.8], [sx * 17.5 + 4.8, 23, -9.2], "tower"); }
    // inner parapet so nobody walks off the rampart into the courtyard (low, with a gap where the stairs arrive)
    box(3, 17, -8.8, 28, 0.9, 0.4, m.plaster, false, true, "innerparapet");
    // --- staircase: courtyard (y=9) → rampart (y=17), along the left side wall ---
    const steps = 32, rise = 0.25, run = 0.4; const sx0 = -14;
    for (let i = 0; i < steps; i++) { const z = 4 - run * (i + 0.5); const h = rise * (i + 1); const s = new THREE.Mesh(boxUV(new THREE.BoxGeometry(3, h, run), 3, h, run, 1.6), m.stone); s.position.set(sx0, 9 + h / 2, z); s.receiveShadow = true; s.castShadow = !low && i % 4 === 0; g.add(s); col.addBox(sx0, 9, z, 3, h, run, "stair"); }
    box(sx0, 9, 4 - run * steps - 0.6, 3, 8, 1.2, m.stone, true, true, "stairtop");   // landing block that meets the walkway at z≈-9.4
    box(sx0 + 1.7, 9, -2.4, 0.4, 8.6, 13.2, m.plaster, false, true, "stairrail");     // railing on the open side of the stairs
    // --- the keep: hollow, door toward the courtyard (z = -3 face), reading room inside ---
    const kx = 5, kz = 2, kw = 12, kd = 10, kh = 10, t = 0.6;
    box(kx - 3.5, 9, kz - kd / 2 + t / 2, 5, kh, t, m.plaster, true, true, "keepfront");           // front wall, left of the door (x -1..4)
    box(kx + 3.5, 9, kz - kd / 2 + t / 2, 5, kh, t, m.plaster, true, true, "keepfront");           // front wall, right of the door (x 6..11)
    box(kx, 11.6, kz - kd / 2 + t / 2, 2, kh - 2.6, t, m.plaster, true, true, "keeplintel");       // above the 2 m door (x 4..6, 2.6 m high)
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.18, 8, 16, Math.PI), m.darkWood); arch.position.set(kx, 11.5, kz - kd / 2 + 0.05); g.add(arch);
    box(kx, 9, kz + kd / 2 - t / 2, kw, kh, t, m.plaster, true, true, "keepback");
    box(kx - kw / 2 + t / 2, 9, kz, t, kh, kd, m.plaster, true, true, "keepleft");
    box(kx + kw / 2 - t / 2, 9, kz, t, kh, kd, m.plaster, true, true, "keepright");
    box(kx, 9 + kh - t, kz, kw, t, kd, m.plaster, false, true, "keeproof");
    for (let i = -2; i <= 2; i++) box(kx + i * 2.4, 19, kz - kd / 2 + 0.6, 1.2, 1.1, 1.2, m.plaster, true, false);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(kw - 1.2, kd - 1.2), m.wood); floor.rotation.x = -Math.PI / 2; floor.position.set(kx, 9.02, kz); floor.receiveShadow = true; g.add(floor);
    const lamp = new THREE.PointLight(0xffb070, low ? 0 : 18, 14, 2); lamp.position.set(kx, 13.5, kz); g.add(lamp);
    // reading lectern with the "wall text" scroll
    box(kx, 9, kz + 1.5, 1.2, 1.1, 0.8, m.darkWood, true, true, "lectern");
    const scroll = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.7), m.plaster); scroll.position.set(kx, 10.14, kz + 1.5); scroll.rotation.x = 0.3; g.add(scroll);
    for (let i = 0; i < 3; i++) box(kx - 4.5 + i * 0.1, 9, kz - 2 + i * 1.6, 0.8, 1.5 + i * 0.3, 1.2, m.wood, true, true, "chest");
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), m.flag); rug.rotation.x = -Math.PI / 2; rug.position.set(kx, 9.03, kz - 0.5); g.add(rug);
    this.stations.push({ id: "reading", pos: new THREE.Vector3(kx, 9, kz + 0.4), radius: 2.2, label: "📖 The text on the wall", hint: "Read the text again (E / tap)" });
    // --- market stall (shop between waves) in the courtyard ---
    box(-8, 9, 10, 4, 1.0, 1.4, m.darkWood, true, true, "stall");
    for (const sx of [-1, 1]) box(-8 + sx * 1.9, 9, 10.6, 0.15, 2.8, 0.15, m.darkWood, false, true);
    const awning = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), m.flag); awning.rotation.x = -Math.PI / 2 + 0.25; awning.position.set(-8, 11.8, 10.2); awning.material = m.flag; g.add(awning);
    for (let i = 0; i < 5; i++) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.36, 10), i % 2 ? m.brass : m.ember); pot.position.set(-9.6 + i * 0.8, 10.18, 9.8); g.add(pot); }
    this.stations.push({ id: "shop", pos: new THREE.Vector3(-8, 9, 8.6), radius: 2.4, label: "🛒 The fort shop", hint: "Open the shop (E / tap)" });
    // --- gate passage through the curtain wall is decorative in the original; here it is the lookout station on the rampart ---
    this.stations.push({ id: "lookout", pos: new THREE.Vector3(-14, 17, -11), radius: 2.0, label: "🔭 Lookout", hint: "Watch the bay" });
    // --- cannons: stations on the rampart, one per lane ---
    fort.cannons.forEach((c, lane) => { this.stations.push({ id: ("cannon" + lane) as Station["id"], pos: new THREE.Vector3(c.position.x, 17, c.position.z + 2.2), radius: 2.3, label: ["⬅️ West cannon", "⬆️ Middle cannon", "➡️ East cannon"][lane], hint: "Fire at the raider in this lane (E / tap)", marker: c }); col.addBox(c.position.x, 17, c.position.z, 1.8, 1.6, 2.6, "cannon"); });
    // --- courtyard details ---
    box(0, 9, 15.6, 36, 1.3, 0.6, m.plaster, true, true, "backparapet");
    col.add([-40, 9, 15.9], [40, 30, 40], "boundary"); col.add([-40, 9, -40], [-18.5, 30, 40], "boundary"); col.add([18.5, 9, -40], [40, 30, 40], "boundary");
    col.addBox(-9, 9, 4, 0.8, 7, 0.8, "palm"); col.addBox(12, 9, -4, 0.8, 7, 0.8, "palm");
    const well = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.2, 0.9, 14), m.stone); well.position.set(9, 9.45, 11); well.castShadow = !low; g.add(well); col.addBox(9, 9, 11, 2.3, 0.9, 2.3, "well");
    for (let i = 0; i < 6; i++) { const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.7, 10), m.ember); jar.position.set(13 + (i % 3) * 0.8, 9.35, 6 + Math.floor(i / 3) * 0.8); g.add(jar); }
    col.addBox(13.8, 9, 6.4, 2.6, 0.7, 1.6, "jars");
    // flag marker for the spawn: the student starts in the courtyard facing the sea wall
    this.spawn.pos.set(-3.5, 9, 12); this.spawn.yaw = 0;
    // station markers: floating rings
    for (const s of this.stations) { const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 20), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.copy(s.pos).add(new THREE.Vector3(0, 0.05, 0)); ring.name = "Marker_" + s.id; g.add(ring); if (!s.marker) s.marker = ring; }
  }
  nearest(p: THREE.Vector3): Station | null { let best: Station | null = null, bd = 1e9; for (const s of this.stations) { const d = Math.hypot(p.x - s.pos.x, p.z - s.pos.z); if (d < s.radius && Math.abs(p.y - s.pos.y) < 2.5 && d < bd) { bd = d; best = s; } } return best; }
  update(t: number): void { for (const s of this.stations) { const m = s.marker; if (m && m.name && m.name.startsWith("Marker_")) { m.position.y = s.pos.y + 0.08 + Math.sin(t * 2 + s.pos.x) * 0.04; m.rotation.z = t * 0.6; } } }
}
