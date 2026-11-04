<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
import * as THREE from 'three'

type Station = 'studio' | 'blueberry' | 'strawberry' | 'toast' | 'decorate' | 'table'
const station = ref<Station>('studio')
const hint = ref('Drag to look around · Click ingredients to interact')
const berries = ref(0)
const strawberries = ref(0)
const jamMade = ref(false)
const toastIndex = ref(0)
const jamAmount = ref(0)
const toastNames = ['HEART','STAR','BEAR','FLOWER','CLOUD']
const currentToast = computed(() => toastNames[toastIndex.value])
const toastDone = ref(false)
const saved = ref(false)
const stageTitle = computed(() => ({
  studio: 'A little kitchen, a lot of imagination.',
  blueberry: 'Turn a handful of berries into something wonderful.',
  strawberry: 'Sweet, bright, and made by hand.',
  toast: 'Choose a shape. Make it yours.',
  decorate: 'Spread a little happiness.',
  table: 'Your very own breakfast moment.'
}[station.value]))
let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let world: THREE.Group
let carousel: THREE.Group
let raycaster: THREE.Raycaster
let pointer: THREE.Vector2
let animationId = 0
let resizeObserver: ResizeObserver | undefined
let downX = 0
let downY = 0
let moved = false
let isDragging = false
const canvasHost = ref<HTMLDivElement>()
const interactive: THREE.Object3D[] = []
const fruitMeshes: THREE.Mesh[] = []
const toastMeshes: THREE.Group[] = []
const tempObjects: THREE.Object3D[] = []

