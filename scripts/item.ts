type ShopItem = [Image, string, number]

class Item extends Entity {
    protected canUse: boolean = true

    protected get message(): string { throw NOT_IMPLEMENTED }
    protected get options(): MenuOption[] {  throw NOT_IMPLEMENTED }

    constructor(image: Image, tile: tiles.Location) {
        super(image, SpriteKind.Item, ZOrder.ITEMS, tile)
    }

    protected tryUse(selected: string, index: number): boolean { return true }
    protected postUse(): void { }

    use(): void {
        if (!this.canUse) return

        this.canUse = false

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

                this.canUse = false

                after(250, () => this.postUse())

                return false
            }
        )
    }

    protected movedChecker(): void {
        if (this.overlapsWith(player)) {
            after(100, () => this.movedChecker())
        } else {
            this.canUse = true
        }
    }
}


class Shrine extends Item {
    protected readonly SPENT_IMAGE = sprites.dungeon.statueDark

    protected get isSpent(): boolean { return this.image == this.SPENT_IMAGE }
    protected get message(): string { return `What will you give up?` }

    constructor(tile: tiles.Location) {
        super(sprites.dungeon.statueLight, tile)
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

class Mushroom extends Item {
    protected get message(): string { return "What dare you injest?" }

    constructor(tile: tiles.Location) {
        super(assets.tile`mushroom`, tile)
    }

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


class Shop extends Item {
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
    constructor(tile: tiles.Location) {
        super(sprites.builtin.villager3WalkFront1, tile)
    }

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
    constructor(tile: tiles.Location) {
        super(sprites.builtin.villager1WalkFront1, tile)
    }

    protected get wares(): ShopItem[] {
        return SPELL_BOOK.map<ShopItem>((spell: Spell, _: number) => {
            return [spell.icon, `${spell.mana || '*'} ${spell.title}`, spell.value]
        })
    }

    protected purchase(selected: string, index: number): void {
        player.secondarySpell = SPELL_BOOK[index]
    }
}
