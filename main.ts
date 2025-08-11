namespace ZOrder {
    export const ITEMS: int8 = 0
    export const ENEMIES: int8 = 1
    export const PLAYER: int8 = 2
    export const SPELLS: int8 = 3
    export const FLOATER: int8 = 4
    export const UI: int8 = 250
}

const CLASSES = [
    "Witch",
    "Brute",
    "Random",
]

function start() {
    game.splash("Welcome to the", "Crawling DUNGEON!")

    new Menu(sprites.dungeon.statueLight, "Who are you?", CLASSES, false,
        (selected: string, index: number) => {
            if (index == Menu.CANCELLED) {
                return true
            }
            
            if (selected == "Random") {
                selected = CLASSES[randint(0, CLASSES.length - 2)]
            }

            if (index == 0) {
                player = new Witch()
            } else if (index == 1) {
                player = new Brute()
            }

            init_inventory()
            dungeon = new Dungeon()

            return false
        }
    )
}

// SETUP
let player: Player
let dungeon: Dungeon

start()

