/* Wadi Snakes — 3D renderer (three.js). Draws under the 2D canvas, which keeps names and HUD. Falls back to 2D on weak WebGL / low FPS. */
const R3={on:false,tried:false,theme:"paper",fps:[],badSince:0,user:null,
 init(){ if(this.tried)return this.on;this.tried=true;
  try{ if(typeof THREE==="undefined")throw new Error("no three");
   const c=document.createElement("canvas");c.id="arena3d";c.style.cssText="position:fixed;inset:0;width:100%;height:100%;z-index:0;touch-action:none";
   const gl=c.getContext("webgl2",{antialias:true,powerPreference:"high-performance"})||c.getContext("webgl",{antialias:true});if(!gl)throw new Error("no webgl");
   this.renderer=new THREE.WebGLRenderer({canvas:c,context:gl,antialias:true});this.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.shadowMap.enabled=false;
   this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(42,1,10,4000);
   this.hemi=new THREE.HemisphereLight(0xfff4dc,0x8a6a3a,1.1);this.scene.add(this.hemi);this.sun=new THREE.DirectionalLight(0xfff0d0,1.6);this.sun.position.set(300,700,200);this.scene.add(this.sun);this.lamp=new THREE.PointLight(0xffd27a,0,520,1.6);this.scene.add(this.lamp);
   this.tex={};for(const k in SKINTEX){const t=new THREE.TextureLoader().load(SKINTEX[k].tile);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;this.tex[k]=t;}
   this.mat={};for(const k in SKIN){const t=this.tex[SKIN[k]?k:"masar"]||this.tex.masar;this.mat[k]=new THREE.MeshStandardMaterial({map:t,roughness:k==="halwa"||k==="khareef"?0.35:0.7,metalness:k==="halwa"?0.15:0.02});this.mat[k+"_ghost"]=new THREE.MeshStandardMaterial({map:t,transparent:true,opacity:0.45,roughness:0.6});}
   this.ringMat={};for(const k in SKINTEX){if(SKINTEX[k].ringc)this.ringMat[k]=new THREE.MeshStandardMaterial({color:new THREE.Color(SKINTEX[k].ringc),roughness:0.35,metalness:0.6});}
   this.eyeW=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.3});this.eyeB=new THREE.MeshStandardMaterial({color:0x1a0f08,roughness:0.2});this.gold=new THREE.MeshStandardMaterial({color:0xd9a441,roughness:0.3,metalness:0.7});
   this.hatMat={omani:new THREE.MeshStandardMaterial({color:0x8c2f22,roughness:0.8}),dhofari:new THREE.MeshStandardMaterial({color:0x1e5a44,roughness:0.8}),rose:new THREE.MeshStandardMaterial({color:0xe2548f,roughness:0.6}),dallah:this.gold,mist:new THREE.MeshStandardMaterial({color:0xffffff,transparent:true,opacity:0.5,roughness:1})};
   this.geoSphere=new THREE.SphereGeometry(1,14,10);this.geoTorus=new THREE.TorusGeometry(1,0.22,8,24);this.geoCone=new THREE.ConeGeometry(1,1.6,10);
   this.foodMat=[0xb7432d,0xe0b046,0x2f6f69,0x7b5ea7,0xd97a3a].map(c=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:0.35,roughness:0.4}));
   this.foodMesh=new THREE.InstancedMesh(this.geoSphere,new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xffffff,emissiveIntensity:0.25,roughness:0.4}),400);this.foodMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);this.scene.add(this.foodMesh);this.foodCol=new THREE.Color();
   this.ground=null;this.snakeObjs=new Map();this.tmpM=new THREE.Matrix4();this.tmpV=new THREE.Vector3();
   this.buildGround(1800);
   const host=document.getElementById("game");host.insertBefore(c,host.firstChild);this.canvas=c;this.on=true;this.resize();return true;
  }catch(e){console.warn("3D off:",e.message);this.on=false;return false;}},
 buildGround(size){ if(this.ground){this.scene.remove(this.ground);this.ground.geometry.dispose();this.ground.material.map&&this.ground.material.map.dispose();this.ground.material.dispose();}
  const night=this.theme==="night";const cv=document.createElement("canvas");cv.width=cv.height=1024;const g=cv.getContext("2d");g.fillStyle=night?"#1a1f2b":"#efe2c3";g.fillRect(0,0,1024,1024);g.strokeStyle=night?"rgba(255,255,255,.08)":"#d8c39c";g.lineWidth=2;const step=1024/(size/150);for(let x=0;x<=1024;x+=step){g.beginPath();g.moveTo(x,0);g.lineTo(x,1024);g.stroke();g.beginPath();g.moveTo(0,x);g.lineTo(1024,x);g.stroke();}
  if(!night){g.fillStyle="rgba(120,80,30,.05)";for(let i=0;i<900;i++){g.beginPath();g.arc(Math.random()*1024,Math.random()*1024,Math.random()*18,0,7);g.fill();}}
  const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),new THREE.MeshStandardMaterial({map:t,roughness:1}));m.rotation.x=-Math.PI/2;m.position.set(size/2,0,-size/2);this.scene.add(m);this.ground=m;this.groundSize=size;
  if(this.wall){this.scene.remove(this.wall);}const wm=new THREE.MeshStandardMaterial({color:night?0xd9a441:0xb7432d,emissive:night?0xd9a441:0x000000,emissiveIntensity:night?0.6:0,roughness:0.6});const wg=new THREE.BoxGeometry(1,8,6);this.wall=new THREE.Group();for(let i=0;i<4;i++){const e=new THREE.Mesh(wg,wm);this.wall.add(e);}this.scene.add(this.wall);this.setWall(0,size);
  this.scene.background=new THREE.Color(night?0x0d1018:0xe9d9b6);this.scene.fog=new THREE.Fog(night?0x0d1018:0xe9d9b6,900,2100);this.hemi.intensity=night?0.7:1.1;this.sun.intensity=night?0.7:1.6;this.lamp.intensity=night?4:0;},
 setWall(margin,size){const L=size-2*margin,c=size/2;const es=this.wall.children;es[0].position.set(c,4,-margin);es[0].scale.set(L,1,1);es[1].position.set(c,4,-(size-margin));es[1].scale.set(L,1,1);es[2].position.set(margin,4,-c);es[2].rotation.y=Math.PI/2;es[2].scale.set(L,1,1);es[3].position.set(size-margin,4,-c);es[3].rotation.y=Math.PI/2;es[3].scale.set(L,1,1);},
 setTheme(v){v=v==="night"?"night":"paper";if(v===this.theme&&this.ground)return;this.theme=v;if(this.on)this.buildGround(this.groundSize||1800);},
 resize(){if(!this.on)return;const w=innerWidth,h=innerHeight;this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();},
 snakeObj(s){let o=this.snakeObjs.get(s.id);if(!o){o={grp:new THREE.Group(),tube:null,skin:null,head:new THREE.Group(),rings:[]};
   const h=o.head;const sph=new THREE.Mesh(this.geoSphere,this.mat.masar);sph.name="skull";h.add(sph);for(const sd of[-1,1]){const e=new THREE.Mesh(this.geoSphere,this.eyeW);e.scale.setScalar(0.3);e.position.set(0.5,0.45,sd*0.55);h.add(e);const p=new THREE.Mesh(this.geoSphere,this.eyeB);p.scale.setScalar(0.14);p.position.set(0.74,0.5,sd*0.56);h.add(p);}
   o.grp.add(h);this.scene.add(o.grp);this.snakeObjs.set(s.id,o);}
  if(o.skin!==s.skin){o.skin=s.skin;const k=SKIN[s.skin]?s.skin:"masar";o.head.getObjectByName("skull").material=this.mat[k];if(o.hat){o.head.remove(o.hat);o.hat=null;}const hat=SKIN[k].hat;let m=null;
   if(hat==="omani"||hat==="dhofari"){m=new THREE.Group();const cap=new THREE.Mesh(this.geoSphere,this.hatMat[hat]);cap.scale.set(0.95,0.55,0.95);cap.position.y=0.55;m.add(cap);const ring=new THREE.Mesh(this.geoTorus,this.gold);ring.scale.setScalar(0.9);ring.rotation.x=Math.PI/2;ring.position.y=0.5;m.add(ring);}
   else if(hat==="rose"){m=new THREE.Group();for(let i=0;i<5;i++){const p=new THREE.Mesh(this.geoSphere,this.hatMat.rose);p.scale.setScalar(0.42);const t=i/5*Math.PI*2;p.position.set(Math.cos(t)*0.45,0.95,Math.sin(t)*0.45);m.add(p);}const c=new THREE.Mesh(this.geoSphere,new THREE.MeshStandardMaterial({color:0xf6a2c4}));c.scale.setScalar(0.35);c.position.y=1.05;m.add(c);}
   else if(hat==="dallah"){m=new THREE.Group();const pot=new THREE.Mesh(this.geoSphere,this.gold);pot.scale.set(0.5,0.6,0.5);pot.position.y=1.05;m.add(pot);const lid=new THREE.Mesh(this.geoCone,this.gold);lid.scale.setScalar(0.3);lid.position.y=1.75;m.add(lid);const spout=new THREE.Mesh(this.geoCone,this.gold);spout.scale.set(0.12,0.5,0.12);spout.rotation.z=-1.1;spout.position.set(0.45,1.35,0);m.add(spout);}
   else if(hat==="mist"){m=new THREE.Group();for(const d of[-0.7,0,0.7]){const c=new THREE.Mesh(this.geoTorus,this.hatMat.mist);c.scale.setScalar(0.9);c.rotation.x=Math.PI/2;c.position.set(-0.3,0.9+Math.abs(d)*0.2,d*0.9);m.add(c);}}
   if(m){o.hat=m;o.head.add(m);}}
  return o;},
 frame(snakes,food,myId,headOf,cam,margin,ARENA){
  if(!this.on)return;const t0=performance.now();
  if(this.groundSize!==ARENA)this.buildGround(ARENA);this.setWall(margin,ARENA);
  const vh=Math.max(1,innerHeight),vw=Math.max(1,innerWidth);const dist=370/(2*Math.tan(this.camera.fov/2*Math.PI/180))*Math.max(1,vh/Math.min(vw,vh));
  this.camera.position.set(cam.x,dist,-(cam.y)+dist*0.28);this.camera.lookAt(cam.x,0,-cam.y);this.lamp.position.set(cam.x,120,-cam.y);
  // food
  let n=0;for(const f of food.values()){if(n>=400)break;const bob=Math.sin(t0/300+f[0])*2;this.tmpM.makeScale(7,7,7);this.tmpM.setPosition(f[1],7+bob,-f[2]);this.foodMesh.setMatrixAt(n,this.tmpM);this.foodMesh.setColorAt(n,this.foodCol.set(this.foodMat[f[3]%5].color));n++;}
  this.foodMesh.count=n;this.foodMesh.instanceMatrix.needsUpdate=true;if(this.foodMesh.instanceColor)this.foodMesh.instanceColor.needsUpdate=true;
  // snakes
  const alive=new Set();
  for(const s of snakes.values()){if(s.st==="dead"||!s.path.length)continue;alive.add(s.id);const o=this.snakeObj(s);const k=SKIN[s.skin]?s.skin:"masar";const r=6+Math.min(10,s.len*0.06);
   const pts=[];const p=s.path;for(let i=0,j=p.length-1;i<s.len&&j>=0;i++,j-=2)pts.push(p[j]);const head=headOf(s);
   const v=[new THREE.Vector3(head[0],r,-head[1])];for(const q of pts)v.push(new THREE.Vector3(q[0],r,-q[1]));
   if(v.length>=2){const curve=new THREE.CatmullRomCurve3(v,false,"catmullrom",0.5);const segs=Math.min(96,Math.max(8,v.length*2));const g=new THREE.TubeGeometry(curve,segs,r,10,false);
    if(o.tube){o.tube.geometry.dispose();o.tube.geometry=g;}else{o.tube=new THREE.Mesh(g,this.mat[k]);o.grp.add(o.tube);}
    o.tube.material=(s.flags&8)?this.mat[k+"_ghost"]:this.mat[k];const map=o.tube.material.map;if(map)map.repeat.set(Math.max(1,Math.round(curve.getLength()/(r*5))),1);
    // rings
    const rm=this.ringMat[k];const want=rm?Math.min(12,Math.floor(v.length/5)):0;while(o.rings.length<want){const ring=new THREE.Mesh(this.geoTorus,rm);o.grp.add(ring);o.rings.push(ring);}
    for(let i=0;i<o.rings.length;i++){const ring=o.rings[i];if(i<want){const u=(i+1)/(want+1);const P=curve.getPointAt(u),T=curve.getTangentAt(u);ring.visible=true;ring.position.copy(P);ring.scale.setScalar(r*1.02);ring.lookAt(P.clone().add(T));}else ring.visible=false;}
   }
   const H=o.head;H.position.set(head[0]+Math.cos(s.a)*r*0.5,r*1.05,-(head[1]+Math.sin(s.a)*r*0.5));H.scale.setScalar(r*1.8);H.rotation.set(0,-s.a,0);
   if(o.shield!==!!(s.flags&2)){o.shield=!!(s.flags&2);if(o.shield){if(!o.shieldM){o.shieldM=new THREE.Mesh(this.geoTorus,new THREE.MeshStandardMaterial({color:0x2f6f69,emissive:0x2f6f69,emissiveIntensity:0.6,transparent:true,opacity:0.8}));o.shieldM.rotation.x=Math.PI/2;o.grp.add(o.shieldM);}o.shieldM.visible=true;}else if(o.shieldM)o.shieldM.visible=false;}
   if(o.shieldM&&o.shieldM.visible){o.shieldM.position.set(head[0],2,-head[1]);o.shieldM.scale.setScalar(r*2);o.shieldM.rotation.z=t0/400;}
   if(s.flags&1){if(!o.boostM){o.boostM=new THREE.Mesh(this.geoSphere,new THREE.MeshStandardMaterial({color:0xe0b046,emissive:0xe0b046,emissiveIntensity:0.9,transparent:true,opacity:0.35}));o.grp.add(o.boostM);}o.boostM.visible=true;o.boostM.position.copy(H.position);o.boostM.scale.setScalar(r*2.4);}else if(o.boostM)o.boostM.visible=false;
  }
  for(const [id,o] of this.snakeObjs){if(!alive.has(id)){this.scene.remove(o.grp);if(o.tube)o.tube.geometry.dispose();this.snakeObjs.delete(id);}}
  this.renderer.render(this.scene,this.camera);
  // fps watchdog: 3 s under 22 fps → fall back to 2D
  const dt=performance.now()-t0;this.fps.push(dt);if(this.fps.length>60)this.fps.shift();if(this.fps.length===60){const avg=this.fps.reduce((a,b)=>a+b,0)/60;if(avg>45){this.badSince=this.badSince||performance.now();if(performance.now()-this.badSince>3000){this.badSince=0;this.fps=[];const pr=this.renderer.getPixelRatio();if(pr>0.6){this.renderer.setPixelRatio(Math.max(0.5,pr*0.7));if(typeof toast==="function")toast("Lower 3D quality — smoother on this phone");}}}else this.badSince=0;}},
 project(x,y,z){if(!this.on)return null;this.tmpV.set(x,z||0,-y).project(this.camera);return[(this.tmpV.x+1)/2*innerWidth,(1-this.tmpV.y)/2*innerHeight];},
 disable(why){if(!this.on)return;this.on=false;if(this.canvas)this.canvas.style.display="none";if(typeof toast==="function")toast(why==="slow"?"Switched to 2D — smoother on this phone":"2D view");},
 enable(){if(this.on)return;if(!this.tried){this.init();return;}if(this.renderer){this.on=true;this.canvas.style.display="";this.fps=[];this.badSince=0;this.resize();}}
};
