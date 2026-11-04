<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'

type Hat = { name: string; subtitle: string; price: number; color: string; ribbon: string; detail: string }
const hats: Hat[] = [
  { name: 'THE SOL', subtitle: 'WIDE BRIM · NATURAL RAFFIA', price: 389, color: '#c9a36a', ribbon: '#bd684d', detail: 'A generous brim for long, slow afternoons.' },
  { name: 'THE COAST', subtitle: 'CLASSIC PANAMA · HANDWOVEN', price: 459, color: '#dfc58e', ribbon: '#526b60', detail: 'Lightweight structure, made for salt air.' },
  { name: 'THE GARDEN', subtitle: 'SOFT CLOCHE · VINTAGE SHAPE', price: 429, color: '#b78b58', ribbon: '#d1a6a0', detail: 'A softer silhouette with a little romance.' },
  { name: 'THE NOMAD', subtitle: 'TRAVELLER · EVERYDAY SHADE', price: 359, color: '#b99a70', ribbon: '#4d5e73', detail: 'Your easy companion from city to shoreline.' },
]
const ribbons = ['#bd684d', '#526b60', '#d1a6a0', '#4d5e73', '#e1bd68']
const selected = ref(0)
const ribbonIndex = ref(0)
const cartCount = ref(0)
const cartOpen = ref(false)
const customOpen = ref(false)
const toast = ref('')
const quantity = ref(1)
const current = computed(() => hats[selected.value])
const cartTotal = computed(() => current.value.price * quantity.value)
const hatHost = ref<HTMLDivElement | null>(null)
let renderer: THREE.WebGLRenderer | undefined
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let stage: THREE.Group
let mainHat: THREE.Group
let sideHats: THREE.Group[] = []
let ribbonMaterial: THREE.MeshStandardMaterial
let raf = 0
let resizeObserver: ResizeObserver | undefined
let dragging = false
let moved = false
let lastX = 0
let lastY = 0
let targetRotation = 0
let targetTilt = -0.22
let pointerX = 0

