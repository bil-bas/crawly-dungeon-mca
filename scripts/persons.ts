namespace SpriteKind {
    export const Person = SpriteKind.create()
}

type ShopItem = [string, number]

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

    _wares(): ShopItem[] { return null }

    _label(text: string, value: number): string {
        let padding = 25 - text.length
        return `${text}${padStart(value ? (value.toString() + "GC") : "", padding)}`
    }

    _purchase(selected: string, index: number) {  }

    touch(): void {
        if (!this._present) return

        let wares = [["Nothing right now", 0]]
        for (let item of this._wares()) {
            wares.push(item)
        }

        let closeup = new Closeup(this._sprite.image)

        let options = wares.map<string>((ware: ShopItem, _) => {
            let [text, value] = ware
            return this._label(text, value)
        })

        new Menu(`You have ${player.coins} gold coins`,
            options,
            (selected: string, index: number) => {
                if (options.indexOf(selected) == -1) return false

                let result: boolean

                if (index == 0) {
                    this._present = false
                    timer.after(2000, () => this._present = true)
                    closeup.close()
                    return false
                } else {
                    let [_, value] = this._wares()[index - 1]
                    if (player.coins >= value) {
                        player.coins -= value
                        this._purchase(selected, index - 1)
                        result = false
                    } else {
                        music.play(music.melodyPlayable(music.thump), music.PlaybackMode.InBackground)
                        result = true
                    }
                }

                if (!result) {
                    closeup.close()
                    this._present = false
                    this._sprite.destroy(effects.bubbles, 1000)
                }

                return result
            }
        )
    }
}

class ItemShop extends Shop {
    get image(): Image { return sprites.builtin.villager1WalkFront1 }

    _wares(): ShopItem[] {
        return [
            ["Life Potion", 100],
            ["Mana Crystal", 100],
            ["Skeleton Key", 100],
        ]
    }

    _purchase(selected: string, index: number) {
        switch (selected) {
            case "Life Potion":
                player.life += 1
                break
            case "Mana Crystal":
                player.mana += 1
                break
            case "Skeleton Key":
                player.keys += 1
                break
        }
    }
}

class SpellShop extends Shop {
    get image(): Image { return sprites.builtin.villager2WalkFront1 }

    _wares(): ShopItem[] {
        return SPELL_BOOK.slice(0, 5).map<ShopItem>((spell, _) => {
            return [`${spell.mana || '*'} ${spell.title}`, spell.value]
        })
    }

    _purchase(selected: string, index: number) {
        player.secondarySpell = SPELL_BOOK[index]
    }
}