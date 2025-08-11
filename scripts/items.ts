type ShopItem = [string, number]

class Item {
    _sprite: Sprite
    _present: boolean = true

    get image(): Image { return null }
    get canUse() { return this._present }
    get destroyOnUse(): boolean { return true }
    get useSound(): music.Playable { return sounds.useItemSound }

    use() {
        sounds.play(this.useSound)
    }

    constructor(tile: tiles.Location) {
        this._sprite = sprites.create(this.image, SpriteKind.Item)
        tiles.placeOnTile(this._sprite, tile)
        this._sprite.data["obj"] = this
    }
}


class Shrine extends Item {
    SPENT_IMAGE = sprites.dungeon.statueDark

    get image(): Image { return sprites.dungeon.statueLight }
    get isSpent(): boolean { return this._sprite.image == this.SPENT_IMAGE }

    constructor(tile: tiles.Location) {
        super(tile)
        this._sprite.y -= 7 // Standing on the tile and so we can interact with it.
    }

    use() {
        new Menu(this._sprite.image, `What will you give up?`,
                ["Sacrifice your Blood", "Sacrifice your Mana"], true,
            (selected: string, index: number) => {
                if (index == Menu.CANCELLED) {
                    timer.after(2000, () => this._present = true)
                    return false
                }

                if (index == 0 && player.life > 1) {
                    player.life = 1
                } else if (index == 1 && player.mana > 0) {
                    player.mana = 0
                } else {
                    sounds.play(sounds.error)
                    return true
                }

                this._present = false

                timer.after(400, () => {
                    player.coins += 1000
                    sounds.play(sounds.sacrifice)
                    
                    this._sprite.startEffect(effects.coolRadial, 2000)
                    timer.after(1000, () => this._sprite.setImage(this.SPENT_IMAGE))
                })
                
                return false
            }
        )
    }
}

class Mushroom extends Item {
    get image(): Image { return assets.tile`mushroom` }

    use() {
        let options = [
            "Eat of the cap",
            "Eat of the gills",
            "Eat of the stalk",
        ]

        new Menu(this._sprite.image, `What dare you injest?`, options, true,
            (selected: string, index: number) => {
                if (index == Menu.CANCELLED) {
                    timer.after(2000, () => this._present = true)
                    return false
                }

                timer.after(200, () => {
                    player.life = 1
                    player.mana = player.maxMana
                })

                this._present = false
                timer.after(400, () => {
                    sounds.play(sounds.eat)
                    this._sprite.destroy(effects.hearts, 1000)
                })
                
                return false
            }
        )
    }
}


class Shop extends Item {
    _wares(): ShopItem[] { return null }

    _label(text: string, value: number): string {
        return `${text}${padStart(value ? (value.toString() + " gold") : "", 25 - text.length)}`
    }

    _purchase(selected: string, index: number) { }

    use(): void {
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