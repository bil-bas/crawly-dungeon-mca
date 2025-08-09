class Item {
    _sprite: Sprite

    get image(): Image { return assets.image`key` }
    get type(): string { return "Item" }
    get canUse(): boolean { return true }
    get destroyOnUse(): boolean { return true }
    get useSound(): music.Melody { return music.powerUp }

    use() {   
        music.play(music.melodyPlayable(this.useSound), music.PlaybackMode.InBackground)
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

    get destroyOnUse(): boolean { return false }
    get isSpent(): boolean { return this._sprite.image == this.SPENT_IMAGE }

    constructor(location: tiles.Location) {
        super(location)
        this._sprite.y -= 7 // Standing on the tile and so we can interact with it.
    }

    use() {
        
    }
}

class ShrineofLife extends Shrine {
    get image(): Image { return assets.image`shrine of life` }
    get type(): string { return "Shrine of Life" }

    get canUse(): boolean { return !this.isSpent && player.life >= 2 }

    use(): void {
        super.use()
        player.life -= 1
        this._sprite.setImage(this.SPENT_IMAGE)
    }
}

class ShrineofMana extends Shrine {
    get image(): Image { return assets.image`shrine of mana` }
    get type(): string { return "Shrine of Mana" }

    get canUse(): boolean { return !this.isSpent && player.mana >= 1 }

    use(): void {
        super.use()
        player.mana -= 1
        this._sprite.setImage(this.SPENT_IMAGE)
    }
}
