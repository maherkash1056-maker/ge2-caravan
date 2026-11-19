// The slice of the fort game's state (object `F` in caravan/quests/fort.js) that the 3D view reads. The view never writes it.
export interface Raider {
  x: number;        // 1 = horizon, 0 = the wall
  lane: number;     // 0..2
  n: number;        // raider number shown to the player
  gone: boolean;    // sunk or reached the wall
  sunk?: boolean;   // set by fort.js when the cannon got it
  reached?: boolean;// set by fort.js when it hit the wall
}
export interface Shot { x: number; lane: number; t: number } // t = performance.now() when fired; fort.js keeps shots ~700 ms
export interface FortState {
  raiders: Raider[];
  shots: Shot[];
  hit?: number;     // performance.now() of the last wall hit
  wall: number;     // 0..100
  cur: Raider | null;
  hero: string;     // "commander" | "guardian"
  shield: number;
  combo: number;
  over: boolean;
  paused?: boolean;
  fort: [string, string, string];
}
export interface MountOptions { fort?: string; hero?: string; quality?: "high" | "low" }
export interface FortView {
  update(now: number, state: FortState): void;
  resize(): void;
  dispose(): void;
  debug(): Record<string, unknown>;
}
