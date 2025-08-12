class Overlay extends TextSprite {
    constructor(icon: Image, text: string, fg?: number, bg?: number) {
        super(text,
              bg ? bg : Colour.TRANSPARENT, fg ? fg : Colour.WHITE,
              8, // Max Font height
              1, Colour.TRANSPARENT, // Border
              0, // padding
              1, Colour.DARK_PURPLE, // Outline
              icon)
        
        this._setupSprite(this)
    }   

    _setupSprite(sprite: Sprite) {
        sprite.z = ZOrder.UI
        sprite.setFlag(SpriteFlag.RelativeToCamera, true)
    }
}

class Menu {
    static readonly CANCELLED = -1

    _pushScene: boolean
    _closeup: Closeup
    _menu: miniMenu.MenuSprite

    constructor(actor: Image, question: string, options: string[], pushScene: boolean,
                handler: (selected: string, index: number) => boolean) {
        this._pushScene = pushScene

        if (this._pushScene) {
            game.pushScene()
        }

        scene.setBackgroundColor(Colour.DARK_PURPLE)

        this._closeup = new Closeup(actor, question)

        let items = options.map((name, i) => {
            return miniMenu.createMenuItem(name)
        })

        this._menu = miniMenu.createMenuFromArray(items)
        this._menu.setDimensions(screen.width, screen.height)
        this._menu.left = 0
        this._menu.top = 0

        this._menu.onButtonPressed(controller.A, (text: string, index: number) => {
            if (!this._menu) return

            if (!handler(text, index)) {
                this.destroy()
            }
        })

        this._menu.onButtonPressed(controller.B, (text: string, index: number) => {
            if (!this._menu) return

            if (!handler("Cancelled", Menu.CANCELLED)) {
                this.destroy()
            }
        })
    }

    destroy() {
        this._menu.close()
        this._closeup.destroy()
        if (this._pushScene) {
            timer.after(100, () => game.popScene())
        }
    }
}

class Closeup extends Overlay {
    _portrait: Sprite

    constructor(image: Image, speech: string) {
        super(null, speech, Colour.WHITE, Colour.DARK_PURPLE)
        
        this.setBorder(1, Colour.DARK_PURPLE, 4)
        this.left = 9
        this.bottom = scene.screenHeight()
        this.setBorder(1, Colour.BLACK)

        this._portrait = sprites.create(image, SpriteKind.Text)
        this._portrait.setScale(4)
        this._portrait.right = screen.width
        this._portrait.bottom = screen.height + 15
        
        this._setupSprite(this)

        this._portrait.z = 500
        this.z = 501
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

        this._status = statusbars.create(45, 6, kind)

        if (kind == StatusBarKind.Health) {
            this._status.setColor(Colour.RED, Colour.DARK_PURPLE, Colour.BROWN)
            this._status.right = screen.width / 2
            this.left = -4
        } else {
            this._status.setColor(Colour.BLUE, Colour.DARK_PURPLE, Colour.LIGHT_BLUE)
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

class ScreenMessage extends Overlay {
    _actionText: TextSprite

    constructor(lines: string[], action: string, handler: () => void) {
        game.pushScene()

        super(null, lines.join("\\n"), Colour.LIGHT_BLUE, Colour.DARK_PURPLE)
        scene.setBackgroundColor(Colour.DARK_PURPLE)        
        this.setMaxFontHeight(5)
        this.left = 4
        this.top = 4

        this._actionText = new Overlay(null, action)
        this._actionText.left = 4
        this._actionText.bottom = screen.height

        controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
            handler()
        })
    }
}

class StartMessage extends ScreenMessage {
    constructor(handler: () => void) {
        let message = [
            "\\n     Welcome to the",
            "     Crawly Dungeon!",
            "\\n\\nSeek your fortune, as",
            "many before you tried and",
            "failed...",
        ]
        super(message, "Press <A> to delve!", () => {
            game.popScene()
            handler()
        })
    }
}

class DeathMessage extends ScreenMessage {
    constructor(player: Player) {
        let message: string[] = [
            `A ${player._klass} died today,`,
            `grasping ${player.coins} gold.`,
            "\\nThe richest corpses were:",
        ]

        for (let highscore of dataStore.richest) {
            let [klass, score] = highscore
            message.push(`${padStart(score.toString(), 6)} gold: ${klass}`)
        }

        super(message, "\\nPress <A> to live again!", () => {
            game.reset()
        })
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
