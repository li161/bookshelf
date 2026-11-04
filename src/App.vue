<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const zoom = ref(1)
const rotate = ref(0)
const tilt = ref(0)
const hatFocus = ref(false)
const buyOpen = ref(false)
const added = ref(false)
const cartCount = ref(0)
const dragging = ref(false)
const lastX = ref(0)
const lastY = ref(0)
const touchMoved = ref(false)
const stage = ref<HTMLElement | null>(null)
const zoomLabel = computed(() => Math.round((zoom.value - 1) * 100))
let wheelTimer = 0

function onPointerDown(event: PointerEvent) {
  dragging.value = true
  touchMoved.value = false
  lastX.value = event.clientX
  lastY.value = event.clientY
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
}
function onPointerMove(event: PointerEvent) {
  if (!dragging.value) return
  const dx = event.clientX - lastX.value
  const dy = event.clientY - lastY.value
  if (Math.abs(dx) + Math.abs(dy) > 2) touchMoved.value = true
  rotate.value = Math.max(-13, Math.min(13, rotate.value + dx * 0.12))
  tilt.value = Math.max(-5, Math.min(5, tilt.value - dy * 0.035))
  lastX.value = event.clientX
  lastY.value = event.clientY
}
function onPointerUp() { dragging.value = false }
function onWheel(event: WheelEvent) {
  event.preventDefault()
  zoom.value = Math.max(1, Math.min(1.42, zoom.value - event.deltaY * 0.00055))
  window.clearTimeout(wheelTimer)
  wheelTimer = window.setTimeout(() => { zoom.value = Math.max(1, zoom.value) }, 120)
}
function focusHat() {
  if (touchMoved.value) return
  hatFocus.value = !hatFocus.value
  zoom.value = hatFocus.value ? 1.34 : 1
}
function resetView() {
  zoom.value = 1
  rotate.value = 0
  tilt.value = 0
  hatFocus.value = false
}
function addToBag() {
  cartCount.value += 1
  added.value = true
}
onMounted(() => stage.value?.addEventListener('wheel', onWheel, { passive: false }))
onBeforeUnmount(() => {
  stage.value?.removeEventListener('wheel', onWheel)
  window.clearTimeout(wheelTimer)
})
</script>

