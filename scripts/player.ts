const INITIAL_MANA = 3
const INITIAL_LIFE = 3

const ALL_STAIRS: Image[] = [
    sprites.dungeon.stairNorth,
    sprites.dungeon.stairEast,
    sprites.dungeon.stairWest,
    sprites.dungeon.stairSouth,
]


class Player extends Entity {
    static get title(): string { throw null }
    static get icon(): Image { return sprites.swamp.witchForward0 }

    protected isFalling: boolean = false
    protected _keys: int8 = 0
    protected _coins: number = 0
    protected _mana: int8 = INITIAL_MANA
    protected _maxMana: int8 = INITIAL_MANA
    protected _maxLife: int8 = INITIAL_LIFE
    protected _primarySpell: Spell
    protected _secondarySpell: Spell
    protected _primarySpellIndicator: SpellIndicator
    protected _secondarySpellIndicator: SpellIndicator
    protected _speed: int8 = 60
    protected _pet: Pet|null = null

    public get pet(): Pet|null { return this._pet }
    public set pet(pet: Pet | null) {
        if (this.pet) {
            this.pet.unsummon()
        }
        this._pet = pet
    }

    protected animUp() { return [sprites.swamp.witchBack0, sprites.swamp.witchBack1, sprites.swamp.witchBack2, sprites.swamp.witchBack3] }
    protected animDown() { return [sprites.swamp.witchForward0, sprites.swamp.witchForward1, sprites.swamp.witchForward2, sprites.swamp.witchForward3] }
    protected animLeft() { return [sprites.swamp.witchLeft0, sprites.swamp.witchLeft1, sprites.swamp.witchLeft2, sprites.swamp.witchLeft3] }
    protected animRight() { return [sprites.swamp.witchRight0, sprites.swamp.witchRight1, sprites.swamp.witchRight2, sprites.swamp.witchRight3] }

    public get primarySpell(): Spell|null { return this._primarySpell }
    public set primarySpell(spell: Spell) {
        if (this._primarySpellIndicator) {
            this._primarySpellIndicator.destroy()
        }
        this._primarySpell = spell
        this._primarySpellIndicator = new SpellIndicator(this._primarySpell, true)
    }
    public get secondarySpell(): Spell|null { return this._secondarySpell }
    public set secondarySpell(spell: Spell) {
        if (this._secondarySpellIndicator) {
            this._secondarySpellIndicator.destroy()
        }
        this._secondarySpell = spell
        this._secondarySpellIndicator = new SpellIndicator(this._secondarySpell, false)
    }

    public get coins(): number { return this._coins }
    public set coins(value: number) {
        new StatUpdate(sprites.builtin.coin0, value - this._coins)
        this._coins = value
        gui.updateLabels()
    }

    public get mana(): int8 { return this._mana }
    public set mana(value: number) {
        new StatUpdate(sprites.projectile.firework1, value - this._mana)
        this._mana = value
        gui.updateLabels()
    }

    public get maxMana(): int8 { return this._maxMana }
    public set maxMana(value: number) {
        this._maxMana = value
        gui.updateLabels()
    }

    public get maxLife(): int8 { return this._maxLife }
    public set maxLife(value: number) {
        this._maxLife = value
        gui.updateLabels()
    }

    public get keys(): int8 { return this._keys }
    public set keys(value: number) {
        new StatUpdate(assets.image`key`, value - this._keys)
        this._keys = value
        gui.updateLabels()
    }

    public get life(): int8 { return this._life }
    public set life(value: number) {
        new StatUpdate(sprites.projectile.heart3, value - this._life)
        this._life = Math.max(value, 0)
        gui.updateLabels()
        if (this._life == 0) {
            this.maxLife = 0
            this.onDeath()
        }
    }

    protected onDeath(): void {
        sounds.play(sounds.enemyDeath)
        dataStore.setRichest(this.title, this.coins)
        new DeathMessage(this)
        this.destroy()
    }

    constructor(public title: string) {
        super(sprites.swamp.witchForward0, SpriteKind.Player, ZOrder.PLAYER, tiles.getTileLocation(0, 0))
        scene.cameraFollowSprite(this)

        this.addAnimations()

        shadowcasting.setAnchor(this)
        shadowcasting.setShadowColor(Colour.BLACK)
        shadowcasting.setShadowMode(shadowcasting.ShadowCastingMode.Fill)

        this.initEventHandlers()
        this.resetMovement()

        this.primarySpell = findSpell("Firebolt")
        this.secondarySpell = findSpell("Fireball")
    }

    public freeze(): void {
        this._speed = 0
        this.updateMovement()
    }

    public resetMovement(): void {
        this._speed = 60
        this.updateMovement()
    }

    protected updateMovement(): void {
        controller.moveSprite(this, this._speed, this._speed)
    }

    protected initEventHandlers(): void {
        // Interacting with the environment
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Item, (_: Sprite, item: Sprite) => {
            let item_ = item as Item
            item_.use()
        })

        scene.onHitWall(SpriteKind.Player, (_: Sprite, tile: tiles.Location) => {
            this.touchedWall(tile)
        })

        for (let image of [assets.tile`chest`, assets.tile`key`,
                           assets.tile`mana potion`, assets.tile`life potion`]) {
            scene.onOverlapTile(SpriteKind.Player, image, (_: Sprite, tile: tiles.Location) => {
                this.touchedTile(image, tile)
            })
        }

        sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, (_: Sprite, enemy: Sprite) => {
            let enemy_ = enemy as Enemy
            this.touchedEnemy(enemy_)
        })

        for (let stair of ALL_STAIRS) {
            scene.onOverlapTile(SpriteKind.Player, stair, (sprite: Sprite, tile: tiles.Location) => {
                this.touchedStairs(tile)
            })
        }

        // Casting spells
        controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
            if (this.isFalling) return

            if (this._primarySpell.canCast()) {
                this._primarySpell.cast()
            } else {
                sounds.play(sounds.spellFail)
            }
        })

        controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
            if (this.isFalling) return

            if (this._secondarySpell.canCast()) {
                this._secondarySpell.cast()
            } else {
                sounds.play(sounds.spellFail)
            }
        })
    }

    protected touchedTile(image: Image, tile: tiles.Location): void {
        switch (image) {
            case assets.tile`key`:
                dungeon.clearTile(tile)
                this.keys += 1
                sounds.play(sounds.useItemSound)
                break
            case assets.tile`chest`:
                if (this.keys) {
                    this.keys -= 1
                    this.coins += randint(100, 200)
                    tiles.setTileAt(tile, sprites.dungeon.chestOpen)
                    sounds.play(sounds.unlock)
                }
                break
            case assets.tile`life potion`:
                if (this.life < this.maxLife) {
                    dungeon.clearTile(tile)
                    this.life += 1
                    sounds.play(sounds.useItemSound)
                }
                break
            case assets.tile`mana potion`:
                if (this.mana < this.maxMana) {
                    dungeon.clearTile(tile)
                    this.mana += 1
                    sounds.play(sounds.useItemSound)
                }
                break
        }
    }

    protected addAnimations(): void {
        this.addAnimation(this.animUp(), Predicate.MovingUp)
        this.addAnimation([this.animUp()[0]], Predicate.FacingUp)
        this.addAnimation(this.animUp(), Predicate.HittingWallUp)

        this.addAnimation(this.animDown(), Predicate.MovingDown)
        this.addAnimation([this.animDown()[0]], Predicate.FacingDown)
        this.addAnimation(this.animDown(), Predicate.HittingWallDown)

        this.addAnimation(this.animLeft(), Predicate.MovingLeft)
        this.addAnimation([this.animLeft()[0]], Predicate.FacingLeft)
        this.addAnimation(this.animLeft(), Predicate.HittingWallLeft)

        this.addAnimation(this.animRight(), Predicate.MovingRight)
        this.addAnimation([this.animRight()[0]], Predicate.FacingRight)
        this.addAnimation(this.animRight(), Predicate.HittingWallRight)
    }

    protected touchedWall(tile: tiles.Location): void {
        if (tiles.tileAtLocationEquals(tile, sprites.dungeon.doorLockedNorth) && this.keys >= 1) {
            this.keys -= 1
            tiles.setTileAt(tile, sprites.dungeon.doorOpenNorth)
            tiles.setWallAt(tile, false)
            sounds.play(sounds.unlock)
        }
    }

    protected touchedEnemy(enemy: Enemy): void {
        let injury = enemy.melee(1)
        if (injury) {
            this.life -= injury
        }
    }

    protected touchedStairs(tile: tiles.Location): void {
        if (this.isFalling) return

        this.isFalling = true

        this.freeze()
        tiles.placeOnTile(this, tile)

        after(250, () => {
            sounds.play(sounds.stairs)
            this.setScale(0.75)

            after(500, () => {
                this.setScale(0.5)

                after(500, () => {
                    dungeon.advance()
                    this.isFalling = false
                })
            })
        })
    }
}

class Wizard extends Player {
    static get title(): string { return "Wizard" }

    constructor(klass: string) {
        super(klass)
        this.secondarySpell = findSpell("Fireball")
    }
}

class BloodWitch extends Wizard {
    static get title(): string { return "Blood Witch" }
    static get icon(): Image { return images.replaceColour(Player.icon, Colour.YELLOW, Colour.RED) }

    protected animUp() { return images.replaceColourAll(super.animUp(), Colour.YELLOW, Colour.RED) }
    protected animDown() { return images.replaceColourAll(super.animDown(), Colour.YELLOW, Colour.RED) }
    protected animLeft() { return images.replaceColourAll(super.animLeft(), Colour.YELLOW, Colour.RED) }
    protected animRight() { return images.replaceColourAll(super.animRight(), Colour.YELLOW, Colour.RED) }

    constructor(klass: string) {
        super(klass)
        this.secondarySpell = findSpell("Blood Magic")
    }
}

class Druid extends Wizard {
    static get title(): string { return "Druid" }
    static get icon(): Image { return images.replaceColour(Player.icon,  Colour.YELLOW, Colour.GREEN) }

    protected animUp() { return images.replaceColourAll(super.animUp(), Colour.YELLOW, Colour.GREEN) }
    protected animDown() { return images.replaceColourAll(super.animDown(), Colour.YELLOW, Colour.GREEN) }
    protected animLeft() { return images.replaceColourAll(super.animLeft(), Colour.YELLOW, Colour.GREEN) }
    protected animRight() { return images.replaceColourAll(super.animRight(), Colour.YELLOW, Colour.GREEN) }

    constructor(klass: string) {
        super(klass)
        this.secondarySpell = findSpell("Summon")
    }
}


class Random extends Player {
    static get title() { return "Random" }
    static get icon(): Image { return assets.image`random` }
}
