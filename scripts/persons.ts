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
    get image(): Image { return sprites.builtin.villager1WalkFront1 }

    _label(text: string, value: number) {
        let padding = 20 - text.length
        return `${text}${padStart(value.toString(), padding)}GC`
    }

    touch() {
        let forSale: Array<[string, Image]> = []
        forSale.push([this._label("Life Potion", 100), sprites.projectile.heart3])
        forSale.push([this._label("Mana Crystal", 100), sprites.projectile.star3])

        for (let spell of SPELL_BOOK)  {
            forSale.push([this._label(`${spell.mana || '*'} ${spell.title}`, spell.value), spell.icon])
        }

        let menu: Menu
        menu = new Menu(`You have ${player.coins} gold coins`,
            forSale,
            (selectedIndex: number) => {
                if (selectedIndex == 0) {
                    player.life += 1
                } else if (selectedIndex == 1) {
                    player.mana += 1
                } else {
                    let spell: Spell = SPELL_BOOK[selectedIndex - 2]

                    if (player.coins >= spell.value) {
                        player.coins -= spell.value
                        player.secondarySpell = spell
                        console.log(`You chose ${spell.title}`)
                        this._sprite.destroy()
                        menu.close()
                    } else {
                        console.log(`You can't afford ${spell.title}`)
                    }
                }
            }
        )
    }
}