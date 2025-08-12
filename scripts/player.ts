const INITIAL_MANA = 3
const INITIAL_LIFE = 3

const ALL_STAIRS: Image[] = [
    sprites.dungeon.stairNorth,
    sprites.dungeon.stairEast,
    sprites.dungeon.stairWest,
    sprites.dungeon.stairSouth,
]


class Player {        
    _is_falling = false
    _keys: int8 = 0
    _coins: number = 0
    _mana: int8 = INITIAL_MANA
    _maxMana: int8 = INITIAL_MANA
    _life: int8 = INITIAL_LIFE
    _maxLife: int8 = INITIAL_LIFE
    _sprite: Sprite
    _primarySpell: Spell
    _secondarySpell: Spell
    _primarySpellIndicator: SpellIndicator
    _secondarySpellIndicator: SpellIndicator
    _speed: int8 = 60
    _klass: string

    get animUp(): Image[] { return null }
    get animDown(): Image[] { return null }
    get animLeft(): Image[] { return null }
    get animRight(): Image[] { return null }
        
    get primarySpell(): Spell { return this._primarySpell }
    set primarySpell(spell: Spell) {
        if (this._primarySpellIndicator) {
            this._primarySpellIndicator.destroy()
        }
        this._primarySpell = spell
        this._primarySpellIndicator = new SpellIndicator(this._primarySpell, true)
    }
    get secondarySpell(): Spell { return this._secondarySpell }
    set secondarySpell(spell: Spell) {
        if (this._secondarySpellIndicator) {
            this._secondarySpellIndicator.destroy()
        }
        this._secondarySpell = spell
        this._secondarySpellIndicator = new SpellIndicator(this._secondarySpell, false)
    }

    get sprite(): Sprite { return this._sprite }
    get is_falling(): boolean { return this._is_falling }
  
    get coins(): number { return this._coins }
    set coins(value: number) {
        new StatUpdate(sprites.builtin.coin0, value - this._coins)
        this._coins = value
        update_labels()
    }

    get mana(): int8 { return this._mana }
    set mana(value: number) {
        new StatUpdate(sprites.projectile.firework1, value - this._mana)
        this._mana = value
        update_labels()
    }

    get maxMana(): int8 { return this._maxMana }
    set maxMana(value: number) {
        this._maxMana = value
        update_labels()
    }

    get maxLife(): int8 { return this._maxLife }
        set maxLife(value: number) {
        this._maxLife = value
        update_labels()
    }

    get keys(): int8 { return this._keys }
    set keys(value: number) {
        new StatUpdate(assets.image`key`, value - this._keys)
        this._keys = value
        update_labels()
    }

    get life(): int8 { return this._life }
    set life(value: number) {
        new StatUpdate(sprites.projectile.heart3, value - this._life)
        this._life = Math.max(value, 0)
        update_labels()
        if (this._life == 0) {
            dataStore.setRichest(this._klass, this.coins)
            new DeathMessage(this)
        }
    }
    
    constructor(klass: string) {
        this._klass = klass
        this._sprite = sprites.create(sprites.swamp.witchForward0, SpriteKind.Player)
        this._sprite.z = ZOrder.PLAYER
        scene.cameraFollowSprite(this._sprite)

        this._addAnimations()
        this._setInitialSpells()

        shadowcasting.setAnchor(this._sprite)
        shadowcasting.setShadowColor(Colour.BLACK)
        shadowcasting.setShadowMode(shadowcasting.ShadowCastingMode.Fill)

        this._initEventHandlers()
        this.resetMovement()
    }

    freeze() {
        this._speed = 0
        this.updateMovement()
    }

    resetMovement() {
        this._speed = 60
        this.updateMovement()
    }

    updateMovement() {
        controller.moveSprite(this._sprite, this._speed, this._speed)
    }

    _initEventHandlers() {
        // Interacting with the environment
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Item, (_: Sprite, item: Sprite) => {
            this.touchedItem(item.data["obj"])
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
            this.touchedEnemy(enemy)
        })

