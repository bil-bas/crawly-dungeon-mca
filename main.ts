namespace ZLevel {
    export const ITEMS = 100
    export const ENEMIES = 200
    export const PLAYER = 400
    export const SPELLS = 500
    export const FLOATER = 600
    export const UI = 1000
    export const MENU = 1100
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

    let menu: Menu

    menu = new Menu("Who are you?", CLASSES,
        (selectedIndex: number) => {
            menu.close()

            if (selectedIndex == CLASSES.length - 1) {
                selectedIndex = randint(0, CLASSES.length - 2)
            }

            if (selectedIndex == 0) {
                player = new Witch()
            } else if (selectedIndex == 1) {
                player = new Brute()
            } else {
                throw "ook"
            }

            init_inventory()
            dungeon = new Dungeon(LEVELS)
        }
    )
}

// SETUP
let player: Player
let dungeon: Dungeon

start()

