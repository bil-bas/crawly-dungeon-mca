const STATUS_BAR_MARGIN = 1
const STATUS_BAR_HEIGHT = 6

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
function create_label(icon: Image, x: number) {
    let label = textsprite.create("x0", 0, 1)
    label.setIcon(icon)
    label.setOutline(1, 12)
    label.setFlag(SpriteFlag.RelativeToCamera, true)
    label.top = 0
    label.left = x
    return label
}

function update_labels() {
    magic_label.value = player.mana
    life_label.value = player.life

    key_label.setText(`x${player.keys}`)
    coin_label.setText(`${player.coins}`)

    life_label.max = player.maxLife
    life_label.setLabel(`L ${player.life}/${player.maxLife}`)
    life_label.value = player.life
    life_label.left = 1

    magic_label.max = player.maxMana
    magic_label.value = player.mana
    magic_label.setLabel(`${player.mana}/${player.maxMana} M`)
    magic_label.right = screen.width - 1

    coin_label.right = 150
}

function init_inventory() {
    info.showLife(false)

    life_label = statusbars.create(51, STATUS_BAR_HEIGHT, StatusBarKind.Health)
    life_label.setFlag(SpriteFlag.RelativeToCamera, true)
    life_label.bottom = screen.height
    life_label.z = ZLevel.UI
    life_label.setBarBorder(1, 15)
    life_label.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
    life_label.setColor(Colour.RED, Colour.DARK_PURPLE, Colour.BROWN)

    magic_label = statusbars.create(50, STATUS_BAR_HEIGHT, StatusBarKind.Magic)
    magic_label.setFlag(SpriteFlag.RelativeToCamera, true)
    magic_label.bottom = screen.height
    magic_label.z = ZLevel.UI
    magic_label.setBarBorder(1, 15)
    magic_label.setStatusBarFlag(StatusBarFlag.SmoothTransition, true)
    magic_label.setStatusBarFlag(StatusBarFlag.LabelAtEnd, true)
    magic_label.setColor(Colour.BLUE, Colour.DARK_PURPLE, Colour.LIGHT_BLUE)

    key_label = create_label(assets.image`key`, 0)
    key_label.top = 0

    coin_label = textsprite.create("0")
    coin_label.setOutline(1, 12)
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
let magic_label: StatusBarSprite
let life_label: StatusBarSprite

function spellIndicator(spell: Spell, primary: boolean): TextSprite {
    let indicator = textsprite.create(`${spell.mana}`)
    indicator.z = ZLevel.UI
    indicator.icon = spell.icon
    indicator.setOutline(1, 15)
    indicator.right = screen.width
    indicator.bottom = screen.height - (primary ? 10 : 0) - 6
    indicator.setFlag(SpriteFlag.RelativeToCamera, true)

    return indicator
}