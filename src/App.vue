<script setup lang="ts">
import { computed, ref } from 'vue'
import LibraryScene from './components/LibraryScene.vue'
import { books, type BookSeed } from './data/books'
import { useLibraryStore } from './stores/library'
const store=useLibraryStore()
const mode=ref('FLOATING BOOKS'),time=ref('AFTERNOON'),active=ref<BookSeed|null>(null),opened=ref<BookSeed|null>(null),search=ref(''),showSearch=ref(false),showShelf=ref(false),showSettings=ref(false),showGalaxy=ref(false),showArchive=ref(false),page=ref(0),sound=ref(false)
const scene=ref<InstanceType<typeof LibraryScene>>()
const filtered=computed(()=>books.filter(b=>(b.title+' '+b.author+' '+b.genre).toLowerCase().includes(search.value.toLowerCase())))
const favorite=computed(()=>active.value?store.favorites.includes(active.value.id):false)
const isWorld=computed(()=>!!opened.value)
function choose(b:BookSeed){active.value=b}
function enter(b:BookSeed){opened.value=b;page.value=0;scene.value?.enterWorld(b.id)}
function closeWorld(){opened.value=null;scene.value?.returnLibrary()}
function go(modeName:string){mode.value=modeName;store.space=modeName;if(modeName==='SECRET ARCHIVE')showArchive.value=true;if(modeName==='KNOWLEDGE GALAXY')showGalaxy.value=true}
function toggleFav(){if(active.value)store.toggleFavorite(active.value.id)}
function openSaved(id:string){const b=books.find(x=>x.id===id);if(b){active.value=b;showShelf.value=false;scene.value?.openBook(id)}}
function discoverSecret(){store.archiveUnlocked=true;store.discover('secret-door');showArchive.value=false;go('SECRET ARCHIVE')}
</script>
<template>
 <main class="app-shell">
  <LibraryScene ref="scene" :mode="mode" :selected-time="time" :active-book="null" @select="choose" @enter="enter" />
  <div class="vignette"></div>
  <header class="topbar">
   <button class="brand" @click="go('INFINITE LIBRARY')"><span class="brand-mark">B</span><span>BOOKVERSE<small>THE INFINITE LIBRARY</small></span></button>
   <nav class="top-actions">
    <button @click="showSearch=!showSearch"><span class="nav-icon">⌕</span> SEARCH</button>
    <button @click="showShelf=true"><span class="nav-icon">▤</span> MY LIBRARY <i>{{store.favorites.length}}</i></button>
    <button class="settings-btn" @click="showSettings=!showSettings">☼</button>
   </nav>
  </header>
  <transition name="fade"><section v-if="showSearch" class="search-panel"><input v-model="search" autofocus placeholder="Search titles, authors, worlds…" /><button @click="showSearch=false">ESC</button><div class="search-results"><button v-for="b in filtered.slice(0,5)" :key="b.id" @click="choose(b);scene?.openBook(b.id);showSearch=false"><span>{{b.title}}</span><small>{{b.author}} · {{b.genre}}</small></button></div></section></transition>
  <section class="intro-copy" v-if="!isWorld && mode !== 'FLOATING BOOKS'"><div class="eyebrow"><span></span> A PLACE BETWEEN STORIES</div><h1>Somewhere,<br><em>a story is waiting.</em></h1><p>Wander through impossible shelves. Find a book.<br>Open a door to another world.</p><button class="explore-btn" @click="go('INFINITE LIBRARY')">EXPLORE THE LIBRARY <span>↗</span></button></section>
  <aside class="book-info" v-if="active&&!isWorld && mode !== 'FLOATING BOOKS'">
   <button class="close-info" @click="active=null">×</button><div class="info-label">SELECTED VOLUME <span>NO. {{String(books.findIndex(x=>x.id===active?.id)+1).padStart(2,'0')}}</span></div>
   <div class="mini-book" :style="{'--book-color':active.color,'--book-accent':active.accent}"><div class="mini-spine"></div><div class="mini-cover"><small>BOOKVERSE EDITION</small><b>{{active.title}}</b><i>{{active.author}}</i><span>✳</span></div></div>
   <div class="info-genre">{{active.genre}} <span>·</span> {{active.pages}} PAGES</div><h2>{{active.title}}</h2><p>{{active.description}}</p>
   <div class="info-actions"><button class="open-btn" @click="enter(active!)">OPEN THIS BOOK <span>↗</span></button><button class="save-btn" :class="{saved:favorite}" @click="toggleFav">{{favorite?'♥':'♡'}}</button></div>
   <div class="world-destination">DESTINATION <b>{{active.world}} WORLD</b></div>
  </aside>
  <section v-if="isWorld" class="world-overlay"><div class="world-top"><button @click="closeWorld">← BACK TO LIBRARY</button><span>BOOKVERSE / {{opened?.world}} WORLD</span></div><div class="world-title"><span>YOU HAVE CROSSED THE PAGE</span><h1>{{opened?.world}}</h1><p>{{opened?.description}}</p><div class="world-progress"><button @click="page=Math.max(0,page-1)">←</button><span>PAGE {{String(page+1).padStart(2,'0')}} / {{opened?.pages}}</span><button @click="page++">→</button></div></div><div class="world-caption">A WORLD UNFOLDS AS YOU READ</div></section>
  <footer class="bottom-ui" v-if="!isWorld">
   <div class="location"><span class="location-line"></span><div><small>YOU ARE EXPLORING</small><b>{{mode}}</b></div></div>
   <nav class="space-nav"><button :class="{active:mode==='INFINITE LIBRARY'}" @click="go('INFINITE LIBRARY')">01 <span>LIBRARY</span></button><button :class="{active:mode==='FLOATING BOOKS'}" @click="go('FLOATING BOOKS')">02 <span>FLOATING</span></button><button :class="{active:mode==='TIME ROOM'}" @click="go('TIME ROOM')">03 <span>TIME ROOM</span></button><button :class="{active:mode==='KNOWLEDGE GALAXY'}" @click="go('KNOWLEDGE GALAXY')">04 <span>GALAXY</span></button><button :class="{active:mode==='SECRET ARCHIVE'}" @click="go('SECRET ARCHIVE')">05 <span>ARCHIVE</span></button></nav>
   <div class="volume-count"><b>12</b><span>VOLUMES<br>IN THIS SPACE</span></div>
  </footer>
  <section v-if="mode==='TIME ROOM'&&!isWorld" class="time-panel"><small>THE LIGHT CHANGES EVERYTHING</small><div><button v-for="t in ['SUNRISE','AFTERNOON','RAINY DAY','MIDNIGHT']" :key="t" :class="{active:time===t}" @click="time=t">{{t}}</button></div></section>
  <section v-if="mode==='KNOWLEDGE GALAXY'&&!isWorld" class="mode-note"><small>CONNECTED BY CURIOSITY</small><h2>Knowledge<br><em>has no edges.</em></h2><p>12 volumes · 8 constellations</p></section>
  <section v-if="mode==='SECRET ARCHIVE'&&!isWorld" class="archive-note"><small>RESTRICTED COLLECTION</small><h2>The shelves<br><em>remember you.</em></h2><button @click="discoverSecret">UNSEAL THE ARCHIVE ↗</button></section>
  <transition name="fade"><div v-if="showShelf||showSettings||showGalaxy||showArchive" class="drawer-backdrop" @click.self="showShelf=false;showSettings=false;showGalaxy=false;showArchive=false">
   <section class="drawer" v-if="showShelf"><button class="drawer-close" @click="showShelf=false">×</button><small>YOUR PERSONAL COLLECTION</small><h2>My Library<span>.</span></h2><p>Stories you have chosen to keep.</p><div v-if="store.favorites.length" class="saved-list"><button v-for="id in store.favorites" :key="id" @click="openSaved(id)"><span class="saved-swatch" :style="{background:books.find(b=>b.id===id)?.color}"></span><span><b>{{books.find(b=>b.id===id)?.title}}</b><small>{{books.find(b=>b.id===id)?.author}}</small></span><i>↗</i></button></div><div v-else class="empty-state">Your shelf is waiting.<br><span>Save a volume to begin your collection.</span></div></section>
   <section class="drawer" v-else-if="showSettings"><button class="drawer-close" @click="showSettings=false">×</button><small>PERSONAL PREFERENCES</small><h2>Settings<span>.</span></h2><div class="setting-row"><span>Ambient sound</span><button @click="sound=!sound">{{sound?'ON':'OFF'}}</button></div><div class="setting-row"><span>Motion effects</span><b>ENABLED</b></div><div class="setting-row"><span>Render quality</span><b>AUTO</b></div><p class="drawer-foot">BOOKVERSE · VERSION 1.0</p></section>
   <section class="drawer" v-else><button class="drawer-close" @click="showGalaxy=false;showArchive=false">×</button><small>{{showArchive?'A DOOR BETWEEN THE SHELVES':'A SECRET IS WAITING'}}</small><h2>{{showArchive?'Secret Archive':'Knowledge Galaxy'}}<span>.</span></h2><p>{{showArchive?'Three hidden marks are scattered through the library. Find the old volume to unlock the archive.':'Explore the books as a constellation of connected ideas.'}}</p><button class="drawer-cta" @click="showArchive?discoverSecret():(showGalaxy=false)"> {{showArchive?'UNLOCK ARCHIVE':'EXPLORE CONSTELLATION'}} ↗</button></section>
  </div></transition>
  <div class="corner-coord">51°30'26.4"N&nbsp;&nbsp; 00°07'39.0"W <span>·</span> EST. BEYOND TIME</div>
 </main>
</template>
