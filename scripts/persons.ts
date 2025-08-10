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

class Shop extends Person {
    _present: boolean

    constructor(tile: tiles.Location) {
        super(tile)
        this._present = true
    }

    _label(text: string, value?: number) {
        let padding = 25 - text.length
        return `${text}${padStart(value ? (value.toString() + "GC") : "", padding)}`
    }
}

class ItemShop extends Shop {
    get image(): Image { return sprites.builtin.villager1WalkFront1 }

    touch() {
        if (!this._present) return

        let options: Array<string> = [
            this._label("Let shopkeeper leave"),
            this._label("Life Potion", 100),
            this._label("Mana Crystal", 100),
            this._label("Skeleton Key", 100),
        ]

        let menu: Menu
        menu = new Menu(`You have ${player.coins} gold coins`,
            options,
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
                }

                menu.close()
                this._present = false
                this._sprite.destroy(effects.bubbles, 1000)
            }
        )
    }
}

class SpellShop extends Shop {
    get image(): Image { return sprites.builtin.villager2WalkFront1 }

    touch() {
        if (!this._present) return

        let options: Array<string> = [this._label("Let old wizard leave")]

        for (let spell of SPELL_BOOK)  {
            options.push(this._label(`${spell.mana || '*'} ${spell.title}`, spell.value))
        }

        let menu: Menu
        menu = new Menu(`You have ${player.coins} gold coins`,
            options,
            (selectedIndex: number) => {
                let spell: Spell = SPELL_BOOK[selectedIndex]

                if (player.coins >= spell.value) {
                    player.coins -= spell.value
                    player.secondarySpell = spell
                } else {
                    return
                }

                menu.close()
                this._present = false
                this._sprite.destroy(effects.smiles, 1000)
            }
        )
    }
}