namespace ZLevel {
    export const ITEMS = 100
    export const ENEMIES = 200
    export const PLAYER = 400
    export const SPELLS = 500
    export const FLOATER = 600
    export const UI = 1000
    export const MENU = 1100
}

// SETUP
let current_level = -1

const LEVELS = [
    tilemap`level 1`,
    tilemap`level 2`,
    tilemap`level 3`
]

game.splash("Welcome to the", "Crawling DUNGEON!")

info.showScore(false)
game.setGameOverScoringType(game.ScoringType.HighScore)

const player = new Player()

init_inventory()
advance_level()

controller.menu.onEvent(ControllerButtonEvent.Pressed, () => {
    if (!menuIsVisible) {
        menuIsVisible = true
        let spells = SPELL_BOOK.map((spell: Spell) => {
            let can_afford = player.coins >= spell.value
            let padding = 17 - spell.title.length
            let item = miniMenu.createMenuItem(`${spell.mana || '*'} ${spell.title}${padStart(spell.value.toString(), padding)}GC`, spell.icon) 
            item.font = image.font5
            return item
        })
        
        let myMenu = miniMenu.createMenuFromArray(spells)
        myMenu.setTitle(`Scrolls - you have ${player.coins}GC`)
        myMenu.setDimensions(scene.screenWidth(), scene.screenHeight())
        myMenu.setPosition(scene.screenWidth() / 2, scene.screenHeight() / 2)
        myMenu.setFlag(SpriteFlag.RelativeToCamera, true)
        myMenu.setStyleProperty(miniMenu.StyleKind.Default, miniMenu.StyleProperty.Margin, 0)
        myMenu.setStyleProperty(miniMenu.StyleKind.Title, miniMenu.StyleProperty.Padding, 0)
        myMenu.z = ZLevel.MENU
        myMenu.onButtonPressed(controller.A, (selection, selectedIndex) => {
            myMenu.close()
            let spell: Spell = SPELL_BOOK[selectedIndex]
            player.secondarySpell = spell
            console.log(`You chose ${spell.title}`)
            menuIsVisible = false
        })
    }
})
let menuIsVisible = false
