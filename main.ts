namespace ZOrder {
    export const ITEMS: int8 = 0
    export const ENEMIES: int8 = 1
    export const PLAYER: int8 = 2
    export const SPELLS: int8 = 3
    export const FLOATER: int8 = 4
    export const UI: int8 = 250
}

function chooseYourClass() {
    let options = dataStore.classes.map<MenuOption>((klass, i) => [sprites.dungeon.doorOpenNorth, klass])
    
    new Menu(sprites.dungeon.statueLight, "Who are you?", options, false,
        (selected: string, index: number) => {
            if (index == Menu.CANCELLED) {
                return true
            }
            
            if (selected == Random.title) {
                selected = dataStore.classes[randint(0, dataStore.classes.length - 2)]
            }

            player = createPlayer(selected)
            gui = new Gui()
            dungeon = new Dungeon()

            return false
        }
    )
}

function createPlayer(klass: string): Player {
    switch (klass) {
        case Witch.title: return new Witch(klass)
        case Haemomancer.title: return new Haemomancer(klass)
        default: throw klass
    }
}

// SETUP
let player: Player
let dungeon: Dungeon
let gui: Gui

new StartMessage(chooseYourClass)