<template>
  <main class="onepiece-page">
    <div class="film-grain"></div>
    <div class="sun-glow"></div>
    <header class="topbar">
      <a class="brand" href="#" @click.prevent="resetView"><span class="brand-skull">☠</span><span>GRAND LINE<small>STRAW HAT EDITION</small></span></a>
      <div class="top-center"><span class="live-dot"></span> THE ADVENTURE IS OUT THERE</div>
      <button class="bag" @click="buyOpen = true">THE STRAW HAT <span>{{ cartCount.toString().padStart(2, '0') }}</span></button>
    </header>

    <section ref="stage" class="hero-stage" :class="{ 'hat-is-focused': hatFocus }"
      @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp">
      <div class="sky">
        <div class="cloud cloud-a"></div><div class="cloud cloud-b"></div><div class="cloud cloud-c"></div>
        <div class="sun-disc"></div>
      </div>
      <div class="distant-island island-a"></div><div class="distant-island island-b"></div>
      <div class="sea"><div class="sea-light"></div><div class="wave wave-a"></div><div class="wave wave-b"></div><div class="wave wave-c"></div></div>
      <div class="ship-silhouette"><i class="mast"></i><i class="sail sail-one"></i><i class="sail sail-two"></i><i class="hull"></i></div>

      <div class="hero-copy">
        <div class="eyebrow"><span>MONKEY D. LUFFY</span><i></i><span>THE MAN WHO WILL BE KING OF THE PIRATES</span></div>
        <h1>THE <em>STRAW</em><br>HAT BOY<span class="period">.</span></h1>
        <p>“I'm gonna be King of the Pirates!”</p>
        <div class="hero-cta">
          <button class="primary-cta" @click.stop="buyOpen = true">TAKE THE HAT HOME <span>↗</span></button>
          <button class="story-cta" @click.stop="focusHat">DISCOVER THE LEGEND <span>↓</span></button>
        </div>
      </div>

      <div class="character-wrap" :style="{ transform: `translate(-50%, -50%) scale(${zoom}) rotateY(${rotate}deg) rotateX(${tilt}deg)` }">
        <svg class="luffy-art" viewBox="0 0 650 900" role="img" aria-label="Illustration of Monkey D. Luffy wearing his iconic straw hat">
          <defs>
            <linearGradient id="skin" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffd39b"/><stop offset=".55" stop-color="#e9a96e"/><stop offset="1" stop-color="#bd704c"/></linearGradient>
            <linearGradient id="straw" x1="0" y1="0" x2=".15" y2="1"><stop stop-color="#f9d879"/><stop offset=".5" stop-color="#d9a844"/><stop offset="1" stop-color="#a9752d"/></linearGradient>
            <linearGradient id="red" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ef5544"/><stop offset="1" stop-color="#a92224"/></linearGradient>
            <linearGradient id="blue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#2876a4"/><stop offset="1" stop-color="#123c64"/></linearGradient>
            <filter id="shadow"><feGaussianBlur stdDeviation="12"/></filter>
          </defs>
          <ellipse cx="330" cy="860" rx="170" ry="25" fill="#173c4a" opacity=".24" filter="url(#shadow)"/>
          <!-- legs -->
          <path d="M253 672 Q235 742 226 804 L275 819 Q305 755 322 692Z" fill="url(#skin)" stroke="#8c4f39" stroke-width="5"/>
          <path d="M363 678 Q385 745 398 807 L449 800 Q447 728 414 665Z" fill="url(#skin)" stroke="#8c4f39" stroke-width="5"/>
          <path d="M224 798 Q210 818 199 839 Q222 861 294 852 L299 827 Q267 816 275 803Z" fill="#292d35" stroke="#171e27" stroke-width="5"/>
          <path d="M394 800 Q384 823 377 842 Q404 861 472 836 L457 805 Q426 815 449 798Z" fill="#292d35" stroke="#171e27" stroke-width="5"/>
          <path d="M242 832 L279 832 M416 830 L450 820" stroke="#f0c56d" stroke-width="8" stroke-linecap="round"/>
          <!-- torso and arms -->
          <path d="M258 392 Q213 405 190 470 L155 610 Q145 646 178 661 Q206 675 220 640 L276 525Z" fill="url(#skin)" stroke="#874d37" stroke-width="6"/>
          <path d="M390 390 Q441 405 466 475 L496 605 Q504 641 473 655 Q445 668 430 633 L373 519Z" fill="url(#skin)" stroke="#874d37" stroke-width="6"/>
          <path d="M155 607 Q133 614 132 640 Q132 665 163 671 L189 657 L179 621Z" fill="url(#skin)" stroke="#874d37" stroke-width="5"/>
          <path d="M473 606 Q498 609 508 634 Q514 659 485 672 L457 655 L456 621Z" fill="url(#skin)" stroke="#874d37" stroke-width="5"/>
          <path d="M247 382 Q323 351 403 383 L432 600 Q438 655 399 695 Q326 727 248 691 Q220 654 225 602Z" fill="url(#red)" stroke="#8c2528" stroke-width="7"/>
          <!-- vest edges and open chest -->
          <path d="M276 385 L315 475 L283 515 L241 405Z" fill="#f7f0dc" opacity=".95"/>
          <path d="M372 379 L337 475 L372 516 L412 405Z" fill="#f7f0dc" opacity=".95"/>
          <path d="M313 468 L339 468 L359 548 L330 575 L298 548Z" fill="url(#skin)" stroke="#b66f4b" stroke-width="4"/>
          <path d="M270 405 Q288 425 305 451 M385 402 Q367 427 350 452" fill="none" stroke="#9d2528" stroke-width="7"/>
          <path d="M244 624 Q325 651 414 623" fill="none" stroke="#8d2929" stroke-width="6"/>
          <!-- shorts -->
          <path d="M229 652 Q323 680 425 648 L430 738 Q388 760 343 738 L326 704 L307 742 Q264 759 216 729Z" fill="url(#blue)" stroke="#102f4b" stroke-width="7"/>
          <path d="M326 704 L343 738 M236 683 Q275 697 310 693 M350 694 Q391 695 421 679" fill="none" stroke="#5da1c4" stroke-width="6"/>
          <path d="M237 725 L302 737 M350 738 L417 723" stroke="#0e2d49" stroke-width="6"/>
          <!-- neck -->
          <path d="M282 324 L280 395 Q320 435 367 392 L361 318Z" fill="url(#skin)" stroke="#9b5c41" stroke-width="5"/>
          <!-- ears and head -->
          <ellipse cx="224" cy="251" rx="31" ry="44" fill="url(#skin)" stroke="#9a5b40" stroke-width="5"/>
          <ellipse cx="423" cy="251" rx="31" ry="44" fill="url(#skin)" stroke="#9a5b40" stroke-width="5"/>
          <path d="M227 205 Q222 132 285 112 Q359 87 412 143 Q448 185 422 285 Q414 349 361 382 Q318 402 270 367 Q224 326 227 205Z" fill="url(#skin)" stroke="#995b40" stroke-width="6"/>
          <!-- hair silhouette -->
          <path d="M222 242 Q185 190 211 133 L184 115 L235 105 L222 66 L275 94 L293 52 L324 91 L363 54 L370 101 L426 89 L405 128 Q453 161 438 229 L420 251 L399 182 L375 207 L357 166 L331 200 L303 165 L278 206 L251 179Z" fill="#171b20" stroke="#10151a" stroke-width="7" stroke-linejoin="round"/>
          <path d="M235 223 Q257 184 291 178 M384 180 Q412 196 420 232" fill="none" stroke="#333a40" stroke-width="8" stroke-linecap="round"/>
          <!-- face -->
          <path d="M255 263 Q278 250 299 265" fill="none" stroke="#38251f" stroke-width="8" stroke-linecap="round"/>
          <path d="M353 265 Q378 250 399 264" fill="none" stroke="#38251f" stroke-width="8" stroke-linecap="round"/>
          <ellipse cx="282" cy="281" rx="9" ry="15" fill="#201c1b"/><ellipse cx="375" cy="281" rx="9" ry="15" fill="#201c1b"/>
          <circle cx="285" cy="276" r="3" fill="#fff"/><circle cx="378" cy="276" r="3" fill="#fff"/>
          <path d="M324 286 Q311 309 328 312" fill="none" stroke="#a76143" stroke-width="5" stroke-linecap="round"/>
          <path d="M300 335 Q328 353 356 332" fill="none" stroke="#873e32" stroke-width="6" stroke-linecap="round"/>
          <path d="M304 335 Q328 344 352 334" fill="none" stroke="#fff1d6" stroke-width="5" stroke-linecap="round"/>
          <!-- iconic scar below left eye -->
          <path d="M270 302 L292 321 M292 302 L270 321" stroke="#a33f32" stroke-width="5" stroke-linecap="round"/>
          <!-- straw hat crown -->
          <path d="M199 193 Q211 106 270 75 Q327 43 383 78 Q427 104 448 191 Q327 173 199 193Z" fill="url(#straw)" stroke="#9b6d2e" stroke-width="7"/>
          <path d="M215 159 Q325 116 432 161 M225 137 Q327 97 416 140 M248 105 Q328 75 391 112" fill="none" stroke="#f9e4a1" stroke-width="5" opacity=".8"/>
          <path d="M205 179 Q325 157 443 180 L466 218 Q325 198 184 223Z" fill="#d8aa4d" stroke="#976a2c" stroke-width="7"/>
          <path d="M188 205 Q325 180 464 202" fill="none" stroke="#f4d57d" stroke-width="6"/>
          <!-- red hat band -->
          <path d="M205 171 Q325 145 439 173 L448 196 Q326 173 198 198Z" fill="#c72f2d" stroke="#8f2023" stroke-width="4"/>
          <path d="M216 178 Q325 156 430 179" fill="none" stroke="#f36a50" stroke-width="4" opacity=".8"/>
          <!-- chin/hat string -->
          <path d="M204 194 Q190 269 222 350 Q245 403 286 414" fill="none" stroke="#c52f2d" stroke-width="7" stroke-linecap="round"/>
          <path d="M440 192 Q466 273 434 353 Q415 395 376 414" fill="none" stroke="#c52f2d" stroke-width="7" stroke-linecap="round"/>
          <circle cx="286" cy="414" r="7" fill="#d83c32"/><circle cx="376" cy="414" r="7" fill="#d83c32"/>
          <!-- hat detail glints -->
          <path d="M240 120 Q275 91 303 87" fill="none" stroke="#fff1bb" stroke-width="6" stroke-linecap="round" opacity=".65"/>
        </svg>
        <button class="hat-hotspot" aria-label="Explore Luffy's straw hat" @click.stop="focusHat"><span>✳</span><i>THE ONE PIECE</i></button>
      </div>

      <div class="side-note note-left"><span>01</span><i>THE STRAW HAT</i><b>Inherited will.<br>Endless freedom.</b></div>
      <div class="side-note note-right"><i>WANTED / DREAM BIG</i><span>ゴムゴムの</span></div>
      <div class="bottom-meta"><span>GRAND LINE · EAST BLUE</span><span>DRAG TO LOOK AROUND <b>↔</b></span><span>EST. THE NEXT KING OF THE PIRATES</span></div>
      <div class="zoom-indicator" v-if="zoomLabel > 0">LENS +{{ zoomLabel }}%</div>
      <button class="reset-view" @click.stop="resetView">↺ RESET VIEW</button>
      <div v-if="hatFocus" class="hat-detail-card" @click.stop>
        <button class="detail-close" @click="focusHat">×</button>
        <span>THE ICONIC STRAW HAT</span><strong>A promise that never fades.</strong>
        <p>Natural straw · Red ribbon · The spirit of adventure</p>
        <button @click="buyOpen = true">MAKE IT YOURS ↗</button>
      </div>
    </section>

    <footer class="bottom-bar">
      <span>ONE BOY. ONE HAT. ONE BIG DREAM.</span>
      <span class="footer-mark">✳</span>
      <span>SET SAIL. FIND YOUR FREEDOM.</span>
    </footer>

    <Transition name="modal">
      <div v-if="buyOpen" class="buy-overlay" @click.self="buyOpen = false">
        <section class="buy-panel">
          <button class="close" @click="buyOpen = false">×</button>
          <span class="panel-kicker">THE SYMBOL OF A PROMISE</span>
          <div class="mini-straw-hat"><i></i></div>
          <h2>The Straw Hat<span>.</span></h2>
          <p>One hat. A thousand adventures. Carry the spirit of the sea with you.</p>
          <div class="product-spec"><span>HANDWOVEN STRAW</span><span>ICONIC RED BAND</span><span>ADVENTURE READY</span></div>
          <div class="panel-price"><strong>¥ 3,980</strong><small>LIMITED FAN COLLECTION</small></div>
          <button class="panel-buy" @click="addToBag">{{ added ? 'ADDED TO YOUR BAG ✓' : 'ADD THE STRAW HAT TO BAG ↗' }}</button>
          <small class="fan-note">Unofficial fan concept · Not affiliated with the official One Piece brand.</small>
        </section>
      </div>
    </Transition>
  </main>
</template>