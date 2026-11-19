import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { Mats, boxUV } from "./materials";
import { Colliders } from "./colliders";
import { Fort } from "./fort";

// The walkable fortress: colliders for everything Fort builds, plus what an explorer needs — the stone staircase from
// the courtyard to the rampart, parapets, the hollow keep with its reading room, the market stall, the well, the edge
// of the headland, the distant Dhofar mountains and clouds. Static boxes are merged per material (few draw calls).
export interface Station { id: "cannon0" | "cannon1" | "cannon2" | "reading" | "shop" | "gate" | "lookout"; pos: THREE.Vector3; radius: number; label: string; hint: string; marker?: THREE.Object3D }

export class World {
  readonly stations: Station[] = [];
  readonly spawn = { pos: new THREE.Vector3(-3.5, 9, 12), yaw: 0 };
  readonly group = new THREE.Group();
  readonly props = new THREE.Group();     // decorative extras, hidden on the Low preset
  readonly clouds: THREE.Sprite[] = [];
  constructor(readonly col: Colliders, m: Mats, fort: Fort, low: boolean) {
    const g = this.group; g.name = "World"; this.props.name = "Props"; g.add(this.props);
    const buckets = new Map<THREE.Material, THREE.BufferGeometry[]>();
    const metres = (mat: THREE.Material) => mat === m.stone ? 1.6 : mat === m.wood || mat === m.darkWood ? 1.2 : 2.4;
    // static box → merged later; collider optional
    const box = (x: number, y: number, z: number, w: number, h: number, d: number, mat: THREE.Material, collide = true, tag?: string) => { const geo = boxUV(new THREE.BoxGeometry(w, h, d), w, h, d, metres(mat)); geo.translate(x, y + h / 2, z); (buckets.get(mat) || buckets.set(mat, []).get(mat)!).push(geo); if (collide) col.addBox(x, y, z, w, h, d, tag); };
    // --- ground + fort solids (visuals come from Fort) ---
    col.add([-40, -20, -40], [40, 9.0, 40], "courtyard");
    col.add([-17, 9, -15.5], [17, 17, -12.5], "wall");
    col.add([-17, 17, -15.6], [17, 18.3, -15.0], "parapet");
    for (let i = -8; i <= 8; i++) col.add([i * 2 - 0.7, 17, -15.6], [i * 2 + 0.7, 18.3, -12.4], "merlon");
    col.add([-17, 16.4, -14], [17, 17, -9], "walk");
    for (const sx of [-1, 1]) { col.add([sx * 15.5, 9, -14], [sx * 18.5, 16, 8], "sidewall"); col.add([sx * 17.5 - 4.8, 9, -18.8], [sx * 17.5 + 4.8, 23, -9.2], "tower"); }
    box(3, 17, -8.8, 28, 0.9, 0.4, m.plaster, true, "innerparapet");
    // wooden "shandal" beams along the inner face of the sea wall and the side walls (Omani fort detail)
    for (let i = -7; i <= 7; i++) box(i * 2.2, 15.2, -12.2, 0.25, 0.25, 0.9, m.wood, false);
    for (const sx of [-1, 1]) for (let i = 0; i < 9; i++) box(sx * 15.2, 14.4, -12 + i * 2.2, 0.9, 0.25, 0.25, m.wood, false);
    // arrow slits on the inner side walls
    for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) box(sx * 15.45, 12.5, -9 + i * 4, 0.12, 1.4, 0.3, m.iron, false);
    // --- staircase: courtyard (y=9) → rampart (y=17), along the west wall ---
    const steps = 32, rise = 0.25, run = 0.4, sx0 = -14;
    for (let i = 0; i < steps; i++) { const z = 4 - run * (i + 0.5), h = rise * (i + 1); box(sx0, 9, z, 3, h, run, m.stone, true, "stair"); }
    box(sx0, 9, 4 - run * steps - 0.6, 3, 8, 1.2, m.stone, true, "stairtop");
    box(sx0 + 1.7, 9, -2.4, 0.4, 8.6, 13.2, m.plaster, true, "stairrail");
    for (let i = 0; i < 6; i++) box(sx0 + 1.7, 9 + i * 1.35, 2.5 - i * 2.2, 0.5, 0.3, 0.5, m.darkWood, false);   // rail posts
    // --- the keep: hollow, door toward the courtyard (z = -3 face), reading room inside ---
    const kx = 5, kz = 2, kw = 12, kd = 10, kh = 10, t = 0.6;
    box(kx - 3.5, 9, kz - kd / 2 + t / 2, 5, kh, t, m.plaster, true, "keepfront");
    box(kx + 3.5, 9, kz - kd / 2 + t / 2, 5, kh, t, m.plaster, true, "keepfront");
    box(kx, 11.6, kz - kd / 2 + t / 2, 2, kh - 2.6, t, m.plaster, true, "keeplintel");
    box(kx, 9, kz + kd / 2 - t / 2, kw, kh, t, m.plaster, true, "keepback");
    box(kx - kw / 2 + t / 2, 9, kz, t, kh, kd, m.plaster, true, "keepleft");
    box(kx + kw / 2 - t / 2, 9, kz, t, kh, kd, m.plaster, true, "keepright");
    box(kx, 9 + kh - t, kz, kw, t, kd, m.plaster, true, "keeproof");
    for (let i = -2; i <= 2; i++) box(kx + i * 2.4, 19, kz - kd / 2 + 0.6, 1.2, 1.1, 1.2, m.plaster, false);
    for (let i = 0; i < 5; i++) box(kx - 5 + i * 2.5, 15.6, kz, 0.3, 0.3, kd - 1.2, m.wood, false);           // ceiling beams
    for (const sx of [-1, 1]) for (let i = 0; i < 2; i++) { box(kx + sx * (kw / 2 - 0.35), 12, kz - 2 + i * 4, 0.2, 1.6, 1.0, m.iron, false); box(kx + sx * (kw / 2 - 0.3), 11.9, kz - 2 + i * 4, 0.12, 1.8, 1.2, m.darkWood, false); }  // window niches with grilles
    box(kx, 11.6, kz - kd / 2 + 0.05, 2.2, 0.3, 0.3, m.darkWood, false);                                            // door lintel beam
    const arch = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.2, 8, 18, Math.PI), m.darkWood); arch.position.set(kx, 11.55, kz - kd / 2 + 0.02); g.add(arch);
    const door = new THREE.Mesh(boxUV(new THREE.BoxGeometry(0.9, 2.5, 0.12), 0.9, 2.5, 0.12, 1.2), m.darkWood); door.position.set(kx - 1.2, 10.25, kz - kd / 2 - 0.1); door.rotation.y = 1.3; door.castShadow = !low; g.add(door);  // door leaf standing open
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(kw - 1.2, kd - 1.2), m.wood); floor.rotation.x = -Math.PI / 2; floor.position.set(kx, 9.02, kz); floor.receiveShadow = true; g.add(floor);
    const lamp = new THREE.PointLight(0xffb070, low ? 0 : 22, 16, 2); lamp.position.set(kx, 13.2, kz); g.add(lamp);
    for (const [lx, lz] of [[kx - 3, kz - 3], [kx + 3, kz + 3]]) { const ln = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.5, 8), m.lantern); ln.position.set(lx, 13.3, lz); this.props.add(ln); box(lx, 13.55, lz, 0.05, 2, 0.05, m.iron, false); }
    box(kx, 9, kz + 1.5, 1.2, 1.1, 0.8, m.darkWood, true, "lectern");
    const scroll = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.08, 0.7), m.plaster); scroll.position.set(kx, 10.14, kz + 1.5); scroll.rotation.x = 0.3; g.add(scroll);
    for (let i = 0; i < 3; i++) box(kx - 4.5 + i * 0.1, 9, kz - 2 + i * 1.6, 0.8, 1.5 + i * 0.3, 1.2, m.wood, true, "chest");
    for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), i % 2 ? m.rug : m.flag); c.position.set(kx + 2.5 + (i % 2) * 1.1, 9.17, kz + 2.5 + Math.floor(i / 2) * 1.1); this.props.add(c); }     // cushions
    const rug = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), m.rug); rug.rotation.x = -Math.PI / 2; rug.position.set(kx, 9.03, kz - 0.5); rug.receiveShadow = true; g.add(rug);
    this.stations.push({ id: "reading", pos: new THREE.Vector3(kx, 9, kz + 0.4), radius: 2.2, label: "📖 The text on the wall", hint: "Read the text again (E / tap)" });
    // --- market stall (shop between waves) ---
    box(-8, 9, 10, 4, 1.0, 1.4, m.darkWood, true, "stall");
    for (const sx of [-1, 1]) box(-8 + sx * 1.9, 9, 10.6, 0.15, 2.8, 0.15, m.darkWood, true);
    const awning = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.2), m.rug); awning.rotation.x = -Math.PI / 2 + 0.25; awning.position.set(-8, 11.8, 10.2); g.add(awning);
    for (let i = 0; i < 5; i++) { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.36, 10), i % 2 ? m.brass : m.ember); pot.position.set(-9.6 + i * 0.8, 10.18, 9.8); this.props.add(pot); }
    this.stations.push({ id: "shop", pos: new THREE.Vector3(-8, 9, 8.6), radius: 2.4, label: "🛒 The fort shop", hint: "Open the shop (E / tap)" });
    this.stations.push({ id: "lookout", pos: new THREE.Vector3(-14, 17, -11), radius: 2.0, label: "🔭 Lookout", hint: "Watch the bay" });
    // --- cannons: stations on the rampart, one per lane; cannonball piles beside them ---
    fort.cannons.forEach((c, lane) => { this.stations.push({ id: ("cannon" + lane) as Station["id"], pos: new THREE.Vector3(c.position.x, 17, c.position.z + 2.2), radius: 2.3, label: ["⬅️ West cannon", "⬆️ Middle cannon", "➡️ East cannon"][lane], hint: "Fire at the raider in this lane (E / tap)", marker: c }); col.addBox(c.position.x, 17, c.position.z, 1.8, 1.6, 2.6, "cannon");
      for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), m.ball); b.position.set(c.position.x + 1.6 + (i % 2) * 0.4, 17.2 + (i > 2 ? 0.35 : 0), c.position.z + 0.4 + (i > 2 ? 0.2 : Math.floor(i / 2) * 0.4)); this.props.add(b); } });
    // --- courtyard details ---
    box(0, 9, 15.6, 36, 1.3, 0.6, m.plaster, true, "backparapet");
    col.add([-40, 9, 15.9], [40, 30, 40], "boundary"); col.add([-40, 9, -40], [-18.5, 30, 40], "boundary"); col.add([18.5, 9, -40], [40, 30, 40], "boundary");
    col.addBox(-9, 9, 4, 0.8, 7, 0.8, "palm"); col.addBox(12, 9, -4, 0.8, 7, 0.8, "palm");
    const well = new THREE.Mesh(boxUV(new THREE.BoxGeometry(2.2, 0.9, 2.2), 2.2, 0.9, 2.2, 1.6), m.stone); well.position.set(9, 9.45, 11); well.castShadow = !low; g.add(well); col.addBox(9, 9, 11, 2.3, 0.9, 2.3, "well");
    box(9, 9.9, 11, 0.12, 2.0, 0.12, m.darkWood, false); box(9, 11.8, 11, 1.6, 0.12, 0.12, m.darkWood, false);
    for (let i = 0; i < 6; i++) { const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.22, 0.7, 10), m.ember); jar.position.set(13 + (i % 3) * 0.8, 9.35, 6 + Math.floor(i / 3) * 0.8); this.props.add(jar); }
    col.addBox(13.8, 9, 6.4, 2.6, 0.7, 1.6, "jars");
    // crates by the gate
    box(-4, 9, -10.5, 1.2, 1.0, 1.2, m.wood, true, "crate"); box(-2.6, 9, -10.8, 0.9, 0.7, 0.9, m.wood, true, "crate"); box(-4, 10, -10.5, 1.0, 0.8, 1.0, m.wood, true, "crate");
    // --- merge static geometry: one mesh per material ---
    for (const [mat, geos] of buckets) { const merged = mergeGeometries(geos, false)!; const mesh = new THREE.Mesh(merged, mat); mesh.castShadow = !low; mesh.receiveShadow = true; mesh.name = "Static"; g.add(mesh); }
    // --- distant Dhofar mountains (behind the fort and to the sides) and a few clouds ---
    const peaks: THREE.BufferGeometry[] = []; let seed = 3;
    const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 26; i++) { const a = 0.25 + (i / 26) * (Math.PI - 0.5); const dist = 360 + r() * 140; const h = 50 + r() * 110; const w = 70 + r() * 90; const cone = new THREE.ConeGeometry(w, h, 6 + Math.floor(r() * 3)); cone.rotateY(r() * 6.28); cone.translate(Math.cos(a) * dist, h / 2 - 6, Math.sin(a) * dist + 40); peaks.push(cone); }
    const mountains = new THREE.Mesh(mergeGeometries(peaks, false)!, m.mountain); mountains.name = "Mountains"; mountains.frustumCulled = false; g.add(mountains);
    for (let i = 0; i < 7; i++) { const s = new THREE.Sprite(m.cloud); s.position.set(-220 + i * 75, 120 + (i % 3) * 25, -160 - (i % 2) * 90); s.scale.set(160 + (i % 3) * 40, 60, 1); this.clouds.push(s); g.add(s); }
    // station markers: floating rings
    for (const s of this.stations) { const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.85, 20), new THREE.MeshBasicMaterial({ color: 0xffd36b, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false })); ring.rotation.x = -Math.PI / 2; ring.position.copy(s.pos).add(new THREE.Vector3(0, 0.05, 0)); ring.name = "Marker_" + s.id; g.add(ring); if (!s.marker) s.marker = ring; }
  }
  nearest(p: THREE.Vector3): Station | null { let best: Station | null = null, bd = 1e9; for (const s of this.stations) { const d = Math.hypot(p.x - s.pos.x, p.z - s.pos.z); if (d < s.radius && Math.abs(p.y - s.pos.y) < 2.5 && d < bd) { bd = d; best = s; } } return best; }
  update(t: number): void { for (const s of this.stations) { const m = s.marker; if (m && m.name && m.name.startsWith("Marker_")) { m.position.y = s.pos.y + 0.08 + Math.sin(t * 2 + s.pos.x) * 0.04; m.rotation.z = t * 0.6; } } for (let i = 0; i < this.clouds.length; i++) this.clouds[i].position.x += 0.004 + Math.sin(i) * 0.002; }
}
