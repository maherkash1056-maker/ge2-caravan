import * as THREE from "three";

// Renderer, camera, lights, sky and fog for the fort. One instance per mounted view.
export class FortScene {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;
  readonly sun: THREE.DirectionalLight;
  readonly canvas: HTMLCanvasElement;
  private readonly container: HTMLElement;
  private readonly low: boolean;

  constructor(container: HTMLElement, low: boolean, fov = 42, near = 0.5) {
    this.container = container; this.low = low;
    this.canvas = document.createElement("canvas"); this.canvas.id = "fcv3d"; this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:none";
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: !low, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1 : 1.5));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = !low; this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, 900);
    // late-afternoon khareef light: warm sun low over the sea, cool mist in the distance
    this.scene.background = new THREE.Color(0xd9c3a0);
    this.scene.fog = new THREE.Fog(0xdcc6a4, 140, 520);
    const hemi = new THREE.HemisphereLight(0xdfeaf2, 0x6d6a55, 0.75); this.scene.add(hemi);
    this.sun = new THREE.DirectionalLight(0xfff0d0, 2.6); this.sun.position.set(-60, 70, -40);
    this.sun.castShadow = !low; this.sun.shadow.mapSize.set(low ? 512 : 1024, low ? 512 : 1024);
    Object.assign(this.sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 10, far: 220 });
    this.sun.shadow.bias = -0.0005; this.sun.shadow.normalBias = 0.03;
    this.scene.add(this.sun, this.sun.target);
    this.scene.add(this.makeSky());
  }
  private makeSky(): THREE.Mesh {
    const geo = new THREE.SphereGeometry(800, 24, 12);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x3a5f93) }, mid: { value: new THREE.Color(0xd9a57c) }, horizon: { value: new THREE.Color(0xf3cf8e) }, sunDir: { value: new THREE.Vector3(-0.6, 0.3, -0.75).normalize() } },
      vertexShader: "varying vec3 vW; void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top, mid, horizon, sunDir; varying vec3 vW; void main(){ float h = clamp(vW.y, 0.0, 1.0); vec3 c = h < 0.18 ? mix(horizon, mid, h / 0.18) : mix(mid, top, pow((h - 0.18) / 0.82, 0.6)); float s = pow(max(dot(vW, sunDir), 0.0), 40.0); c += vec3(1.0, 0.8, 0.5) * s * 1.1; float cl = sin(vW.x * 9.0 + vW.y * 23.0) * sin(vW.z * 7.0 - vW.y * 15.0); c = mix(c, vec3(0.95, 0.82, 0.74), smoothstep(0.55, 0.9, cl) * smoothstep(0.05, 0.25, h) * 0.5); gl_FragColor = vec4(c, 1.0); }",
    });
    const m = new THREE.Mesh(geo, mat); m.name = "Sky"; m.frustumCulled = false; return m;
  }
  mount(): void { this.container.appendChild(this.canvas); this.resize(); }
  resize(): void {
    const w = Math.max(1, this.container.clientWidth), h = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
  }
  render(): void { this.renderer.render(this.scene, this.camera); }
  dispose(): void { this.renderer.dispose(); this.canvas.remove(); }
}
