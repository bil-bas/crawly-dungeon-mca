namespace ZOrder {
    export const ITEMS = 0
    export const ENEMIES = 1
    export const PLAYER = 2
    export const SPELLS = 3
    export const FLOATER = 4
    export const UI = 500
}

const CLASSES = [
    "Witch",
    "Brute",
    "Random",
]

const LEVELS = [
    tilemap`level 1`,
    tilemap`level 2`,
    tilemap`level 3`,
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
            dungeon = new Dungeon(LEVELS)

            closeup.close()

            return false
        }
    )
}

// SETUP
let player: Player
let dungeon: Dungeon

start()

