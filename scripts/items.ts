class Item {
    _sprite: Sprite

    get image(): Image { return assets.image`key` }
    get type(): string { return "Item" }
    get canUse(): boolean { return true }
    get destroyOnUse(): boolean { return true }
    get useSound(): music.Playable { return sounds.useItemSound }

    use() {
        sounds.play(this.useSound)
        if (this.destroyOnUse) {
            this._sprite.destroy()
        }
    }

    constructor(tile: tiles.Location) {
        this._sprite = sprites.create(this.image, SpriteKind.Item)
        tiles.placeOnTile(this._sprite, tile)
        this._sprite.data["obj"] = this
    }
}

class ManaPotion extends Item {
    get image(): Image { return sprites.projectile.firework1 }
    get type(): string { return "Mana Potion" }
    get canUse(): boolean { return player.mana < player.maxMana}

    use(): void {
        super.use()
        player.mana += 1
    }
}

class LifePotion extends Item {
    get image(): Image { return sprites.projectile.heart1 }
    get type(): string { return "Life Potion" }
    get canUse(): boolean { return player.life < player.maxLife }
    
    use(): void {
        super.use()
        player.life += 1
    }
}

class SkeletonKey extends Item {
    get image(): Image { return assets.image`key` }
    get type(): string { return "Skeleton Key" }

    use(): void {
        super.use()
        player.keys += 1
    }
}

class Chest extends Item {
    get image(): Image { return sprites.dungeon.chestClosed }
    get type(): string { return "Chest" }
    get isOpen(): boolean { return this._sprite.image == sprites.dungeon.chestOpen }
    get destroyOnUse(): boolean { return false }
    get useSound(): music.Playable { return sounds.unlock }


    constructor(tile: tiles.Location) {
        super(tile)
    }

    get canUse(): boolean {
        return !this.isOpen && player.keys >= 1
    }

    use(): void {
        super.use()
        player.keys -= 1
        player.coins += 100
        this._sprite.setImage(sprites.dungeon.chestOpen)
    }
}

class Shrine extends Item {
    SPENT_IMAGE = sprites.dungeon.statueDark

    _present: boolean

    get image(): Image { return sprites.dungeon.statueLight }
    get destroyOnUse(): boolean { return false }
    get isSpent(): boolean { return this._sprite.image == this.SPENT_IMAGE }

    constructor(tile: tiles.Location) {
        super(tile)
        this._sprite.y -= 7 // Standing on the tile and so we can interact with it.
        this._present = true
    }

    use() {
        if (!this._present) return

        let options = [
            "Sacrifice your Blood",
            "Sacrifice your Mana",
        ]

        new Menu(this._sprite.image, `What will you give up?`, options, true,
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
    _present: boolean

    get image(): Image { return sprites.builtin.forestMushroomPatch }

    constructor(tile: tiles.Location) {
        super(tile)
        this._present = true
    }

    use() {
        if (!this._present) return

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
                    player.mana = 100
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

class Rockslide extends Item {
    get image(): Image { return sprites.castle.rock2 }

    constructor(tile: tiles.Location) {
        super(tile)
        tiles.setWallAt(tile, true)
    }
}
