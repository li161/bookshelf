export type BookSeed = { id:string; title:string; author:string; genre:string; color:string; accent:string; world:string; description:string; pages:number; }
export const books: BookSeed[] = [
 {id:'atlas',title:'THE ATLAS OF ELSEWHERE',author:'M. A. Rowan',genre:'Exploration',color:'#283b3a',accent:'#c6a879',world:'AETHER',description:'A cartographer discovers a continent that only appears between waking and sleep.',pages:248},
 {id:'ocean',title:'THE SILENT OCEAN',author:'Iris Vale',genre:'Ocean',color:'#173c50',accent:'#80b6bd',world:'PELAGIC',description:'Descend through a luminous ocean where forgotten cities breathe beneath the tide.',pages:312},
 {id:'cosmos',title:'ORBITAL DREAMS',author:'Elias North',genre:'Science',color:'#33304a',accent:'#c1a5db',world:'COSMOS',description:'An observatory at the edge of time receives a signal from the first stars.',pages:196},
 {id:'botany',title:'A FIELD GUIDE TO WILD THINGS',author:'June Alder',genre:'Nature',color:'#40513b',accent:'#d1bc83',world:'VERDANT',description:'A botanical expedition into a forest that remembers every footstep.',pages:184},
 {id:'alchemy',title:'THE ART OF ALCHEMY',author:'S. Wren',genre:'Fantasy',color:'#65402e',accent:'#d6a45c',world:'EMBER',description:'A brass key unlocks a workshop where matter has a memory.',pages:276},
 {id:'architecture',title:'SPACES FOR THE SOUL',author:'Noah Atelier',genre:'Design',color:'#b4a48a',accent:'#514a3e',world:'FORM',description:'Quiet architecture, monumental light, and the poetry of inhabited space.',pages:220},
 {id:'poetry',title:'SMALL HOURS',author:'Ada Bell',genre:'Poetry',color:'#5a3445',accent:'#e4b8a7',world:'NOCTURNE',description:'A collection of poems written in the soft hour before dawn.',pages:128},
 {id:'history',title:'THE MEMORY KEEPERS',author:'Theo March',genre:'History',color:'#766044',accent:'#e0c58e',world:'ARCHIVE',description:'A hidden archive preserves the moments history nearly forgot.',pages:352},
 {id:'music',title:'THE SHAPE OF SOUND',author:'Luca Reed',genre:'Music',color:'#35475c',accent:'#b7c9d7',world:'RESONANCE',description:'A journey through rooms built from rhythm, silence, and vibration.',pages:204},
 {id:'myth',title:'MYTHS OF THE MOON',author:'R. Sol',genre:'Mythology',color:'#4d425f',accent:'#d4c2e6',world:'LUNARIA',description:'Ancient myths unfold on a moonlit landscape beyond the known world.',pages:288},
 {id:'cooking',title:'THE LAST SUPPER CLUB',author:'Mina Hart',genre:'Food',color:'#8a4b32',accent:'#f0c58c',world:'SAVOR',description:'Recipes and stories from a kitchen that welcomes every traveler.',pages:168},
 {id:'future',title:'TOMORROW, REWRITTEN',author:'Kai Mercer',genre:'Futures',color:'#42505a',accent:'#c5d2cb',world:'TOMORROW',description:'A speculative field manual for building kinder possible futures.',pages:240}
]
