type ShopItem = [Image, string, number]

class Item {
    protected sprite: Sprite
    protected canUse: boolean = true

    protected get image(): Image { throw null }
    protected get message(): string { throw null }
    protected get options(): MenuOption[] {  throw null }

    constructor(tile: tiles.Location) {
        this.sprite = sprites.create(this.image, SpriteKind.Item)
        tiles.placeOnTile(this.sprite, tile)
        this.sprite.data["obj"] = this
    }

    protected tryUse(selected: string, index: number): boolean { return true }
    protected postUse(): void { }

    use(): void {
        if (!this.canUse) return
        
        this.canUse = false

        new Menu(this.sprite.image, this.message, this.options, true,
            (selected: string, index: number) => {
                if (index == Menu.CANCELLED) {
                    after(100, () => this.movedChecker())
                    return false
                }

                if (!this.tryUse(selected, index)) {
                    sounds.play(sounds.error)
                    return true
                }

                this.canUse = false

                after(250, () => this.postUse())
                
                return false
            }
        )
    }
    
    protected movedChecker(): void {
        if (this.sprite.overlapsWith(player.sprite)) {
            after(100, () => this.movedChecker())
        } else {
            this.canUse = true
        }
    }
}


class Shrine extends Item {
    protected SPENT_IMAGE = sprites.dungeon.statueDark

    protected get image(): Image { return sprites.dungeon.statueLight }
    protected get isSpent(): boolean { return this.sprite.image == this.SPENT_IMAGE }
    protected get message(): string { return `What will you give up?` }

    constructor(tile: tiles.Location) {
        super(tile)
        this.sprite.y -= 7 // Standing on the tile and so we can interact with it.
    }

    protected get options(): MenuOption[] {
        return [
            [sprites.projectile.heart3, "Sacrifice Blood"],
            [sprites.projectile.flash2, "Sacrifice Mana"],
        ]
    }

    protected tryUse(selected: string, index: number): boolean {
        if (index == 0 && player.life > 1) {
            player.life = 1
            return true
        } else if (index == 1 && player.mana > 0) {
            player.mana = 0
            return true
        } else {
            return false
        }
    }

    protected postUse(): void {
        player.coins += 1000
        sounds.play(sounds.sacrifice)
                
        this.sprite.startEffect(effects.coolRadial, 2000)
        after(1000, () => this.sprite.setImage(this.SPENT_IMAGE))
    }
}

class Mushroom extends Item {
    protected get image(): Image { return assets.tile`mushroom` }
    protected get message(): string { return "What dare you injest?" }

    protected get options(): MenuOption[] {
        return [
            [assets.tile`mushroom`, "Eat of the cap"],
            [assets.tile`mushroom`, "Eat of the gills"],
            [assets.tile`mushroom`, "Eat of the stalk"],
        ]
    }

    protected tryUse(selected: string, index: number): boolean {
        after(200, () => {
            player.life = 1
            player.mana = player.maxMana
        })
        
        return true
    }

    protected postUse(): void {
        sounds.play(sounds.eat)
        this.sprite.destroy(effects.hearts, 1000)
    }
}


class Shop extends Item {
    protected get message() { return `You have ${player.coins} gold` }
    protected get wares(): ShopItem[] { throw null }

    protected label(text: string, value: number): string {
        return `${text}${padStart(value ? (value.toString() + " gold") : "", 22 - text.length)}`
    }

    protected get options(): MenuOption[] {
        return this.wares.map<MenuOption>((ware: ShopItem, _) => {
            let [image, text, value] = ware
            return [image, this.label(text, value)]
        })
    }

    protected purchase(selected: string, index: number): void { }

    protected tryUse(selected: string, index: number): boolean {
        let [image, title, value] = this.wares[index]
        if (player.coins >= value) {
            player.coins -= value
            after(200, () => this.purchase(selected, index))
            return true
        } else {
            return false
        }
    }

    protected postUse(): void {
        sounds.play(sounds.teleport)
        this.sprite.destroy(effects.bubbles, 2000)
    }
}

class ItemShop extends Shop {
    protected get image(): Image { return sprites.builtin.villager3WalkFront1 }

    protected get wares(): ShopItem[] {
        return [
            [assets.tile`life potion`, "Life Potion", 100],
            [assets.tile`mana potion`, "Mana Crystal", 100],
            [assets.tile`key`, "Skeleton Key", 100],
        ]
    }

    protected purchase(selected: string, index: number): void {
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
    protected get image(): Image { return sprites.builtin.villager1WalkFront1 }

    protected get wares(): ShopItem[] {
        return SPELL_BOOK.map<ShopItem>((spell: Spell, _: number) => {
            return [spell.icon, `${spell.mana || '*'} ${spell.title}`, spell.value]
        })
    }

    protected purchase(selected: string, index: number): void {
        player.secondarySpell = SPELL_BOOK[index]
    }
}