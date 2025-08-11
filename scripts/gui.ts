const STATUS_BAR_MARGIN: int8 = 1
const STATUS_BAR_HEIGHT: int8 = 6


class Overlay extends TextSprite {
    static OUTLINE_COLOUR: int8 = Colour.DPURPLE
    static PADDING: int8 = 0

    constructor(icon: Image, text: string, colour?: number) {
        super(text,
              Colour.TRANSPARENT, colour == 0 ? 0 : Colour.WHITE,
              8, // Max Font height
              1, Colour.TRANSPARENT, // Border
              Overlay.PADDING, // padding
              1, Overlay.OUTLINE_COLOUR, // Outline
              icon)
        
        this._setupSprite(this)
    }   

    _setupSprite(sprite: Sprite) {
        sprite.z = ZOrder.UI
        sprite.setFlag(SpriteFlag.RelativeToCamera, true)
    }
}

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

class Closeup extends Overlay {
    _portrait: Sprite

    constructor(image: Image, speech: string) {
        super(null, speech)
        
        this.setBorder(1, Colour.DPURPLE, Overlay.PADDING)
        this.left = 9
        this.bottom = scene.screenHeight()
        this.setBorder(1, Colour.BLACK)

        this._portrait = sprites.create(image, SpriteKind.Text)
        this._portrait.setScale(4)
        this._portrait.right = screen.width
        this._portrait.bottom = screen.height + 15
        
        this._setupSprite(this)
        this._portrait.z = 500000
    }

    destroy(effect?: effects.ParticleEffect, duration?: number) {
        super.destroy()
        this._portrait.destroy()
    }
}

class Label extends Overlay {
    constructor(icon: Image, text: string, textColor?: number) {
        super(icon, text, textColor || Colour.WHITE)
    }
}

class StatUpdate extends Label {
    constructor(icon: Image, change: number) {
        super(icon, `${change > 0 ? "+" : ""}${change}`, change < 0 ? Colour.RED : Colour.GREEN)

        this.setMaxFontHeight(5)
        this.setPosition(player.sprite.x, player.sprite.y - 8)
        this.vy = -15
        timer.after(300, () => {
            sprites.destroy(this)
        })

        this.z = ZOrder.FLOATER
    }
}

class CoinLabel extends Label {
    _icon: Sprite

    constructor() {
        super(null, "0", Colour.YELLOW)

        this.top = -1

        this._icon = sprites.create(sprites.builtin.coin0, SpriteKind.Text)
        this._icon.top = 1
        this._icon.right = screen.width - 1
        this._setupSprite(this._icon)
    }

    destroy(effect?: effects.ParticleEffect, duration?: number) {
        super.destroy()
        this._icon.destroy()
    }

    setText(text: string) {
        super.setText(text)
        this.right = screen.width - 8
    }
}

class StatusBar extends Label {
    _status: StatusBarSprite
    
    constructor(kind: number) {
        super(kind == StatusBarKind.Health ? sprites.projectile.heart3 : sprites.projectile.star3, "0/0")

        this._status = statusbars.create(45, STATUS_BAR_HEIGHT, kind)

        if (kind == StatusBarKind.Health) {
            this._status.setColor(Colour.RED, Colour.DPURPLE, Colour.BROWN)
            this._status.right = screen.width / 2
            this.left = -4
        } else {
            this._status.setColor(Colour.BLUE, Colour.DPURPLE, Colour.LBLUE)
            this._status.left = screen.width / 2
            this.right = screen.width
        }

        this._status.bottom = screen.height
        this._status.setBarBorder(1, Colour.BLACK)
        this._status.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)

        this.setMaxFontHeight(5)
        this.bottom = screen.height + 8

        this._setupSprite(this._status)
    }

    updateValues(value: number, max: number) {
        this._status.max = max
        this._status.value = value
        this.setText(`${value}/${max}`)
    }
}

function update_labels() {
    key_label.setText(`x${player.keys}`)
    coin_label.setText(`${player.coins}`)

    life_status.updateValues(player.life, player.maxLife)
    magic_status.updateValues(player.mana, player.maxMana)
}

function init_inventory() {
    life_status = new StatusBar(StatusBarKind.Health)
    magic_status = new StatusBar(StatusBarKind.Magic)

    key_label = new Label(assets.image`key`, "x0")
    key_label.left = -4
    key_label.bottom = scene.screenHeight() - 8

    coin_label = new CoinLabel()

    update_labels()
}


class SpellIndicator extends Overlay {
    constructor(spell: Spell, primary: boolean) {
        super(spell.icon, `${spell.mana} ${primary ? "A" : "B"}`)
        this.right = screen.width
        this.bottom = screen.height - (primary ? 9 : 0) - 7
    }
}

let coin_label: CoinLabel
let key_label: Label
let magic_status: StatusBar
let life_status: StatusBar
