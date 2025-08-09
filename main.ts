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
    ["Witch", sprites.swamp.witchForward0],
    ["Brute", sprites.castle.heroWalkFront1],
    ["Random", sprites.builtin.angelFish0],
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


// controller.menu.onEvent(ControllerButtonEvent.Pressed, () => {
//     if (!menuIsVisible) {
//         menuIsVisible = true
//         let spells = SPELL_BOOK.map((spell: Spell) => {
//             let can_afford = player.coins >= spell.value
//             let padding = 17 - spell.title.length
//             let item = miniMenu.createMenuItem(`${spell.mana || '*'} ${spell.title}${padStart(spell.value.toString(), padding)}GC`, spell.icon) 
//             item.font = image.font5
//             return item
//         })
        
//         let myMenu = miniMenu.createMenuFromArray(spells)
//         myMenu.setTitle(`Scrolls - you have ${player.coins}GC`)
//         myMenu.setDimensions(scene.screenWidth(), scene.screenHeight())
//         myMenu.setPosition(scene.screenWidth() / 2, scene.screenHeight() / 2)
//         myMenu.setFlag(SpriteFlag.RelativeToCamera, true)
//         myMenu.setStyleProperty(miniMenu.StyleKind.Default, miniMenu.StyleProperty.Margin, 0)
//         myMenu.setStyleProperty(miniMenu.StyleKind.Title, miniMenu.StyleProperty.Padding, 0)
//         myMenu.z = ZLevel.MENU
//         myMenu.onButtonPressed(controller.A, (selection, selectedIndex) => {
//             myMenu.close()
//             let spell: Spell = SPELL_BOOK[selectedIndex]
//             player.secondarySpell = spell
//             console.log(`You chose ${spell.title}`)
//             menuIsVisible = false
//         })
//     }
// })
// let menuIsVisible = false
