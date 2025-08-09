const STATUS_BAR_MARGIN = 1
const STATUS_BAR_HEIGHT = 6

class Menu {
    static isOpen = false
    _menu: miniMenu.MenuSprite = null

    constructor(title: string, items: any[][], handler: any) {
        Menu.isOpen = true

        this._menu = miniMenu.createMenuFromArray(items.map((item) => {
            return miniMenu.createMenuItem(item[0], item[1])
        }))
        this._menu.setTitle(` ${title}`)
        this._menu.setDimensions(scene.screenWidth(), scene.screenHeight())
        this._menu.setPosition(scene.screenWidth() / 2, scene.screenHeight() / 2)
        this._menu.setFlag(SpriteFlag.RelativeToCamera, true)
        this._menu.setStyleProperty(miniMenu.StyleKind.Default, miniMenu.StyleProperty.Margin, 0)
        this._menu.setStyleProperty(miniMenu.StyleKind.Title, miniMenu.StyleProperty.Padding, 0)
        this._menu.z = ZLevel.MENU
        
        this._menu.onButtonPressed(controller.A, () => {
            Menu.isOpen = false

            handler(this._menu.selectedIndex)
        })

        // Ignore interface.
        this._menu.onButtonPressed(controller.left, () => { })
        this._menu.onButtonPressed(controller.right, () => { })
        this._menu.onButtonPressed(controller.B, () => { })
    }

    close() {
        this._menu.close()
    }
}

// Indicate a change with floating message.
function change_floater(icon: Image, change: number) {
    let text = textsprite.create((change > 0 ? "+" : "") + ("" + change))
    text.setMaxFontHeight(5)
    text.setIcon(icon)
    text.z = ZLevel.FLOATER
    text.setPosition(player.sprite.x, player.sprite.y - 8)
    text.vy = -10
    timer.after(500, () => {
        sprites.destroy(text)
    })
}

// Create stat label for top of screen.
function create_label(icon: Image) {
    let label = textsprite.create("x0", 0, 1)
    label.z = ZLevel.UI
    label.setIcon(icon)
    label.setOutline(Colour.WHITE, Colour.PURPLE)
    label.setFlag(SpriteFlag.RelativeToCamera, true)
    return label
}

function update_labels() {
    key_label.setText(`x${player.keys}`)
    coin_label.setText(`${player.coins}`)

    life_status.value = player.life
    life_status.max = player.maxLife
    life_label.setText(`${player.life}/${player.maxLife}`)

    magic_status.value = player.mana
    magic_status.max = player.maxMana
    magic_label.setText(`${player.mana}/${player.maxMana}`)
    magic_label.right = screen.width

    coin_label.right = 150
}

function init_inventory() {
    life_status = statusbars.create(46, STATUS_BAR_HEIGHT, StatusBarKind.Health)
    life_status.setFlag(SpriteFlag.RelativeToCamera, true)
    life_status.bottom = screen.height
    life_status.right = screen.width / 2 + 1
    life_status.z = ZLevel.UI
    life_status.setBarBorder(1, 15)
    life_status.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
    life_status.setColor(Colour.RED, Colour.DARK_PURPLE, Colour.BROWN)

    life_label = create_label(sprites.projectile.heart3)
    life_label.left = -4
    life_label.bottom = screen.height + 5

    magic_status = statusbars.create(45, STATUS_BAR_HEIGHT, StatusBarKind.Magic)
    magic_status.setFlag(SpriteFlag.RelativeToCamera, true)
    magic_status.bottom = screen.height
    magic_status.left = screen.width / 2
    magic_status.z = ZLevel.UI
    magic_status.setBarBorder(1, 15)
    magic_status.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
    magic_status.setStatusBarFlag(StatusBarFlag.LabelAtEnd, true)
    magic_status.setColor(Colour.BLUE, Colour.DARK_PURPLE, Colour.LIGHT_BLUE)
        
    magic_label = create_label(sprites.projectile.firework1)
    magic_label.right = screen.width
    magic_label.bottom = screen.height + 5

    key_label = create_label(assets.image`key`)
    key_label.left = -4
    key_label.bottom = scene.screenHeight() - 8

    coin_label = textsprite.create("0")
    coin_label.setOutline(Colour.WHITE, Colour.PURPLE)
    coin_label.setFlag(SpriteFlag.RelativeToCamera, true)
    coin_label.z = ZLevel.UI
    coin_label.top = 0
    coin_label.right = 150

    coin_label.data["icon"] = sprites.create(sprites.builtin.coin0)
    coin_label.data["icon"].setFlag(SpriteFlag.RelativeToCamera, true)
    coin_label.data["icon"].z = ZLevel.UI
    coin_label.data["icon"].top = 1
    coin_label.data["icon"].right = screen.width

    update_labels()
}

let coin_label: TextSprite
let key_label: TextSprite
let magic_status: StatusBarSprite
let magic_label: TextSprite
let life_status: StatusBarSprite
let life_label: TextSprite


function spellIndicator(spell: Spell, primary: boolean): TextSprite {
    let indicator = textsprite.create(`${spell.mana} ${primary ? "A" : "B"}`)
    indicator.z = ZLevel.UI
    indicator.icon = spell.icon
    indicator.setOutline(Colour.WHITE, Colour.PURPLE)
    indicator.right = screen.width
    indicator.bottom = screen.height - (primary ? 9 : 0) -7
    indicator.setFlag(SpriteFlag.RelativeToCamera, true)

    return indicator
}