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
        return `${text}${padStart(value ? (value.toString() + " gold") : "", padding)}`
    }

    _purchase(selected: string, index: number) {  }

    touch(): void {
        if (!this._present) return

        this._present = false

        let wares: ShopItem[] = []
        for (let item of this._wares()) {
            wares.push(item)
        }

        let options = wares.map<string>((ware: ShopItem, _) => {
            let [text, value] = ware
            return this._label(text, value)
        })

        new Menu(this._sprite.image, `You have ${player.coins} gold`, options, true,
            (selected: string, index: number) => {
                if (index == Menu.CANCELLED) {
                    timer.after(2000, () => this._present = true)
                    return false
                }

                let [_, value] = wares[index]
                if (player.coins >= value) {
                    player.coins -= value
                    timer.after(200, () => {
                        this._purchase(selected, index)
                    })
                } else {
                    sounds.play(sounds.error)
                    return true
                }

                this._present = false
                timer.after(400, () => {
                    sounds.play(sounds.teleport)
                    this._sprite.destroy(effects.bubbles, 2000)
                })
                
                return false
            }
        )
    }
}

class ItemShop extends Shop {
    get image(): Image { return sprites.builtin.villager3WalkFront1 }

    _wares(): ShopItem[] {
        return [
            ["Life Potion", 100],
            ["Mana Crystal", 100],
            ["Skeleton Key", 100],
        ]
    }

    _purchase(selected: string, index: number) {
        switch (selected.slice(0, 4)) {
            case "Life":
                player.life += 1
                break
            case "Mana":
                player.mana += 1
                break
            case "Skel":
                player.keys += 1
                break
            default:
                throw selected
        }
    }
}

class SpellShop extends Shop {
    get image(): Image { return sprites.builtin.villager1WalkFront1 }

    _wares(): ShopItem[] {
        return SPELL_BOOK.slice(0, 3).map<ShopItem>((spell, _) => {
            return [`${spell.mana || '*'} ${spell.title}`, spell.value]
        })
    }

    _purchase(selected: string, index: number) {
        player.secondarySpell = SPELL_BOOK[index]
    }
}