class Item {
    _sprite: Sprite

    get image(): Image { return assets.image`key` }
    get type(): string { return "Item" }
    get canUse(): boolean { return true }
    get useSound(): music.Melody { return music.powerUp }

    use() {   
        music.play(music.melodyPlayable(this.useSound), music.PlaybackMode.InBackground)
        this._sprite.destroy()
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

class Shrine extends Item {
    _isSpent: boolean

    constructor(location: tiles.Location) {
        super(location)
        this._isSpent = false
    }

    use() {     
        music.play(music.melodyPlayable(this.useSound), music.PlaybackMode.InBackground)
        this._isSpent = true
    }
}

class ShrineofLife extends Shrine {
    get image(): Image { return assets.image`shrine of life` }
    get type(): string { return "Shrine of Life" }

    get canUse(): boolean { return !this._isSpent && player.life >= 2 }

    use(): void {
        super.use()
        player.life -= 1
        this._sprite.setImage(sprites.dungeon.statueDark)
    }
}

class ShrineofMana extends Shrine {
    get image(): Image { return assets.image`shrine of mana` }
    get type(): string { return "Shrine of Mana" }

    get canUse(): boolean { return !this._isSpent && player.mana >= 1 }

    use(): void {
        super.use()
        player.mana -= 1
        this._sprite.setImage(sprites.dungeon.statueDark)
    }
}