function material(color: string, roughness = 0.72, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness })
}
function addMesh(geometry: THREE.BufferGeometry, mat: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = world) {
  const mesh = new THREE.Mesh(geometry, mat)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  parent.add(mesh)
  return mesh
}
function makeFruit(color: string, x: number, z: number, scale = 1, strawberry = false) {
  const group = new THREE.Group()
  group.position.set(x, 1.28, z)
  const body = addMesh(new THREE.SphereGeometry(0.19 * scale, 24, 18), material(color, 0.3), 0, 0, 0, group)
  body.scale.set(strawberry ? 0.82 : 1, strawberry ? 1.05 : 0.9, strawberry ? 0.82 : 1)
  if (strawberry) {
    const leaf = addMesh(new THREE.ConeGeometry(0.075 * scale, 0.12 * scale, 5), material('#426b3b'), 0, 0.19 * scale, 0, group)
    leaf.rotation.z = Math.PI
  } else {
    const bloom = addMesh(new THREE.SphereGeometry(0.035 * scale, 10, 8), material('#91a76d'), 0, 0.17 * scale, 0, group)
    bloom.scale.set(1, 0.4, 1)
  }
  group.userData.kind = strawberry ? 'strawberry' : 'blueberry'
  group.userData.baseY = group.position.y
  world.add(group)
  interactive.push(group)
  fruitMeshes.push(body)
  return group
}
function shapeFor(name: string) {
  const s = new THREE.Shape()
  if (name === 'HEART') {
    s.moveTo(0, -0.34)
    s.bezierCurveTo(-0.12, -0.2, -0.55, 0.08, -0.48, 0.39)
    s.bezierCurveTo(-0.42, 0.72, -0.06, 0.69, 0, 0.42)
    s.bezierCurveTo(0.08, 0.72, 0.44, 0.7, 0.49, 0.38)
    s.bezierCurveTo(0.55, 0.05, 0.15, -0.22, 0, -0.34)
  } else if (name === 'STAR') {
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i * Math.PI / 5
      const r = i % 2 === 0 ? 0.57 : 0.25
      const x = Math.cos(a) * r
      const y = Math.sin(a) * r
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y)
    }
    s.closePath()
  } else if (name === 'BEAR') {
    s.absellipse(0, -0.04, 0.43, 0.43, 0, Math.PI * 2, false, 0)
    s.moveTo(-0.25, 0.28); s.absellipse(-0.29, 0.34, 0.15, 0.15, 0, Math.PI * 2, false, 0)
    s.moveTo(0.43, 0.28); s.absellipse(0.29, 0.34, 0.15, 0.15, 0, Math.PI * 2, false, 0)
  } else if (name === 'FLOWER') {
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI / 5
      const r = i % 2 === 0 ? 0.52 : 0.37
      const x = Math.cos(a) * r, y = Math.sin(a) * r
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y)
    }
    s.closePath()
  } else {
    s.moveTo(-0.48, -0.12); s.bezierCurveTo(-0.55, 0.16, -0.31, 0.3, -0.12, 0.2)
    s.bezierCurveTo(-0.02, 0.54, 0.39, 0.48, 0.39, 0.2)
    s.bezierCurveTo(0.66, 0.11, 0.59, -0.26, 0.3, -0.27)
    s.bezierCurveTo(0.14, -0.5, -0.21, -0.43, -0.26, -0.26)
    s.bezierCurveTo(-0.39, -0.32, -0.5, -0.25, -0.48, -0.12)
  }
  return s
}
function makeToast(name: string, index: number) {
  const group = new THREE.Group()
  const crustGeo = new THREE.ExtrudeGeometry(shapeFor(name), { depth: 0.16, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.055, bevelThickness: 0.055, curveSegments: 12 })
  const crust = addMesh(crustGeo, material('#9b572e', 0.88), 0, 0, 0, group)
  crust.rotation.x = -Math.PI / 2
  const crumbGeo = new THREE.ExtrudeGeometry(shapeFor(name), { depth: 0.17, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.035, bevelThickness: 0.025, curveSegments: 12 })
  const crumb = addMesh(crumbGeo, material('#e8b96f', 0.94), 0, 0.045, 0, group)
  crumb.rotation.x = -Math.PI / 2
  group.position.set((index - 2) * 1.42, 1.2, -0.25)
  group.scale.setScalar(index === 2 ? 1.05 : 0.72)
  group.userData.kind = 'toast'
  group.userData.index = index
  carousel.add(group)
  interactive.push(group)
  toastMeshes.push(group)
  return group
}
function createKitchen() {
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#d9c8ad')
  scene.fog = new THREE.Fog('#d9c8ad', 12, 25)
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80)
  camera.position.set(0, 5.4, 10.5)
  camera.lookAt(0, 1.1, 0)
  world = new THREE.Group()
  scene.add(world)
  const hemi = new THREE.HemisphereLight('#fff3dd', '#806044', 2.0)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#fff0d3', 3.1)
  sun.position.set(-4, 9, 5); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048)
  scene.add(sun)
  const fill = new THREE.PointLight('#fff8ec', 70, 18)
  fill.position.set(4, 4, -3); scene.add(fill)
  const floor = addMesh(new THREE.PlaneGeometry(40, 40), material('#c8b394'), 0, 0, 0)
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true
  const counter = addMesh(new THREE.BoxGeometry(8.8, 0.32, 3.3), material('#8a5b3c'), 0, 0.95, 0)
  const edge = addMesh(new THREE.BoxGeometry(8.9, 0.09, 3.38), material('#c59b6b'), 0, 1.15, 0)
  const back = addMesh(new THREE.BoxGeometry(9, 3.2, 0.18), material('#eee2ce'), 0, 2.7, -2.25)
  back.castShadow = false
  // Window and warm kitchen details
  const windowFrame = material('#6d503b')
  addMesh(new THREE.BoxGeometry(2.6, 1.8, 0.1), windowFrame, -2.7, 3.2, -2.08)
  const glass = addMesh(new THREE.PlaneGeometry(2.42, 1.62), new THREE.MeshStandardMaterial({ color: '#b7d0ce', roughness: 0.2, metalness: 0.1, emissive: '#6e9a9c', emissiveIntensity: 0.12 }), -2.7, 3.2, -2.01)
  const shelf = addMesh(new THREE.BoxGeometry(3.6, 0.12, 0.48), material('#80583c'), 2.3, 3.25, -1.98)
  // Jam pot
  const pot = new THREE.Group()
  pot.position.set(1.85, 1.35, 0.05)
  const potBody = addMesh(new THREE.CylinderGeometry(0.54, 0.48, 0.52, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#b66a4e', roughness: 0.32, metalness: 0.55, side: THREE.DoubleSide }), 0, 0, 0, pot)
  const potBase = addMesh(new THREE.CylinderGeometry(0.48, 0.48, 0.07, 40), material('#a95e43', 0.3, 0.6), 0, -0.26, 0, pot)
  const jam = addMesh(new THREE.CylinderGeometry(0.46, 0.46, 0.18, 40), material('#54335e', 0.25), 0, 0.12, 0, pot)
  pot.userData.kind = 'pot'
  world.add(pot); interactive.push(pot)
  // Glass jar
  const jar = new THREE.Group()
  jar.position.set(3.15, 1.25, 0.3)
  const jarGlass = new THREE.MeshPhysicalMaterial({ color: '#f1eadb', roughness: 0.08, transmission: 0.72, thickness: 0.18, transparent: true, opacity: 0.55 })
  addMesh(new THREE.CylinderGeometry(0.3, 0.28, 0.72, 32, 1, true), jarGlass, 0, 0, 0, jar)
  addMesh(new THREE.CylinderGeometry(0.27, 0.27, 0.035, 32), material('#5d365f', 0.3), 0, -0.24, 0, jar)
  addMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.09, 32), material('#c5a36e', 0.28, 0.5), 0, 0.4, 0, jar)
  jar.userData.kind = 'jar'; world.add(jar); interactive.push(jar)
  // Fruit cluster
  for (let i = 0; i < 12; i++) {
    const a = i * 2.4
    makeFruit('#344a85', -2.8 + Math.cos(a) * 0.6, 0.45 + Math.sin(a) * 0.42, 0.8 + (i % 3) * 0.1)
  }
  for (let i = 0; i < 6; i++) {
    const a = i * 2.1
    makeFruit('#c93f42', -3.2 + Math.cos(a) * 0.4, -0.45 + Math.sin(a) * 0.34, 0.95, true)
  }
  // Flour bowl and bread board
  const bowl = addMesh(new THREE.CylinderGeometry(0.48, 0.36, 0.16, 40), material('#e4d6bf'), 0.05, 1.3, 0.55)
  bowl.userData.kind = 'bowl'; interactive.push(bowl)
  carousel = new THREE.Group()
  carousel.position.set(-0.1, 0, -0.2)
  world.add(carousel)
  toastMeshes.length = 0
  ;['HEART','STAR','BEAR','FLOWER','CLOUD'].forEach((name, i) => makeToast(name, i))
  // Soft kitchen props
  for (let i = 0; i < 3; i++) {
    const jarProp = addMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.5, 24), new THREE.MeshPhysicalMaterial({ color: '#d7c5a8', roughness: 0.2, transmission: 0.45, transparent: true, opacity: 0.6 }), -0.9 + i * 0.48, 1.42, -1.45)
    jarProp.scale.set(1, 1 + i * 0.2, 1)
  }
  raycaster = new THREE.Raycaster()
  pointer = new THREE.Vector2()
}
function setStation(next: Station) {
  station.value = next
  hint.value = ({
    studio: 'Explore the counter · Click the berries, pot, toast or jar',
    blueberry: 'Pick the blueberries, then press the wooden spoon to make jam',
    strawberry: 'Choose the strawberries and make a bright berry preserve',
    toast: 'Drag the carousel or tap a toast to bring it forward',
    decorate: 'Choose a jam, then drag across the toast to spread it',
    table: 'Your breakfast is ready for its close-up'
  } as Record<Station, string>)[next]
  if (next === 'toast') focusToast(toastIndex.value)
}
function focusToast(index: number) {
  toastIndex.value = (index + toastNames.length) % toastNames.length
  toastMeshes.forEach((t, i) => {
    const offset = ((i - toastIndex.value + 2 + 5) % 5) - 2
    t.position.x = offset * 1.55
    t.position.z = -0.1 - Math.abs(offset) * 0.12
    const target = offset === 0 ? 1.12 : 0.7 - Math.abs(offset) * 0.06
    t.scale.setScalar(target)
    t.rotation.y = offset * -0.13
  })
}
function handleClick(event: PointerEvent) {
  if (!renderer || !canvasHost.value || moved) return
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(interactive, true)
  if (!hits.length) return
  let obj: THREE.Object3D | null = hits[0].object
  while (obj && !obj.userData.kind && obj.parent) obj = obj.parent
  if (!obj) return
  const kind = obj.userData.kind
  if (kind === 'blueberry') {
    berries.value++
    hint.value = 'Blueberry collected · ' + berries.value + ' / 12'
    obj.position.y = -2
  } else if (kind === 'strawberry') {
    strawberries.value++
    hint.value = 'Strawberry collected · ' + strawberries.value + ' / 6'
    obj.position.y = -2
  } else if (kind === 'pot' || kind === 'bowl') {
    jamMade.value = true
    jamAmount.value = Math.min(100, jamAmount.value + 25)
    hint.value = 'Stirring… glossy berry jam is coming together.'
    obj.rotation.y += Math.PI * 1.5
  } else if (kind === 'jar') {
    jamMade.value = true
    jamAmount.value = 100
    hint.value = 'Jar filled! Your handmade berry preserve is ready.'
  } else if (kind === 'toast') {
    focusToast(Number(obj.userData.index))
    toastDone.value = true
    hint.value = toastNames[toastIndex.value] + ' toast selected · ready to decorate'
  }
}
function pointerDown(e: PointerEvent) {
  downX = e.clientX; downY = e.clientY; moved = false; isDragging = true
}
function pointerMove(e: PointerEvent) {
  if (!isDragging || !renderer) return
  const dx = e.clientX - downX
  const dy = e.clientY - downY
  if (Math.abs(dx) + Math.abs(dy) > 5) moved = true
  if (moved) {
    if (station.value === 'toast') {
      const step = Math.round(dx / 100)
      if (step !== 0) { focusToast(toastIndex.value - step); downX = e.clientX }
    } else {
      world.rotation.y += dx * 0.003
      camera.position.y = THREE.MathUtils.clamp(camera.position.y - dy * 0.006, 3.7, 7)
      camera.lookAt(0, 1.1, 0)
      downX = e.clientX; downY = e.clientY
    }
  }
}
function pointerUp(e: PointerEvent) {
  isDragging = false
  if (!moved) handleClick(e)
}
function spreadJam() {
  jamAmount.value = Math.min(100, jamAmount.value + 20)
  toastDone.value = true
  hint.value = 'A glossy layer of berry jam spreads across the toast.'
}
function nextToast(dir: number) { focusToast(toastIndex.value + dir); toastDone.value = true }
function animate() {
  animationId = requestAnimationFrame(animate)
  const t = performance.now() * 0.001
  fruitMeshes.forEach((m, i) => { if (m.parent && m.parent.position.y > -1) m.parent.position.y = 1.28 + Math.sin(t * 1.1 + i) * 0.025 })
  if (carousel) carousel.children.forEach((o, i) => { o.position.y = 1.15 + Math.sin(t * 1.4 + i * 0.8) * 0.025 })
  renderer?.render(scene, camera)
}
function resize() {
  if (!renderer || !canvasHost.value) return
  const w = canvasHost.value.clientWidth, h = canvasHost.value.clientHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h; camera.updateProjectionMatrix()
}
onMounted(() => {
  if (!canvasHost.value) return
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.12
  renderer.domElement.className = 'bakery-canvas'
  renderer.domElement.addEventListener('pointerdown', pointerDown)
  renderer.domElement.addEventListener('pointerup', pointerUp)
  renderer.domElement.addEventListener('pointermove', pointerMove)
  canvasHost.value.appendChild(renderer.domElement)
  createKitchen()
  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(canvasHost.value)
  animate()
})
onBeforeUnmount(() => {
  cancelAnimationFrame(animationId)
  resizeObserver?.disconnect()
  renderer?.dispose()
  scene?.traverse(o => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose()
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      mats.forEach(m => m.dispose())
    }
  })
})
</script>