function mat(color: string, roughness = 0.82) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.02 })
}
function makeHat(index: number, scale = 1) {
  const group = new THREE.Group()
  const brimShape = new THREE.Shape()
  brimShape.absellipse(0, 0, 1.75, 1.52, 0, Math.PI * 2, false, 0)
  const hole = new THREE.Path()
  hole.absellipse(0, 0, 0.66, 0.61, 0, Math.PI * 2, true, 0)
  brimShape.holes.push(hole)
  const brimGeo = new THREE.ExtrudeGeometry(brimShape, { depth: 0.075, bevelEnabled: true, bevelSegments: 3, bevelSize: 0.035, bevelThickness: 0.035, curveSegments: 64 })
  const straw = mat(hats[index].color)
  const brim = new THREE.Mesh(brimGeo, straw)
  brim.rotation.x = -Math.PI / 2
  brim.position.y = 0.12
  brim.castShadow = true
  brim.receiveShadow = true
  group.add(brim)

  const profile = [
    new THREE.Vector2(0.62, 0.12), new THREE.Vector2(0.64, 0.2),
    new THREE.Vector2(0.59, 0.38), new THREE.Vector2(0.52, 0.66),
    new THREE.Vector2(0.45, 0.91), new THREE.Vector2(0.36, 1.04),
    new THREE.Vector2(0.18, 1.09), new THREE.Vector2(0, 1.1),
  ]
  const crownGeo = new THREE.LatheGeometry(profile, 64)
  const crown = new THREE.Mesh(crownGeo, straw)
  crown.position.y = 0.12
  crown.castShadow = true
  crown.receiveShadow = true
  group.add(crown)

  ribbonMaterial = mat(hats[index].ribbon, 0.48)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.603, 0.603, 0.16, 64, 1, true), ribbonMaterial)
  band.position.y = 0.48
  band.castShadow = true
  group.add(band)
  const bow = new THREE.Group()
  bow.position.set(0.55, 0.51, 0.23)
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 20, 16), ribbonMaterial)
  knot.scale.set(1, 0.7, 0.65)
  bow.add(knot)
  const loopGeo = new THREE.SphereGeometry(0.16, 20, 16)
  const loop1 = new THREE.Mesh(loopGeo, ribbonMaterial); loop1.scale.set(1.3, 0.55, 0.42); loop1.position.x = 0.19; loop1.rotation.z = -0.35
  const loop2 = new THREE.Mesh(loopGeo, ribbonMaterial); loop2.scale.set(1.3, 0.55, 0.42); loop2.position.x = -0.19; loop2.rotation.z = 0.35
  bow.add(loop1, loop2)
  group.add(bow)

  // Fine concentric straw stitching on the brim.
  const stitchMat = new THREE.MeshStandardMaterial({ color: '#8b693f', roughness: 0.95, transparent: true, opacity: 0.36 })
  for (let r = 1.08; r <= 1.62; r += 0.12) {
    const line = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 5, 100), stitchMat)
    line.rotation.x = Math.PI / 2
    line.position.y = 0.205
    group.add(line)
  }
  group.scale.setScalar(scale)
  return group
}
function setupScene() {
  if (!hatHost.value) return
  scene = new THREE.Scene()
  scene.background = new THREE.Color('#d7c9ae')
  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
  camera.position.set(0, 4.1, 8.8)
  camera.lookAt(0, 0.45, 0)
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.18
  renderer.domElement.className = 'hat-canvas'
  hatHost.value.appendChild(renderer.domElement)

  const hemi = new THREE.HemisphereLight('#fff5df', '#8c7252', 2.1)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight('#fff1d3', 3.5)
  sun.position.set(-4, 8, 5)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  sun.shadow.camera.left = -7; sun.shadow.camera.right = 7; sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7
  scene.add(sun)
  const rim = new THREE.DirectionalLight('#fff8e8', 1.6)
  rim.position.set(5, 3, -4)
  scene.add(rim)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), mat('#d7c9ae'))
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -0.12
  floor.receiveShadow = true
  scene.add(floor)

  stage = new THREE.Group()
  scene.add(stage)
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.7, 0.16, 96), mat('#eee3cf'))
  pedestal.position.y = -0.05
  pedestal.receiveShadow = true
  stage.add(pedestal)
  mainHat = makeHat(0, 1)
  mainHat.position.y = 0.12
  stage.add(mainHat)
  sideHats = [-1, 1].map((side) => {
    const g = makeHat(side < 0 ? 3 : 1, 0.43)
    g.position.set(side * 3.15, 0.12, -0.9)
    g.rotation.y = side * -0.35
    stage.add(g)
    return g
  })
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(2.8, 64), new THREE.MeshBasicMaterial({ color: '#8d7655', transparent: true, opacity: 0.12 }))
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = -0.035
  stage.add(shadow)
  resize()
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(hatHost.value)
}
function resize() {
  if (!renderer || !hatHost.value) return
  const w = hatHost.value.clientWidth
  const h = hatHost.value.clientHeight
  renderer.setSize(w, h, false)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
}
function animate() {
  raf = requestAnimationFrame(animate)
  const t = performance.now() * 0.001
  if (mainHat) {
    mainHat.rotation.y += (targetRotation - mainHat.rotation.y) * 0.075
    mainHat.rotation.x += (targetTilt - mainHat.rotation.x) * 0.075
    mainHat.position.y = 0.12 + Math.sin(t * 1.1) * 0.055
  }
  sideHats.forEach((hat, i) => { hat.rotation.y += ((i === 0 ? -0.42 : 0.42) - hat.rotation.y) * 0.035 })
  stage?.rotation.y && (stage.rotation.y += (pointerX * 0.035 - stage.rotation.y) * 0.025)
  renderer?.render(scene, camera)
}
function changeHat(direction: number) {
  selected.value = (selected.value + direction + hats.length) % hats.length
  targetRotation += direction * Math.PI * 0.7
  targetTilt = -0.22
  ribbonIndex.value = ribbons.indexOf(hats[selected.value].ribbon)
  if (ribbonIndex.value < 0) ribbonIndex.value = 0
  if (mainHat) {
    const next = makeHat(selected.value, 1)
    next.position.copy(mainHat.position)
    next.rotation.copy(mainHat.rotation)
    stage.remove(mainHat)
    mainHat.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose() } })
    mainHat = next
    stage.add(mainHat)
    mainHat.rotation.y = targetRotation - direction * Math.PI * 0.7
  }
  if (sideHats.length) {
    sideHats.forEach((h, i) => {
      const nextIndex = (selected.value + (i === 0 ? -1 : 1) + hats.length) % hats.length
      h.traverse(o => { if (o instanceof THREE.Mesh) { o.geometry.dispose(); if (Array.isArray(o.material)) o.material.forEach(m => m.dispose()); else o.material.dispose() } })
      stage.remove(h)
      const replacement = makeHat(nextIndex, 0.43)
      replacement.position.set((i === 0 ? -1 : 1) * 3.15, 0.12, -0.9)
      replacement.rotation.y = i === 0 ? 0.42 : -0.42
      stage.add(replacement)
      sideHats[i] = replacement
    })
  }
}
function setRibbon(index: number) {
  ribbonIndex.value = index
  if (!mainHat) return
  const color = ribbons[index]
  mainHat.children.forEach((child, i) => {
    if ((child as THREE.Mesh).material instanceof THREE.MeshStandardMaterial && (i === 2 || i === 3)) {
      const mesh = child as THREE.Mesh
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      materials.forEach(m => (m as THREE.MeshStandardMaterial).color.set(color))
    }
  })
}
function pointerDown(e: PointerEvent) {
  dragging = true; moved = false; lastX = e.clientX; lastY = e.clientY
}
function pointerMove(e: PointerEvent) {
  pointerX = (e.clientX / window.innerWidth - 0.5) * 2
  if (!dragging) return
  const dx = e.clientX - lastX
  const dy = e.clientY - lastY
  if (Math.abs(dx) + Math.abs(dy) > 3) moved = true
  if (moved) {
    targetRotation += dx * 0.009
    targetTilt = THREE.MathUtils.clamp(targetTilt + dy * 0.004, -0.65, 0.32)
  }
  lastX = e.clientX; lastY = e.clientY
}
function pointerUp() { dragging = false }
function addToCart() {
  cartCount.value += quantity.value
  toast.value = 'Added to your summer collection'
  window.setTimeout(() => { toast.value = '' }, 2300)
}
function openCart() { cartOpen.value = true }
watch(selected, () => { quantity.value = 1 })
onMounted(() => {
  setupScene()
  animate()
  window.addEventListener('pointerup', pointerUp)
  window.addEventListener('pointermove', pointerMove)
  hatHost.value?.addEventListener('pointerdown', pointerDown)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  resizeObserver?.disconnect()
  window.removeEventListener('pointerup', pointerUp)
  window.removeEventListener('pointermove', pointerMove)
  hatHost.value?.removeEventListener('pointerdown', pointerDown)
  renderer?.dispose()
  scene?.traverse(o => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose()
      const materials = Array.isArray(o.material) ? o.material : [o.material]
      materials.forEach(m => m.dispose())
    }
  })
})
</script>

