import * as THREE from "three";

// Animated sea: a large plane whose vertices ride two crossing wave trains in the vertex shader; colour blends from deep
// teal to a lighter crest tone by height, with a fresnel-like brightening toward the horizon and fog applied.
export class Sea {
  readonly mesh: THREE.Mesh;
  private readonly uniforms = { uTime: { value: 0 }, deep: { value: new THREE.Color(0x12515c) }, crest: { value: new THREE.Color(0x4fa3ad) }, sky: { value: new THREE.Color(0xd8e6ea) },
    fogColor: { value: new THREE.Color(0xc9dbe0) }, fogNear: { value: 120 }, fogFar: { value: 520 } };
  constructor(low: boolean) {
    const seg = low ? 48 : 110;
    const geo = new THREE.PlaneGeometry(700, 700, seg, seg); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, transparent: false,
      vertexShader: `uniform float uTime; varying float vH; varying vec3 vP; varying vec3 vN;
        void main(){ vec3 p = position; float w1 = sin(p.x*0.09 + uTime*1.1) * 0.55; float w2 = sin(p.z*0.13 - uTime*0.9 + p.x*0.03) * 0.35; float w3 = sin((p.x+p.z)*0.21 + uTime*1.7) * 0.12;
          p.y += w1 + w2 + w3; vH = (w1 + w2 + w3) / 1.02; vP = (modelMatrix * vec4(p,1.0)).xyz;
          float dx = cos(p.x*0.09 + uTime*1.1)*0.55*0.09 + cos((p.x+p.z)*0.21 + uTime*1.7)*0.12*0.21; float dz = cos(p.z*0.13 - uTime*0.9 + p.x*0.03)*0.35*0.13 + cos((p.x+p.z)*0.21 + uTime*1.7)*0.12*0.21;
          vN = normalize(vec3(-dx, 1.0, -dz)); gl_Position = projectionMatrix * viewMatrix * vec4(vP, 1.0); }`,
      fragmentShader: `uniform vec3 deep, crest, sky, fogColor; uniform float fogNear, fogFar; varying float vH; varying vec3 vP; varying vec3 vN;
        void main(){ vec3 v = normalize(cameraPosition - vP); float fres = pow(1.0 - max(dot(v, vN), 0.0), 3.0);
          vec3 c = mix(deep, crest, clamp(vH*0.5+0.5, 0.0, 1.0)); c = mix(c, sky, fres*0.55);
          vec3 l = normalize(vec3(-0.6, 0.45, -0.4)); float spec = pow(max(dot(reflect(-l, vN), v), 0.0), 60.0); c += vec3(1.0, 0.95, 0.8) * spec * 0.6;
          float d = length(cameraPosition - vP); float f = clamp((d - fogNear) / (fogFar - fogNear), 0.0, 1.0); c = mix(c, fogColor, f); gl_FragColor = vec4(c, 1.0); }`,
    });
    this.mesh = new THREE.Mesh(geo, mat); this.mesh.name = "Sea"; this.mesh.position.y = 0; this.mesh.receiveShadow = false;
  }
  update(t: number): void { this.uniforms.uTime.value = t; }
  heightAt(x: number, z: number, t: number): number {
    return Math.sin(x * 0.09 + t * 1.1) * 0.55 + Math.sin(z * 0.13 - t * 0.9 + x * 0.03) * 0.35 + Math.sin((x + z) * 0.21 + t * 1.7) * 0.12;
  }
}
