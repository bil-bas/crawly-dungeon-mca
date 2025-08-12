namespace ZOrder {
    export const ITEMS: int8 = 0
    export const ENEMIES: int8 = 1
    export const PLAYER: int8 = 2
    export const SPELLS: int8 = 3
    export const FLOATER: int8 = 4
    export const UI: int8 = 250
}

function start() {
    game.splash("Welcome to the", "Crawling DUNGEON!")

    dataStore.unlockClass(Haemomancer.title)

    new Menu(sprites.dungeon.statueLight, "Who are you?", dataStore.classes, false,
        (selected: string, index: number) => {
            if (index == Menu.CANCELLED) {
                return true
            }
            
            if (selected == Random.title) {
                selected = dataStore.classes[randint(0, dataStore.classes.length - 2)]
            }

            player = createPlayer(selected)
            init_inventory()
            dungeon = new Dungeon()

            return false
        }
    )
}

function createPlayer(title: string): Player {
    switch (title) {
        case Witch.title: return new Witch()
        case Haemomancer.title: return new Haemomancer()
        case Archmage.title: return new Archmage()
        default: return null
    }
}

// SETUP
let player: Player
let dungeon: Dungeon

start()