<template>
  <main class="bakery-app">
    <div ref="canvasHost" class="scene-host"></div>
    <div class="scene-wash"></div>
    <header class="topbar">
      <button class="brand" @click="setStation('studio')"><span class="brand-icon">B</span><span><b>BERRY <i>&</i> BREAD</b><small>THE LITTLE BAKERY STUDIO</small></span></button>
      <div class="top-center"><span class="open-dot"></span> WORKSHOP OPEN <span class="top-divider">/</span> FRESH TODAY</div>
      <button class="collection-btn" @click="setStation('table')">MY BREAKFAST <span>↗</span></button>
    </header>

    <section class="hero-copy" v-if="station === 'studio'">
      <div class="eyebrow"><span></span> A HANDMADE LITTLE WORLD</div>
      <h1>Good things<br>take <em>a little</em><br>sweetness.</h1>
      <p>Pick the berries. Make the jam.<br>Shape a toast. Create your morning.</p>
      <button class="primary-cta" @click="setStation('blueberry')">ENTER THE KITCHEN <span>↗</span></button>
    </section>

    <section class="workshop-copy" v-else>
      <div class="eyebrow"><span></span> BERRY & BREAD WORKSHOP</div>
      <h1>{{ station === 'blueberry' ? 'Blueberry' : station === 'strawberry' ? 'Strawberry' : station === 'toast' ? 'Toast shape' : station === 'decorate' ? 'Jam art' : 'Breakfast' }} <em>{{ station === 'toast' ? 'studio.' : station === 'decorate' ? 'studio.' : 'lab.' }}</em></h1>
      <p>{{ stageTitle }}</p>
      <div class="progress-note" v-if="station === 'blueberry' || station === 'strawberry'">
        <span>{{ station === 'blueberry' ? berries : strawberries }} INGREDIENTS PICKED</span>
        <span>{{ jamAmount }}% JAM</span>
      </div>
      <div class="progress-track" v-if="station === 'blueberry' || station === 'strawberry'"><i :style="{width: jamAmount + '%'}"></i></div>
      <div class="toast-choice" v-if="station === 'toast' || station === 'decorate'">
        <button @click="nextToast(-1)">←</button><span>{{ currentToast }} TOAST</span><button @click="nextToast(1)">→</button>
      </div>
    </section>

    <div class="hint-pill"><span class="hint-dot"></span>{{ hint }}</div>

    <aside class="right-tools" v-if="station !== 'studio'">
      <div class="tools-head"><small>YOUR WORKBENCH</small><span>✳</span></div>
      <div class="tool-item" :class="{selected: station === 'blueberry'}" @click="setStation('blueberry')"><span class="tool-thumb blueberry-thumb"></span><span><b>Blueberries</b><small>{{ berries }} picked</small></span><i>01</i></div>
      <div class="tool-item" :class="{selected: station === 'strawberry'}" @click="setStation('strawberry')"><span class="tool-thumb strawberry-thumb"></span><span><b>Strawberries</b><small>{{ strawberries }} picked</small></span><i>02</i></div>
      <div class="tool-item" :class="{selected: station === 'toast'}" @click="setStation('toast')"><span class="tool-thumb toast-thumb"></span><span><b>Toast shapes</b><small>{{ currentToast.toLowerCase() }} selected</small></span><i>03</i></div>
      <div class="tool-item" :class="{selected: station === 'decorate'}" @click="setStation('decorate')"><span class="tool-thumb jam-thumb"></span><span><b>Jam & decorate</b><small>{{ jamAmount }}% spread</small></span><i>04</i></div>
      <div class="tool-item" :class="{selected: station === 'table'}" @click="setStation('table')"><span class="tool-thumb table-thumb"></span><span><b>Breakfast table</b><small>final creation</small></span><i>05</i></div>
      <div class="tool-actions">
        <button @click="station === 'decorate' ? spreadJam() : (jamMade = true, jamAmount = Math.min(100, jamAmount + 25), hint = 'Stirring the jam…')">{{ station === 'decorate' ? 'SPREAD JAM' : 'MAKE JAM' }} <span>↗</span></button>
        <button class="soft-action" @click="saved = !saved">{{ saved ? 'SAVED TO BOOK' : 'SAVE CREATION' }} <span>{{ saved ? '✓' : '♡' }}</span></button>
      </div>
    </aside>

    <div class="bottom-bar">
      <div class="bottom-caption"><span class="tiny-sun">✳</span><span><b>{{ station === 'studio' ? 'THE MORNING IS YOURS' : station.toUpperCase() }}</b><small>TAKE YOUR TIME · MAKE IT YOURS</small></span></div>
      <nav class="station-nav">
        <button :class="{active:station==='blueberry'}" @click="setStation('blueberry')"><span>01</span> JAM LAB</button>
        <button :class="{active:station==='strawberry'}" @click="setStation('strawberry')"><span>02</span> FRUIT LAB</button>
        <button :class="{active:station==='toast'}" @click="setStation('toast')"><span>03</span> TOAST STUDIO</button>
        <button :class="{active:station==='decorate'}" @click="setStation('decorate')"><span>04</span> JAM ART</button>
        <button :class="{active:station==='table'}" @click="setStation('table')"><span>05</span> BREAKFAST</button>
      </nav>
      <button class="sound-btn" @click="hint='Listen to the quiet sounds of a little bakery.'">♫ <span>SOUND</span></button>
    </div>
    <div class="made-stamp" v-if="station === 'table'"><span>✳</span><b>MADE WITH A LITTLE LOVE</b><small>YOUR VERY OWN BREAKFAST</small></div>
    <div class="toast-confirm" v-if="toastDone && station === 'toast'">A lovely {{ currentToast.toLowerCase() }} toast. <button @click="setStation('decorate')">DECORATE IT ↗</button></div>
  </main>
</template>
