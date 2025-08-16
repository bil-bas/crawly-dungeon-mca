type ShopItem = [Image, string, number]

class Item extends Entity {
    public get canUse(): boolean { return true }
    public use(): void { }


    constructor(tile: tiles.Location) {
        super(SpriteKind.Item, ZOrder.ITEMS, tile)
    }
}

class Key extends Item {
    public get image(): Image { return assets.image`key` }
    public use(): void {
        player.keys += 1
        sounds.play(sounds.useItemSound)
        this.destroy()
    }
}

class Coins extends Item {
    public get image(): Image { return assets.image`coins` }
    public use(): void {
        player.coins += randint(2, 4)
        sounds.play(sounds.useItemSound)
        this.destroy()
    }
}

class ManaPotion extends Item {
    public get image(): Image { return assets.image`mana potion` }
    public get canUse(): boolean { return player.mana < player.maxMana }
    public use(): void {
        player.mana += 1
        sounds.play(sounds.useItemSound)
        this.destroy()
    }
}

class LifePotion extends Item {
    public get image(): Image { return assets.image`life potion` }
    public get canUse(): boolean { return player.life < player.life }

    public use(): void {
        player.life += 1
        sounds.play(sounds.useItemSound)
        this.destroy()

    }
}

class Chest extends Item {
    public get image(): Image { return sprites.dungeon.chestClosed }
    public get canUse(): boolean { return player.keys >= 1 }
    public use(): void {
        player.keys -= 1
        after(200, () => player.coins += randint(10, 20))
        this.setImage(sprites.dungeon.chestOpen)
        sounds.play(sounds.unlock)
    }
}

class InteractiveItem extends Item {
    protected _canUse: boolean = true
    public get canUse(): boolean { return this._canUse }
    protected get message(): string { throw NOT_IMPLEMENTED }
    protected get options(): MenuOption[] { throw NOT_IMPLEMENTED }

    protected tryUse(selected: string, index: number): boolean { return true }
    protected postUse(): void { }

    constructor(tile: tiles.Location) {  // Just so canUse can be initialised.
        super(tile)
    }

    use(): void {
        this._canUse = false

        new Menu(this.image, this.message, this.options, true,
            (selected: string, index: number) => {
                if (index == Menu.CANCELLED) {
                    after(100, () => this.movedChecker())
                    return false
                }

                if (!this.tryUse(selected, index)) {
                    sounds.play(sounds.error)
                    return true
                }

                this._canUse = false

                after(250, () => this.postUse())

                return false
            }
        )
    }

    protected movedChecker(): void {
        if (this.overlapsWith(player)) {
            after(100, () => this.movedChecker())
        } else {
            this._canUse = true
        }
    }
}


class Shrine extends InteractiveItem {
    public get image(): Image { return sprites.dungeon.statueLight }
    protected readonly SPENT_IMAGE = sprites.dungeon.statueDark
    protected get isSpent(): boolean { return this.image == this.SPENT_IMAGE }
    protected get message(): string { return `What will you give up?` }

    constructor(tile: tiles.Location) {
        super(tile)
        this.y -= 7 // Standing on the tile and so we can interact with it.
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
        player.coins += 100
        sounds.play(sounds.sacrifice)

        this.startEffect(effects.coolRadial, 2000)
        after(1000, () => this.setImage(this.SPENT_IMAGE))
    }
}

class Mushroom extends InteractiveItem {
    public get image(): Image { return assets.tile`mushroom` }
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
        this.destroy(effects.hearts, 1000)
    }
}


class Shop extends InteractiveItem {
    protected get message() { return `You have ${player.coins} gold` }
    protected get wares(): ShopItem[] { throw NOT_IMPLEMENTED }

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
        this.unsummon()
    }
}

class ItemShop extends Shop {
    public get image(): Image { return sprites.builtin.villager3WalkFront1 }

    protected get wares(): ShopItem[] {
        return [
            [assets.image`life`, "Life Potion", 10],
            [assets.image`mana`, "Mana Crystal", 10],
            [assets.image`key`, "Skeleton Key", 10],
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
    public get image(): Image { return sprites.builtin.villager1WalkFront1 }

    protected get wares(): ShopItem[] {
        return SPELL_BOOK.map<ShopItem>((spell: Spell, _: number) => {
            return [spell.icon, `${spell.mana || '*'} ${spell.title}`, spell.value]
        })
    }

    protected purchase(selected: string, index: number): void {
        player.secondarySpell = SPELL_BOOK[index]
    }
}
