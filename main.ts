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

    let closeup = new Closeup(sprites.dungeon.statueLight)

    new Menu("Who are you?", CLASSES,
        (selected: string, _: number) => {
            if (selected == "Random") {
                selected = CLASSES[randint(0, CLASSES.length - 2)]
            }

            if (selected == "Witch") {
                player = new Witch()
            } else if (selected == "Brute") {
                player = new Brute()
            }

            init_inventory()
            dungeon = new Dungeon()

            closeup.close()

            return false
        }
    )
}

// SETUP
let player: Player
let dungeon: Dungeon

start()

