import * as THREE from "three";
import { Mats, boxUV } from "./materials";

// The fort on its headland: curtain wall with crenellations, two round towers, a gate, a flag that waves, and the cannon
// on the rampart that turns toward the raider being answered. All geometry is procedural (no downloads).
export class Fort {
  readonly group = new THREE.Group();
  readonly cannons: THREE.Group[] = [];
  readonly muzzles: THREE.Object3D[] = [];
  get cannon(): THREE.Group { return this.cannons[1]; }
  get muzzle(): THREE.Object3D { return this.muzzles[1]; }
  readonly shield: THREE.Mesh;
  private readonly flag: THREE.Mesh;
  private readonly flagBase: Float32Array;
  private readonly cracks: THREE.Mesh[] = [];
  private smokeTimer = 0;

  constructor(m: Mats, low: boolean, hollowKeep = false) {
    const g = this.group; g.name = "Fort";
    // headland rock: a lumpy cylinder sitting in the sea
    const rock = new THREE.Mesh(new THREE.CylinderGeometry(26, 34, 9, 18, 3), m.rock); rock.position.y = 3.5; this.lump(rock.geometry, 1.6); rock.receiveShadow = true; rock.castShadow = !low; rock.name = "Headland"; g.add(rock);
    const sand = new THREE.Mesh(new THREE.CylinderGeometry(22, 26, 1.2, 18), m.sand); sand.position.y = 8.4; sand.receiveShadow = true; g.add(sand);
    // curtain wall facing the sea (the player looks from behind it, -z is the sea)
    const wall = new THREE.Mesh(boxUV(new THREE.BoxGeometry(34, 8, 3), 34, 8, 3, 1.6), m.stone); wall.position.set(0, 13, -14); wall.castShadow = !low; wall.receiveShadow = true; wall.name = "Wall"; g.add(wall);
    for (let i = -8; i <= 8; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.3, 3.2), m.stone); c.position.set(i * 2, 17.65, -14); c.castShadow = !low; g.add(c); }
    const walk = new THREE.Mesh(boxUV(new THREE.BoxGeometry(34, 0.6, 5), 34, 0.6, 5, 2.4), m.plaster); walk.position.set(0, 16.7, -11.5); walk.receiveShadow = true; g.add(walk);
    // side walls and towers
    for (const sx of [-1, 1]) {
      const side = new THREE.Mesh(boxUV(new THREE.BoxGeometry(3, 7, 22), 3, 7, 22, 1.6), m.stone); side.position.set(sx * 17, 12.5, -3); side.castShadow = !low; side.receiveShadow = true; g.add(side);
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 14, 16), m.plaster); tower.position.set(sx * 17.5, 16, -14); tower.castShadow = !low; tower.receiveShadow = true; tower.name = "Tower"; g.add(tower);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; const c = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.1, 1.1), m.plaster); c.position.set(sx * 17.5 + Math.cos(a) * 4.2, 23.5, -14 + Math.sin(a) * 4.2); c.rotation.y = -a; g.add(c); }
      const ring = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.6, 16), m.darkWood); ring.position.set(sx * 17.5, 22.7, -14); g.add(ring);
    }
    // gate in the wall with an arch of darker stone
    const gate = new THREE.Mesh(new THREE.BoxGeometry(4.2, 5, 3.4), m.darkWood); gate.position.set(0, 11.5, -14); g.add(gate);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.5, 8, 16, Math.PI), m.plaster); arch.position.set(0, 14, -12.3); g.add(arch);
    // inner keep behind the wall
    if (!hollowKeep) { const keep = new THREE.Mesh(new THREE.BoxGeometry(12, 10, 10), m.plaster); keep.position.set(5, 14, 2); keep.castShadow = !low; keep.receiveShadow = true; keep.name = "Keep"; g.add(keep); }
    for (let i = -2; i <= 2; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.2), m.plaster); c.position.set(5 + i * 2.4, 19.5, -2.9); g.add(c); }
    const palm = this.palm(m); palm.position.set(-9, 9, 4); g.add(palm); const palm2 = this.palm(m); palm2.position.set(12, 9, -4); palm2.rotation.y = 2; g.add(palm2);
    // flag on the left tower
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 7, 6), m.iron); pole.position.set(-17.5, 26.5, -14); g.add(pole);
    const fg = new THREE.PlaneGeometry(4, 2.4, 10, 5); fg.translate(2, 0, 0); this.flag = new THREE.Mesh(fg, m.flag); this.flag.position.set(-17.4, 28.5, -14); this.flag.name = "Flag"; g.add(this.flag);
    this.flagBase = (fg.attributes.position.array as Float32Array).slice();
    // cannons on the rampart: one per raider lane (west, middle, east)
    for (const cx of [-11, 0, 11]) { const cannon = new THREE.Group(), muzzle = new THREE.Object3D();
      const car = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 2.4), m.darkWood); car.position.y = 0.5; cannon.add(car);
      for (const sx of [-1, 1]) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 12), m.wood); w.rotation.z = Math.PI / 2; w.position.set(sx * 0.95, 0.5, 0.4); cannon.add(w); }
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 3.2, 14), m.iron); barrel.rotation.x = -Math.PI / 2 + 0.18; barrel.position.set(0, 1.15, -0.6); barrel.castShadow = !low; cannon.add(barrel);
      muzzle.position.set(0, 1.45, -2.2); cannon.add(muzzle); cannon.position.set(cx, 17, -12); cannon.name = "Cannon"; g.add(cannon); this.cannons.push(cannon); this.muzzles.push(muzzle); }
    // shield dome (guardian perk), hidden unless active
    this.shield = new THREE.Mesh(new THREE.SphereGeometry(27, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), m.shield); this.shield.position.y = 9; this.shield.visible = false; this.shield.name = "Shield"; g.add(this.shield);
  }
  private lump(geo: THREE.BufferGeometry, amp: number): void { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (Math.abs(y) < 4) { const a = Math.atan2(p.getZ(i), p.getX(i)); const r = 1 + Math.sin(a * 5 + y) * 0.06 + Math.sin(a * 13) * 0.03; p.setX(i, p.getX(i) * r); p.setZ(i, p.getZ(i) * r); p.setY(i, y + Math.sin(a * 7) * amp * 0.2); } } geo.computeVertexNormals(); }
  private palm(m: Mats): THREE.Group {
    const g = new THREE.Group(); const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 7, 7), m.wood); trunk.position.y = 3.5; g.add(trunk);
    for (let i = 0; i < 7; i++) { const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4, 4), m.green); leaf.position.set(0, 7, 0); leaf.rotation.z = Math.PI / 2 - 0.5; leaf.rotation.y = i / 7 * Math.PI * 2; leaf.position.x = Math.cos(i / 7 * Math.PI * 2) * 1.6; leaf.position.z = Math.sin(i / 7 * Math.PI * 2) * 1.6; leaf.lookAt(leaf.position.clone().multiplyScalar(3).setY(5.5)); g.add(leaf); }
    return g;
  }
  // wall damage shown as dark cracks and a smouldering patch; wall is 0..100
  setDamage(wall: number, scene: THREE.Scene, m: Mats): void {
    const want = wall >= 100 ? 0 : wall >= 70 ? 1 : wall >= 40 ? 2 : 3;
    // scorch marks on the rampart walk (what the camera sees) plus a dark gash on the inner face
    while (this.cracks.length < want) { const i = this.cracks.length; const c = new THREE.Mesh(new THREE.CircleGeometry(2.4 + i * 0.5, 14), new THREE.MeshBasicMaterial({ color: 0x241a12, transparent: true, opacity: 0.8 })); c.position.set(-10 + i * 8, 17.03, -11.6); c.rotation.x = -Math.PI / 2; c.name = "Crack";
      const ember = new THREE.Mesh(new THREE.CircleGeometry(0.9, 10), m.ember); ember.position.z = 0.01; c.add(ember);
      const gash = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 3.4), new THREE.MeshBasicMaterial({ color: 0x1a120c })); gash.position.set(0, -4.5, -0.9); gash.rotation.x = Math.PI / 2; gash.rotation.z = (i - 1) * 0.3; c.add(gash);
      this.group.add(c); this.cracks.push(c); }
    while (this.cracks.length > want) { const c = this.cracks.pop()!; this.group.remove(c); }
  }
  aimAt(target: THREE.Vector3 | null, dt: number, lane = 1): void {
    if (!target) return; const c = this.cannons[lane] || this.cannon; const dx = target.x - c.position.x, dz = target.z - c.position.z; const yaw = Math.atan2(-dx, -dz);
    let d = yaw - c.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); c.rotation.y += d * Math.min(1, dt * 4);
  }
  update(t: number, dt: number, shield: boolean): void {
    const p = this.flag.geometry.attributes.position as THREE.BufferAttribute; const b = this.flagBase;
    for (let i = 0; i < p.count; i++) { const x = b[i * 3]; p.setZ(i, Math.sin(x * 1.6 - t * 6) * 0.22 * x + Math.sin(x * 3 + t * 9) * 0.06 * x); p.setY(i, b[i * 3 + 1] + Math.sin(x * 1.2 - t * 5) * 0.05 * x); }
    p.needsUpdate = true; this.flag.geometry.computeVertexNormals();
    this.shield.visible = shield; if (shield) { const s = 1 + Math.sin(t * 2.5) * 0.015; this.shield.scale.setScalar(s); (this.shield.material as THREE.MeshBasicMaterial).opacity = 0.14 + Math.sin(t * 3) * 0.05; }
    this.smokeTimer += dt;
  }
  muzzleWorld(out: THREE.Vector3, lane = 1): THREE.Vector3 { return (this.muzzles[lane] || this.muzzle).getWorldPosition(out); }
}
