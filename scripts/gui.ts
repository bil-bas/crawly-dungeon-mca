type MenuOption = [Image, string]

class Overlay extends TextSprite {
    constructor(icon: Image|undefined, text: string, fg?: number, bg?: number) {
        super(text,
              bg ? bg : Colour.TRANSPARENT, fg ? fg : Colour.WHITE,
              8, // Max Font height
              1, Colour.TRANSPARENT, // Border
              0, // padding
              1, Colour.DARK_PURPLE, // Outline
              icon)

        this.setupSprite(this)
    }

    protected setupSprite(sprite: Sprite) {
        sprite.z = ZOrder.UI
        sprite.setFlag(SpriteFlag.RelativeToCamera, true)
    }
}

class Menu {
    static readonly CANCELLED = -1

    protected closeup: Closeup
    protected menu: miniMenu.MenuSprite

    constructor(actor: Image, question: string, options: MenuOption[],
                protected pushScene: boolean,
                handler: (selected: string, index: number) => boolean) {

        if (this.pushScene) {
            game.pushScene()
        }

        scene.setBackgroundColor(Colour.WHITE)

        this.closeup = new Closeup(actor, question)

        let items = options.map((option, i) => {
            let [icon, text] = option
            //if (!icon) throw "ouchies"
            return miniMenu.createMenuItem(text, icon)
        })

        this.menu = miniMenu.createMenuFromArray(items)
        this.menu.setDimensions(screen.width, screen.height * 0.6)
        this.menu.left = 0
        this.menu.top = 0

        this.menu.onButtonPressed(controller.A, (text: string, index: number) => {
            if (!this.menu) return

            if (!handler(text, index)) {
                this.destroy()
            }
        })

        this.menu.onButtonPressed(controller.B, (text: string, index: number) => {
            if (!this.menu) return

            if (!handler("Cancelled", Menu.CANCELLED)) {
                this.destroy()
            }
        })
    }

    public destroy() {
        this.menu.close()
        this.closeup.destroy()
        if (this.pushScene) {
            after(100, () => game.popScene())
        }
    }
}

class Closeup extends Overlay {
    protected readonly portrait: Sprite

    constructor(image: Image, speech: string) {
        super(undefined, speech, Colour.WHITE, Colour.DARK_PURPLE)

        this.setBorder(4, Colour.DARK_PURPLE)
        this.left = 4
        this.bottom = scene.screenHeight()

        this.portrait = sprites.create(image, SpriteKind.Text)
        this.portrait.setScale(4)
        this.portrait.right = screen.width
        this.portrait.bottom = screen.height + 15

        this.setupSprite(this)

        this.portrait.z = 500
        this.z = 501
    }

    public destroy(effect?: effects.ParticleEffect, duration?: number) {
        super.destroy()
        this.portrait.destroy()
    }
}

class Label extends Overlay {
    constructor(icon: Image|undefined, text: string, textColor?: number) {
        super(icon, text, textColor || Colour.WHITE)
    }
}

class StatUpdate extends Label {
    constructor(icon: Image, change: number) {
        super(icon, `${change > 0 ? "+" : ""}${change}`, change < 0 ? Colour.RED : Colour.GREEN)

        this.setMaxFontHeight(5)
        this.setFlag(SpriteFlag.RelativeToCamera, false)
        game.currentScene().physicsEngine.addSprite(this)
        this.setPosition(player.x, player.y - 8)
        this.vy = -15
        after(500, () => {
            sprites.destroy(this)
        })

        this.z = ZOrder.FLOATER
    }
}

class CoinLabel extends Label {
    protected readonly coin: Sprite

    constructor() {
        super(undefined, "0", Colour.YELLOW)

        this.top = 0

        this.coin = sprites.create(sprites.builtin.coin0, SpriteKind.Text)
        this.coin.top = 2
        this.coin.right = screen.width - 2
        this.setupSprite(this.coin)
    }

    public destroy(effect?: effects.ParticleEffect, duration?: number): void {
        super.destroy()
        this.coin.destroy()
    }

    public setText(text: string): void {
        super.setText(text)
        this.right = screen.width - 10
    }
}

class StatusBar extends Label {
    protected readonly status: StatusBarSprite

    constructor(kind: number) {
        super(kind == StatusBarKind.Health ? assets.image`life` : assets.image`mana`, "0/0")

        this.status = statusbars.create(45, 6, kind)

        if (kind == StatusBarKind.Health) {
            this.status.setColor(Colour.RED, Colour.DARK_PURPLE, Colour.BROWN)
            this.status.right = screen.width / 2
            this.left = -2
        } else {
            this.status.setColor(Colour.BLUE, Colour.DARK_PURPLE, Colour.LIGHT_BLUE)
            this.status.left = screen.width / 2
            this.right = screen.width
        }

        this.status.bottom = screen.height
        this.status.setBarBorder(1, Colour.BLACK)
        this.status.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)

        this.setMaxFontHeight(5)
        this.bottom = screen.height + 4
        this.setupSprite(this.status)
    }

    public updateValues(value: number, max: number): void {
        this.status.max = max
        this.status.value = value
        this.setText(`${value}/${max}`)
    }
}

class ScreenMessage extends Overlay {
    protected readonly actionText: TextSprite

    constructor(lines: string[], action: string, handler: () => void) {
        game.pushScene()

        super(undefined, lines.join("\\n"), Colour.LIGHT_BLUE, Colour.DARK_PURPLE)
        scene.setBackgroundColor(Colour.DARK_PURPLE)
        this.setMaxFontHeight(5)
        this.left = 4
        this.top = 4

        this.actionText = new Overlay(undefined, action)
        this.actionText.left = 4
        this.actionText.bottom = screen.height

        controller.A.onEvent(ControllerButtonEvent.Pressed, handler)
    }
}

class Gui {
    protected readonly coinLabel: CoinLabel
    protected readonly keyLabel: Label
    protected readonly magicStatus: StatusBar
    protected readonly lifeStatus: StatusBar
    protected readonly levelLabel: Label

    constructor() {
        this.lifeStatus = new StatusBar(StatusBarKind.Health)
        this.magicStatus = new StatusBar(StatusBarKind.Magic)

        this.keyLabel = new Label(assets.image`key`, "x0")
        this.keyLabel.setMaxFontHeight(5)
        this.keyLabel.left = -2
        this.keyLabel.bottom = scene.screenHeight() - 8

        this.coinLabel = new CoinLabel()

        this.levelLabel = new Label(assets.image`level`, "0")
        this.levelLabel.setMaxFontHeight(5)
        this.levelLabel.left = -2
        this.levelLabel.top = 0

        this.updateLabels()
    }

    public updateLabels(): void {
        this.keyLabel.setText(`x${player.keys}`)
        this.coinLabel.setText(player.coins.toString())

        this.lifeStatus.updateValues(player.life, player.maxLife)
        this.magicStatus.updateValues(player.mana, player.maxMana)

        this.levelLabel.setText(dungeon.level.toString())
    }
}

class SpellIndicator extends Overlay {
    constructor(spell: Spell, primary: boolean) {
        super(spell.icon, `${spell.mana} ${primary ? "A" : "B"}`)
        this.setMaxFontHeight(5)
        this.right = screen.width
        this.bottom = screen.height - (primary ? 10 : 0) - 7
    }
}
