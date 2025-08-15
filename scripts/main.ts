const NOT_IMPLEMENTED = "Not implemented!"

namespace ZOrder {
    export const ITEMS: int8 = 0
    export const ENEMIES: int8 = 1
    export const PET: int8 = 2
    export const PLAYER: int8 = 3
    export const SPELLS: int8 = 4
    export const FLOATER: int8 = 5
    export const UI: int8 = 250
}


// SETUP
let dungeon: Dungeon
let gui: Gui
let playerClass: string
let player: Player

const dataStore = new DataStore()
dataStore.unlockClass(Druid.title)
dataStore.unlockClass(Necromancer.title)
dataStore.unlockClass(BloodWitch.title)
dataStore.unlockRandom()

storyboard.replace(scenes.INTRO)