        for (let stair of ALL_STAIRS) {
            scene.onOverlapTile(SpriteKind.Player, stair, (sprite: Sprite, tile: tiles.Location) => {
                this.touchedStairs(tile)
            })
        }

        // Casting spells
        controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
            if (this.is_falling) return
        
            if (this._primarySpell.canCast()) {
                this._primarySpell.cast()
            } else {
                sounds.play(sounds.spellFail)
            }
        })

        controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
            if (this.is_falling) return

            if (this._secondarySpell.canCast()) {
                this._secondarySpell.cast()
            } else {
                sounds.play(sounds.spellFail)
            }
        })
    }

    touchedTile(image: Image, tile: tiles.Location) {
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
    _setInitialSpells() {}

    _addAnimation(frames: Image[], predicate: Predicate) {
        characterAnimations.loopFrames(this._sprite, frames, 200, characterAnimations.rule(predicate))
    }

    _addAnimations() {
        this._addAnimation(this.animUp, Predicate.MovingUp)
        this._addAnimation([this.animUp[0]], Predicate.FacingUp)
        
        this._addAnimation(this.animDown, Predicate.MovingDown)
        this._addAnimation([this.animDown[0]], Predicate.FacingDown)
        
        this._addAnimation(this.animLeft, Predicate.MovingLeft)
        this._addAnimation([this.animLeft[0]], Predicate.FacingLeft)
        
        this._addAnimation(this.animRight, Predicate.MovingRight)
        this._addAnimation([this.animRight[0]], Predicate.FacingRight)
    }

    touchedWall(tile: tiles.Location) {
        if (tiles.tileAtLocationEquals(tile, sprites.dungeon.doorLockedNorth) && this.keys >= 1) {
            this.keys -= 1
            tiles.setTileAt(tile, sprites.dungeon.doorOpenNorth)
            tiles.setWallAt(tile, false)
            sounds.play(sounds.unlock)
        }
    }

    touchedEnemy(enemy: Sprite) {
        sounds.play(sounds.melee)
        let injury = enemy.data["obj"].melee(1)
        this.life -= injury
    }

    touchedItem(obj: Item) {
        if (obj.canUse) obj.use()
    }

    touchedStairs(tile: tiles.Location) {
        if (this._is_falling) return

        this._is_falling = true

        this.freeze()
        tiles.placeOnTile(this._sprite, tile)

        after(250, () => {
            sounds.play(sounds.stairs)
            this._sprite.setScale(0.75)

            after(500, () => {
                this._sprite.setScale(0.5)

                after(500, () => {
                    dungeon.advance()
                    this._is_falling = false
                })
            })
        })
    }
}

class Witch extends Player {
    static get title() { return "Witch" }

    get animUp() { return [sprites.swamp.witchBack0, sprites.swamp.witchBack1, sprites.swamp.witchBack2, sprites.swamp.witchBack3] }
    get animDown() { return [sprites.swamp.witchForward0, sprites.swamp.witchForward1, sprites.swamp.witchForward2, sprites.swamp.witchForward3] }
    get animLeft() { return [sprites.swamp.witchLeft0, sprites.swamp.witchLeft1, sprites.swamp.witchLeft2, sprites.swamp.witchLeft3] }
    get animRight() { return [sprites.swamp.witchRight0, sprites.swamp.witchRight1, sprites.swamp.witchRight2, sprites.swamp.witchRight3] }

    _setInitialSpells() {
        this.primarySpell = new Firebolt()
        this.secondarySpell = new Heal()
    }
}

class Haemomancer extends Witch {
    static get title() { return "Haemomancer" }

    _setInitialSpells() {
        this.primarySpell = new Firebolt()
        this.secondarySpell = new BloodMagic()
    }
}

class Archmage extends Witch {
    static get title() { return "Archmage" }

    _setInitialSpells() {
        this.primarySpell = new Firebolt()
        this.secondarySpell = new Fireball()
    }
}

class Random extends Player {
    static get title() { return "Random" }
}
