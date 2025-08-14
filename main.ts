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

function chooseYourClass(): void {
    let options = dataStore.classes.map<MenuOption>((title: string) => {
        return [playerIcon(title), title]
    })

    if (dataStore.randomUnlocked) {
        options.push([Random.icon, Random.title])
    }

    new Menu(sprites.dungeon.statueLight, "Who are you?", options, false,
        (selected: string, index: number): boolean => {
            if (index == Menu.CANCELLED) {
                return true // Disable cancel button!
            }

            if (selected == Random.title) {
                selected = dataStore.classes[randint(0, dataStore.classes.length - 1)]
            }

            player = createPlayer(selected)

            gui = new Gui()
            dungeon = new Dungeon()

            return false
        }
    )
}

type PlayerConstructor = new (title: string) => Player

function playerIcon(title: string): Image {
    switch (title) {
        case Druid.title: return Druid.icon
        case Wizard.title: return Wizard.icon
        case BloodWitch.title: return BloodWitch.icon
        case Necromancer.title: return Necromancer.icon
        case Random.title: return Random.icon
        default: throw title
    }
}

function createPlayer(title: string): Player {
    switch (title) {
        case Druid.title: return new Druid(title)
        case Wizard.title: return new Wizard(title)
        case BloodWitch.title: return new BloodWitch(title)
        case Necromancer.title: return new Necromancer(title)
        default: throw title
    }
}


// SETUP
const dataStore = new DataStore()
dataStore.unlockClass("Druid")

let player: Player
let dungeon: Dungeon
let gui: Gui

new StartMessage(chooseYourClass)