<template>
  <main class="strawverse">
    <div class="ambient-photo"></div>
    <div class="grain"></div>
    <header class="nav">
      <a class="wordmark" href="#" @click.prevent="selected = 0"><span class="mark">S</span><span>STRAW<span class="wordmark-light">VERSE</span><small>THE SUMMER HAT ATELIER</small></span></a>
      <nav class="nav-links"><a href="#collection">COLLECTION</a><a href="#craft">OUR CRAFT</a><a href="#story">THE SUMMER STORY</a></nav>
      <button class="bag-button" @click="openCart"><span>YOUR BAG</span><i>{{ cartCount }}</i></button>
    </header>

    <section class="hero">
      <div class="hero-copy">
        <div class="kicker"><span class="kicker-line"></span> MADE FOR THE LONG WAY HOME</div>
        <h1>Chase the<br><em>sun.</em> Keep<br>the feeling.</h1>
        <p>Handwoven straw hats for wherever<br>the light takes you.</p>
        <a class="discover" href="#collection">DISCOVER THE COLLECTION <span>↘</span></a>
        <div class="hero-index"><b>01</b><span></span> THE SUMMER EDIT · 2026</div>
      </div>

      <div class="product-stage">
        <div class="stage-sun"></div>
        <div class="stage-label stage-label-top"><span>01 / 04</span><i>HANDWOVEN IN THE SUN</i></div>
        <div ref="hatHost" class="hat-host" @pointerdown="pointerDown"></div>
        <button class="stage-arrow stage-prev" aria-label="Previous hat" @click="changeHat(-1)">←</button>
        <button class="stage-arrow stage-next" aria-label="Next hat" @click="changeHat(1)">→</button>
        <div class="drag-note"><span>✳</span> DRAG TO TURN YOUR HAT</div>
        <div class="stage-caption"><span>STRAWVERSE OBJECT No. {{ String(selected + 1).padStart(2, '0') }}</span><span>360° / HAND FINISHED</span></div>
      </div>

      <div class="product-info">
        <div class="product-count">THE ATELIER COLLECTION <span>— 0{{ selected + 1 }} / 04</span></div>
        <h2>{{ current.name }}</h2>
        <div class="product-subtitle">{{ current.subtitle }}</div>
        <p class="product-detail">{{ current.detail }}</p>
        <div class="price-row"><strong>¥{{ current.price }}</strong><span>FREE SHIPPING OVER ¥499</span></div>
        <div class="color-picker">
          <div class="picker-title">CHOOSE YOUR RIBBON <span>{{ String(ribbonIndex + 1).padStart(2, '0') }} / 05</span></div>
          <div class="swatches">
            <button v-for="(color, i) in ribbons" :key="color" :style="{ background: color }" :class="{ active: ribbonIndex === i }" :aria-label="'Ribbon color ' + (i + 1)" @click="setRibbon(i)"></button>
          </div>
        </div>
        <div class="buy-row">
          <div class="quantity"><button @click="quantity = Math.max(1, quantity - 1)">−</button><span>{{ quantity }}</span><button @click="quantity++">+</button></div>
          <button class="add-button" @click="addToCart">ADD TO BAG <span>↗</span></button>
        </div>
        <button class="custom-link" @click="customOpen = true">MAKE IT YOURS <span>PERSONALISE YOUR HAT ↗</span></button>
        <div class="promise"><span>✳</span> NATURAL FIBRES <span>✳</span> HAND FINISHED <span>✳</span> MADE TO LAST</div>
      </div>
    </section>

    <section id="collection" class="collection-strip">
      <div class="strip-heading"><span>FIND YOUR SHADE</span><i>FOUR SHAPES. ENDLESS SUMMERS.</i></div>
      <div class="mini-products">
        <button v-for="(hat, i) in hats" :key="hat.name" class="mini-product" :class="{ active: selected === i }" @click="changeHat(i - selected)">
          <span class="mini-hat" :style="{ '--hat-color': hat.color, '--ribbon-color': hat.ribbon }"><i></i></span>
          <span class="mini-name">{{ hat.name }}</span><span class="mini-price">¥{{ hat.price }}</span>
        </button>
      </div>
      <a class="all-products" href="#craft">EXPLORE THE ATELIER <span>↗</span></a>
    </section>

    <section id="craft" class="craft-note">
      <div class="craft-number">A LITTLE<br>ABOUT THE<br>WEAVE.</div>
      <div class="craft-copy"><span>THE ART OF SLOW SUMMER</span><h3>Not just a hat.<br><em>A place in the sun.</em></h3></div>
      <p>Each STRAWVERSE piece begins with natural fibres, patient hands and a belief that the best things are never rushed. Find the shape that feels like you. Then take it somewhere beautiful.</p>
      <a id="story" href="#collection">OUR MAKING STORY ↗</a>
    </section>

    <footer class="footer"><span>STRAWVERSE © 2026</span><span>WOVEN FOR THE SUNLIT DAYS</span><span>MADE WITH A LITTLE MORE SUNSHINE ☼</span></footer>

    <Transition name="toast"><div v-if="toast" class="toast-message">✳ {{ toast }}</div></Transition>
    <Transition name="overlay">
      <div v-if="cartOpen" class="drawer-backdrop" @click.self="cartOpen = false">
        <aside class="drawer"><button class="drawer-close" @click="cartOpen = false">×</button><span class="kicker">YOUR SUMMER EDIT</span><h3>Your bag<span>.</span></h3><div class="drawer-item"><span class="drawer-hat">◒</span><div><b>{{ current.name }}</b><small>{{ current.subtitle }}</small><strong>¥{{ current.price }} × {{ cartCount || 0 }}</strong></div></div><div class="drawer-total"><span>SUBTOTAL</span><b>¥{{ current.price * cartCount }}</b></div><button class="checkout" @click="cartOpen = false">CONTINUE EXPLORING ↗</button><p class="drawer-footnote">A little sunshine is on its way.</p></aside>
      </div>
    </Transition>
    <Transition name="overlay">
      <div v-if="customOpen" class="modal-backdrop" @click.self="customOpen = false">
        <div class="custom-modal"><button class="drawer-close" @click="customOpen = false">×</button><span class="kicker">THE PERSONAL TOUCH</span><h3>Make it <em>yours.</em></h3><p>Choose your ribbon above, turn your hat in the light, and find the angle that feels like summer. Every piece is finished by hand.</p><button class="checkout" @click="customOpen = false">BACK TO MY HAT ↗</button></div>
      </div>
    </Transition>
  </main>
</template>
