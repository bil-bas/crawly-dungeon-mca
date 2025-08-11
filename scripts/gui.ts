const STATUS_BAR_MARGIN: int8 = 1
const STATUS_BAR_HEIGHT: int8 = 6
const PADDING: int8 = 4

class Menu {
    static CANCELLED = -1

    _isClosed: boolean
    _pushScene: boolean
    _closeup: Closeup

    constructor(actor: Image, question: string, options: string[], pushScene: boolean,
                handler: (selected: string, index: number) => boolean) {
        this._isClosed = false
        this._pushScene = pushScene

        if (this._pushScene) {
            story.pushScene()
        }

        scene.setBackgroundColor(Colour.DPURPLE)

        this._closeup = new Closeup(actor, question)
        
        story.menu.showMenu(options, story.menu.MenuStyle.List, story.menu.MenuLocation.FullScreen)
        story.menu.onMenuOptionSelected((option, number) => {
            if (this._isClosed) return // FIXME: closed menus still exist!

            if (!handler(option, number)) {
                this.destroy()
            }
        })

        controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
            if (!handler("Cancelled", Menu.CANCELLED)) {
                this.destroy()
            }
        })
    }

    destroy() {
        story.menu.closeMenu()
        this._closeup.destroy()
        this._isClosed = true
        if (this._pushScene) {
            timer.after(100, () => story.popScene())
        }
    }
}

class Closeup {
    _sprite: Sprite
    _text: TextSprite

    constructor(image: Image, speech: string) {
        this._sprite = sprites.create(image, SpriteKind.Text)
        this._sprite.z = ZOrder.UI
        this._sprite.setScale(4)
        this._sprite.right = scene.screenWidth()
        this._sprite.bottom = scene.screenHeight() + 15

        this._text = textsprite.create(speech)
        this._text.setBorder(1, Colour.BLACK, PADDING)
        this._text.left = PADDING
        this._text.bottom = scene.screenHeight() - PADDING
    }

    destroy() {
        this._sprite.destroy()
        this._text.destroy()
    }
}

// Indicate a change with floating message.
function change_floater(icon: Image, change: number) {
    let text = textsprite.create((change > 0 ? "+" : "") + ("" + change))
    text.setMaxFontHeight(5)
    text.setIcon(icon)
    text.z = ZOrder.FLOATER
    text.setPosition(player.sprite.x, player.sprite.y - 8)
    text.vy = -10
    timer.after(500, () => {
        sprites.destroy(text)
    })
}

// Create stat label for top of screen.
function create_label(icon: Image) {
    let label = textsprite.create("x0", 0, 1)
    label.z = ZOrder.UI
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
    life_status.z = ZOrder.UI
    life_status.setBarBorder(1, 15)
    life_status.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
    life_status.setColor(Colour.RED, Colour.DPURPLE, Colour.BROWN)

    life_label = create_label(sprites.projectile.heart3)
    life_label.left = -4
    life_label.bottom = screen.height + 5

    magic_status = statusbars.create(45, STATUS_BAR_HEIGHT, StatusBarKind.Magic)
    magic_status.setFlag(SpriteFlag.RelativeToCamera, true)
    magic_status.bottom = screen.height
    magic_status.left = screen.width / 2
    magic_status.z = ZOrder.UI
    magic_status.setBarBorder(1, 15)
    magic_status.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
    magic_status.setStatusBarFlag(StatusBarFlag.LabelAtEnd, true)
    magic_status.setColor(Colour.BLUE, Colour.DPURPLE, Colour.LBLUE)
        
    magic_label = create_label(sprites.projectile.firework1)
    magic_label.right = screen.width
    magic_label.bottom = screen.height + 5

    key_label = create_label(assets.image`key`)
    key_label.left = -4
    key_label.bottom = scene.screenHeight() - 8

    coin_label = textsprite.create("0")
    coin_label.setOutline(Colour.WHITE, Colour.PURPLE)
    coin_label.setFlag(SpriteFlag.RelativeToCamera, true)
    coin_label.z = ZOrder.UI
    coin_label.top = 0
    coin_label.right = 150

    coin_label.data["icon"] = sprites.create(sprites.builtin.coin0)
    coin_label.data["icon"].setFlag(SpriteFlag.RelativeToCamera, true)
    coin_label.data["icon"].z = ZOrder.UI
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
    indicator.z = ZOrder.UI
    indicator.icon = spell.icon
    indicator.setOutline(Colour.WHITE, Colour.PURPLE)
    indicator.right = screen.width
    indicator.bottom = screen.height - (primary ? 9 : 0) -7
    indicator.setFlag(SpriteFlag.RelativeToCamera, true)

    return indicator
}