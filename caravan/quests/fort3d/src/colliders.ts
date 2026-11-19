import * as THREE from "three";

// Axis-aligned solid boxes. The player is an upright box (half-width r, height h) whose feet are at pos.y.
// Movement is resolved per axis with a step-up so stairs made of small boxes are climbable.
export interface Box { min: THREE.Vector3; max: THREE.Vector3; tag?: string }

export class Colliders {
  readonly boxes: Box[] = [];
  add(min: THREE.Vector3 | number[], max: THREE.Vector3 | number[], tag?: string): Box {
    const b: Box = { min: Array.isArray(min) ? new THREE.Vector3(...min) : min.clone(), max: Array.isArray(max) ? new THREE.Vector3(...max) : max.clone(), tag };
    // normalise so min <= max on every axis
    for (const k of ["x", "y", "z"] as const) if (b.min[k] > b.max[k]) { const t = b.min[k]; b.min[k] = b.max[k]; b.max[k] = t; }
    this.boxes.push(b); return b;
  }
  // box at centre (x,y,z) with size (w,h,d) — y is the bottom
  addBox(x: number, yBottom: number, z: number, w: number, h: number, d: number, tag?: string): Box { return this.add([x - w / 2, yBottom, z - d / 2], [x + w / 2, yBottom + h, z + d / 2], tag); }
  // from a mesh's world-space bounding box
  addMesh(m: THREE.Object3D, tag?: string, shrink = 0): Box { const bb = new THREE.Box3().setFromObject(m); bb.min.addScalar(shrink); bb.max.subScalar(shrink); return this.add(bb.min, bb.max, tag); }

  overlaps(px: number, py: number, pz: number, r: number, h: number, skip?: Box): Box | null {
    for (const b of this.boxes) { if (b === skip) continue; if (px + r <= b.min.x || px - r >= b.max.x || pz + r <= b.min.z || pz - r >= b.max.z || py + h <= b.min.y || py >= b.max.y) continue; return b; }
    return null;
  }
  // highest box top under the footprint that is at or below py+tolerance (for ground snapping)
  groundAt(px: number, py: number, pz: number, r: number, tol: number): number | null {
    let best: number | null = null;
    for (const b of this.boxes) { if (px + r <= b.min.x || px - r >= b.max.x || pz + r <= b.min.z || pz - r >= b.max.z) continue; if (b.max.y <= py + tol && (best === null || b.max.y > best)) best = b.max.y; }
    return best;
  }
  // Move the player by (dx, dz) horizontally with step-up, then by dy vertically. Returns the new position and flags.
  move(pos: THREE.Vector3, dx: number, dz: number, dy: number, r: number, h: number, stepUp: number): { grounded: boolean; hitWall: boolean; hitHead: boolean } {
    let hitWall = false;
    for (const [ax, d] of [["x", dx], ["z", dz]] as const) {
      if (!d) continue; const nx = pos.x + (ax === "x" ? d : 0), nz = pos.z + (ax === "z" ? d : 0);
      if (!this.overlaps(nx, pos.y + 0.02, nz, r, h - 0.02)) { pos.x = nx; pos.z = nz; continue; }
      // try stepping up onto a low obstacle
      let stepped = false;
      for (let s = 0.1; s <= stepUp + 1e-6; s += 0.1) { if (!this.overlaps(nx, pos.y + s, nz, r, h - 0.02)) { pos.x = nx; pos.z = nz; pos.y += s; stepped = true; break; } }
      if (!stepped) hitWall = true;
    }
    let grounded = false, hitHead = false;
    if (dy < 0) { const ny = pos.y + dy; const g = this.groundAt(pos.x, pos.y, pos.z, r, 0.001); if (g !== null && ny <= g) { pos.y = g; grounded = true; } else pos.y = ny; }
    else if (dy > 0) { const ny = pos.y + dy; if (this.overlaps(pos.x, ny + h - 0.05, pos.z, r, 0.05)) hitHead = true; else pos.y = ny; }
    else { const g = this.groundAt(pos.x, pos.y, pos.z, r, 0.001); if (g !== null && Math.abs(g - pos.y) < 0.02) { pos.y = g; grounded = true; } }
    return { grounded, hitWall, hitHead };
  }
}
