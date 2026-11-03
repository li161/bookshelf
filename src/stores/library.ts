import { defineStore } from 'pinia'
import { ref } from 'vue'
export const useLibraryStore = defineStore('library', () => {
 const favorites = ref<string[]>([])
 const activeBook = ref<string | null>(null)
 const space = ref('INFINITE LIBRARY')
 const timeOfDay = ref('AFTERNOON')
 const archiveUnlocked = ref(false)
 const discovered = ref<string[]>([])
 function toggleFavorite(id:string){ favorites.value = favorites.value.includes(id) ? favorites.value.filter(x=>x!==id) : [...favorites.value,id] }
 function discover(id:string){ if(!discovered.value.includes(id)) discovered.value.push(id) }
 return { favorites, activeBook, space, timeOfDay, archiveUnlocked, discovered, toggleFavorite, discover }
})
