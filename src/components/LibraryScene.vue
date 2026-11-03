<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { books, type BookSeed } from '../data/books'
import { useLibraryStore } from '../stores/library'

const props = defineProps<{ mode:string; selectedTime:string; activeBook:string|null }>()
const emit = defineEmits<{ select:[book:BookSeed]; enter:[book:BookSeed]; archive:[] }>()
const host = ref<HTMLDivElement>()
const store = useLibraryStore()
let renderer:THREE.WebGLRenderer, scene:THREE.Scene, camera:THREE.PerspectiveCamera, controls:OrbitControls, raf=0
let raycaster:THREE.Raycaster, pointer:THREE.Vector2, bookMeshes:THREE.Group[]=[]
let shelfGroup:THREE.Group, worldGroup:THREE.Group, dust:THREE.Points, resizeObserver:ResizeObserver
let selected:THREE.Group|null=null, clock=new THREE.Clock(), pageLeaves:THREE.Mesh[]=[]
const bookById = new Map(books.map(b=>[b.id,b]))
const mat=(color:string,roughness=.7,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness})
function makeBook(seed:BookSeed,index:number){
 const g=new THREE.Group(); g.userData.bookId=seed.id
 const w=.62+(index%3)*.045,h=1.72+(index%4)*.08,d=.23+(index%2)*.025
 const cover=mat(seed.color,.48), page=mat('#e5d9bd',.92), gold=mat(seed.accent,.36,.55), dark=mat('#171512')
 const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),page); body.castShadow=true;body.receiveShadow=true;g.add(body)
 const front=new THREE.Mesh(new THREE.BoxGeometry(w+.025,h+.025,.045),cover);front.position.set(w/2,0,0);front.castShadow=true;const coverPivot=new THREE.Group();coverPivot.position.set(-w/2,0,d/2+.035);coverPivot.add(front);g.add(coverPivot);g.userData.coverPivot=coverPivot;const pagePivot=new THREE.Group();pagePivot.position.set(-w/2,0,d/2+.025);const pageLeaf=new THREE.Mesh(new THREE.BoxGeometry(w*.94,h*.94,.012),page);pageLeaf.position.x=w/2;pageLeaf.castShadow=true;pagePivot.add(pageLeaf);g.add(pagePivot);g.userData.pagePivot=pagePivot
 const back=new THREE.Mesh(new THREE.BoxGeometry(w+.025,h+.025,.045),cover);back.position.set(0,0,-d/2-.012);g.add(back)
 const spine=new THREE.Mesh(new THREE.BoxGeometry(.085,h+.03,d+.05),cover);spine.position.x=-w/2-.012;spine.castShadow=true;g.add(spine)
 const band=new THREE.Mesh(new THREE.BoxGeometry(.012,h*.72,.008),gold);band.position.set(-w/2-.057,0,d/2+.042);g.add(band)
 for(let k=0;k<3;k++){const line=new THREE.Mesh(new THREE.BoxGeometry(w*.56,.012,.006),gold);line.position.set(.03,.28-k*.12,d/2+.04);g.add(line)}
 const title=new THREE.Mesh(new THREE.BoxGeometry(w*.66,.025,.008),gold);title.position.set(.02,-.12,d/2+.04);g.add(title)
 const base=new THREE.Mesh(new THREE.BoxGeometry(w*.48,.012,.008),gold);base.position.set(.02,-.23,d/2+.04);g.add(base)
 g.userData.seed=seed;g.userData.dimensions={w,h,d};g.userData.originalY=0
 return g
}
function addShelves(){
 shelfGroup=new THREE.Group();scene.add(shelfGroup)
 const wood=mat('#493326'),edge=mat('#78563b'),shadow=mat('#241a14')
 for(let level=0;level<4;level++){
  const y=-1.25+level*1.42
  const shelf=new THREE.Mesh(new THREE.BoxGeometry(15,.16,2.25),wood);shelf.position.set(0,y,0);shelf.castShadow=true;shelf.receiveShadow=true;shelfGroup.add(shelf)
  const lip=new THREE.Mesh(new THREE.BoxGeometry(15,.1,.12),edge);lip.position.set(0,y-.02,1.12);shelfGroup.add(lip)
  const back=new THREE.Mesh(new THREE.BoxGeometry(15,1.36,.12),shadow);back.position.set(0,y+.72,-1.02);shelfGroup.add(back)
  books.forEach((seed,i)=>{
   const b=makeBook(seed,i);const col=i%12
   b.position.set(-6.35+col*1.08,y+.82,.12+((i+level)%3)*.13)
   b.rotation.y=(i%4-1.5)*.035;b.rotation.z=(i%5-2)*.018
   b.scale.setScalar(.65);b.userData.originalY=b.position.y;shelfGroup.add(b);bookMeshes.push(b)
  })
 }
 const pillarMat=mat('#39271d')
 for(const x of [-7.55,7.55]){const p=new THREE.Mesh(new THREE.BoxGeometry(.34,7.2,.4),pillarMat);p.position.set(x,.1,-.15);p.castShadow=true;shelfGroup.add(p)}
}
function addArchitecture(){
 const floor=new THREE.Mesh(new THREE.CylinderGeometry(12,12,.35,64),mat('#30271f'));floor.position.y=-2.05;floor.receiveShadow=true;scene.add(floor)
 const ceiling=new THREE.Mesh(new THREE.CylinderGeometry(9.2,11,.22,64),mat('#30271f'));ceiling.position.y=4.1;scene.add(ceiling)
 const ring=new THREE.Mesh(new THREE.TorusGeometry(8.7,.055,8,120),mat('#9a7951',.35,.6));ring.rotation.x=Math.PI/2;ring.position.y=3.8;scene.add(ring)
 for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const lamp=new THREE.PointLight('#e5bd83',12,7,2);lamp.position.set(Math.cos(a)*7,3.4,Math.sin(a)*7);scene.add(lamp)}
 const stair=new THREE.Group();for(let i=0;i<18;i++){const step=new THREE.Mesh(new THREE.BoxGeometry(2.5,.13,.55),mat('#63472f'));step.position.set(-4+i*.18,-1.72+i*.13,-2.5-i*.24);step.rotation.y=-.12;stair.add(step)}scene.add(stair)
}
function addDust(){const count=900,positions=new Float32Array(count*3);for(let i=0;i<count;i++){positions[i*3]=(Math.random()-.5)*19;positions[i*3+1]=Math.random()*8-2;positions[i*3+2]=(Math.random()-.5)*9}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));const m=new THREE.PointsMaterial({color:'#e6d2b1',size:.018,transparent:true,opacity:.45});dust=new THREE.Points(geo,m);scene.add(dust)}
function addWorld(){
 worldGroup=new THREE.Group();scene.add(worldGroup)
 const floor=new THREE.Mesh(new THREE.SphereGeometry(5,32,24),mat('#143f50'));floor.scale.set(1,.55,1);floor.position.set(0,-1.8,-3);worldGroup.add(floor)
 const orb=new THREE.Mesh(new THREE.SphereGeometry(1.2,32,24),mat('#6ca7ad',.3,.25));orb.position.set(0,.3,-3);worldGroup.add(orb)
 for(let i=0;i<18;i++){const a=i/18*Math.PI*2;const pillar=new THREE.Mesh(new THREE.CylinderGeometry(.07,.18,1.7+(i%4)*.35,8),mat(i%2?'#537b78':'#92775b'));pillar.position.set(Math.cos(a)*3,-.65,Math.sin(a)*2.5-3);worldGroup.add(pillar)}
 worldGroup.visible=false
}
function init(){
 if(!host.value)return
 scene=new THREE.Scene();scene.background=new THREE.Color('#171512');scene.fog=new THREE.FogExp2('#171512',.035)
 camera=new THREE.PerspectiveCamera(43,host.value.clientWidth/host.value.clientHeight,.1,100);camera.position.set(0,2.2,13)
 renderer=new THREE.WebGLRenderer({antialias:!matchMedia('(max-width: 700px)').matches,alpha:false,powerPreference:'high-performance'})
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(host.value.clientWidth,host.value.clientHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;host.value.appendChild(renderer.domElement)
 controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=6;controls.maxDistance=19;controls.maxPolarAngle=Math.PI*.78;controls.target.set(0,.5,0)
 scene.add(new THREE.HemisphereLight('#d6c4a5','#211811',2))
 const key=new THREE.DirectionalLight('#ffdfb1',3.2);key.position.set(-5,9,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key)
 addArchitecture();addShelves();addDust();addWorld()
 raycaster=new THREE.Raycaster();pointer=new THREE.Vector2()
 renderer.domElement.addEventListener('pointerdown',onPointer)
 resizeObserver=new ResizeObserver(onResize);resizeObserver.observe(host.value)
 animate()
}
function onResize(){if(!host.value)return;camera.aspect=host.value.clientWidth/host.value.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.value.clientWidth,host.value.clientHeight)}
function onPointer(e:PointerEvent){const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(bookMeshes,true);if(!hits.length)return;let o:THREE.Object3D|null=hits[0].object;while(o&&!o.userData.bookId)o=o.parent;if(o?.userData.bookId){const seed=bookById.get(o.userData.bookId);if(seed)selectBook(seed,o as THREE.Group)}}
function selectBook(seed:BookSeed,obj:THREE.Group){if(selected&&selected!==obj)gsap.to(selected.scale,{x:.65,y:.65,z:.65,duration:.4});selected=obj;emit('select',seed);store.discover(seed.id);gsap.to(obj.scale,{x:1.03,y:1.03,z:1.03,duration:.55,ease:'back.out(1.7)'});gsap.to(obj.position,{z:2.1,y:1.0,duration:.65,ease:'power3.out'});gsap.to(camera.position,{x:obj.position.x*.25,y:2.1,z:9.5,duration:.8,ease:'power2.inOut'});gsap.to(controls.target,{x:obj.position.x*.25,y:.5,z:0,duration:.8,onUpdate:()=>controls.update()})}
function openBook(id:string){const obj=bookMeshes.find(x=>x.userData.bookId===id);const seed=bookById.get(id);if(!obj||!seed)return;selectBook(seed,obj);const cover=obj.userData.coverPivot as THREE.Group;const leaf=obj.userData.pagePivot as THREE.Group;gsap.to(cover.rotation,{y:-2.35,duration:.9,delay:.55,ease:'power3.inOut'});gsap.to(leaf.rotation,{y:2.05,duration:1.05,delay:.72,ease:'power2.inOut'});gsap.delayedCall(1.9,()=>emit('enter',seed))}
function animate(){raf=requestAnimationFrame(animate);const t=clock.getElapsedTime();controls.update();if(dust){dust.rotation.y=t*.012;dust.position.y=Math.sin(t*.18)*.12}bookMeshes.forEach((b,i)=>{if(b!==selected)b.rotation.z+=Math.sin(t*.65+i)*.000035});if(worldGroup.visible)worldGroup.rotation.y=Math.sin(t*.18)*.12;renderer.render(scene,camera)}
function setTime(time:string){const presets:Record<string,{bg:string;light:string;intensity:number;exposure:number}>={SUNRISE:{bg:'#55443a',light:'#ffb77e',intensity:3.8,exposure:1.35},AFTERNOON:{bg:'#171512',light:'#ffdfb1',intensity:3.2,exposure:1.15},'RAINY DAY':{bg:'#202b32',light:'#9bb5c6',intensity:2.1,exposure:.95},MIDNIGHT:{bg:'#080d18',light:'#8b9dc5',intensity:1.25,exposure:.82}};const p=presets[time]||presets.AFTERNOON;gsap.to(scene.background,{r:new THREE.Color(p.bg).r,g:new THREE.Color(p.bg).g,b:new THREE.Color(p.bg).b,duration:1});scene.fog?.color.set(p.bg);renderer.toneMappingExposure=p.exposure;scene.children.filter(x=>x instanceof THREE.DirectionalLight).forEach((l:any)=>{l.color.set(p.light);gsap.to(l,{intensity:p.intensity,duration:1})})}
function setMode(mode:string){if(!shelfGroup)return;shelfGroup.visible=mode!=='KNOWLEDGE GALAXY'&&mode!=='SECRET ARCHIVE';worldGroup.visible=mode==='KNOWLEDGE GALAXY';if(mode==='KNOWLEDGE GALAXY'){bookMeshes.forEach((b,i)=>{const a=i/books.length*Math.PI*2;b.position.set(Math.cos(a)*(2.5+(i%3)*.6),Math.sin(a*2)*1.4,Math.sin(a)*(2.5+(i%3)*.6)-2);gsap.to(b.scale,{x:.55,y:.55,z:.55,duration:.6})})}else{bookMeshes.forEach((b,i)=>{const level=Math.floor(i/12),col=i%12;gsap.to(b.position,{x:-6.35+col*1.08,y:-1.25+level*1.42+.82,z:.12+((i+level)%3)*.13,duration:.7});gsap.to(b.scale,{x:.65,y:.65,z:.65,duration:.5})})}if(mode==='SECRET ARCHIVE'){shelfGroup.visible=true;const hidden=bookMeshes.find(b=>b.userData.bookId==='myth');if(hidden)gsap.to(hidden.position,{y:3.8,z:2,duration:1,ease:'power2.out'})}}
function enterWorld(id:string){const seed=bookById.get(id);if(!seed)return;worldGroup.visible=true;shelfGroup.visible=false;camera.position.set(0,1.3,5.8);controls.target.set(0,0,-2);const worldColors:Record<string,string>={ocean:'#0b3447',cosmos:'#11152d',atlas:'#263a35'};scene.background=new THREE.Color(worldColors[id]||'#18211e');scene.fog?.color.copy(scene.background);worldGroup.children.forEach((o,i)=>{if(o instanceof THREE.Mesh && o.geometry instanceof THREE.SphereGeometry){(o.material as THREE.MeshStandardMaterial).color.set(id==='cosmos'?'#7662a9':id==='atlas'?'#6b8566':'#6ca7ad')}})}
function returnLibrary(){worldGroup.visible=false;shelfGroup.visible=true;scene.background=new THREE.Color('#171512');scene.fog?.color.set('#171512');camera.position.set(0,2.2,13);controls.target.set(0,.5,0);controls.update()}
watch(()=>props.selectedTime,setTime)
watch(()=>props.mode,setMode)
watch(()=>props.activeBook,id=>{if(id)openBook(id)})
onMounted(init)
onBeforeUnmount(()=>{cancelAnimationFrame(raf);resizeObserver?.disconnect();renderer?.domElement.removeEventListener('pointerdown',onPointer);controls?.dispose();renderer?.dispose();scene?.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const m=o.material;if(Array.isArray(m))m.forEach(x=>x.dispose());else m.dispose()}})})
defineExpose({openBook,enterWorld,returnLibrary})
</script>
<template><div ref="host" class="scene-host"><div class="scene-hint"><span class="hint-dot"></span> DRAG TO EXPLORE <i>·</i> SCROLL TO MOVE</div></div></template>
<style scoped>.scene-host{position:absolute;inset:0;overflow:hidden}.scene-host :deep(canvas){display:block;width:100%;height:100%;touch-action:pan-y}.scene-hint{position:absolute;bottom:104px;left:50%;transform:translateX(-50%);font:9px 'DM Sans',sans-serif;letter-spacing:.2em;color:#d2c4ae9c;white-space:nowrap;pointer-events:none}.scene-hint i{padding:0 9px;color:#b88f60}.hint-dot{display:inline-block;width:5px;height:5px;border-radius:50%;background:#c39a69;margin:0 9px 1px 0;box-shadow:0 0 9px #c39a69}</style>
