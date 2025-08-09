namespace SpriteKind {
    export const Person = SpriteKind.create()
}

class Person {
    _sprite: Sprite

    get image(): Image { return null }

    constructor(tile: tiles.Location) {
        this._sprite = sprites.create(this.image, SpriteKind.Person)
        this._sprite.data["obj"] = this
        tiles.placeOnTile(this._sprite, tile)
    }
}      

class Shopkeeper extends Person {
    _present: boolean

    get image(): Image { return sprites.builtin.villager1WalkFront1 }

    constructor(tile: tiles.Location) {
        super(tile)
        this._present = true
    }

    _label(text: string, value?: number) {
        let padding = 20 - text.length
        return `${text}${padStart(value ? (value.toString() + "GC") : "", padding)}`
    }

    touch() {
        if (!this._present) return

        let forSale: Array<[string, Image]> = []
        forSale.push([this._label("Leave without buying"), sprites.projectile.bubble4])
        forSale.push([this._label("Life Potion", 100), sprites.projectile.heart3])
        forSale.push([this._label("Mana Crystal", 100), sprites.projectile.star3])
        forSale.push([this._label("Skeleton Key", 100), assets.image`key`])

        for (let spell of SPELL_BOOK)  {
            forSale.push([this._label(`${spell.mana || '*'} ${spell.title}`, spell.value), spell.icon])
        }

        let menu: Menu
        menu = new Menu(`You have ${player.coins} gold coins`,
            forSale,
            (selectedIndex: number) => {
                if (selectedIndex == 0) {
                    // just leave
                } else if (selectedIndex == 1) {
                    if (player.coins >= 100) {
                        player.coins -= 100
                        player.life += 1
                    } else {
                        return
                    }
                } else if (selectedIndex == 2) {
                    if (player.coins >= 100) {
                        player.coins -= 100
                        player.mana += 1
                    } else {
                        return
                    }
                } else if (selectedIndex == 3) {
                    if (player.coins >= 100) {
                        player.coins -= 100
                        player.keys += 1
                    } else {
                        return
                    }
                } else {
                    let spell: Spell = SPELL_BOOK[selectedIndex - 4]

                    if (player.coins >= spell.value) {
                        player.coins -= spell.value
                        player.secondarySpell = spell
                    } else {
                        return
                    }
                }

                menu.close()
                this._present = false
                this._sprite.destroy(effects.bubbles, 1000)
            }
        )
    }
}