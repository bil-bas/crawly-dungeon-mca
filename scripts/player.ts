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
    _coins = 0
    _keys = 0
    _mana = INITIAL_MANA
    _maxMana = INITIAL_MANA
    _maxLife = INITIAL_LIFE
    _sprite: Sprite
    _primarySpell: Spell
    _secondarySpell: Spell
    _primarySpellIndicator: TextSprite
    _secondarySpellIndicator: TextSprite
    _speed = 60

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
        this._primarySpellIndicator = spellIndicator(this._primarySpell, true)
    }
    get secondarySpell(): Spell { return this._secondarySpell }
    set secondarySpell(spell: Spell) {
        if (this._secondarySpellIndicator) {
            this._secondarySpellIndicator.destroy()
        }
        this._secondarySpell = spell
        this._secondarySpellIndicator = spellIndicator(this._secondarySpell, false)
    }

    get sprite(): Sprite { return this._sprite }
    get is_falling(): boolean { return this._is_falling }
  
    get coins(): number { return this._coins }
    set coins(value: number) {
        change_floater(sprites.builtin.coin0, value - this._coins)
        this._coins = value
        info.setScore(value)
        update_labels()
    }

    get mana(): number { return this._mana }
    set mana(value: number) {
        change_floater(sprites.projectile.firework1, value - this._mana)
        this._mana = value
        update_labels()
    }

    get maxMana(): number { return this._maxMana }
    set maxMana(value: number) {
        this._maxMana = value
        update_labels()
    }

    get maxLife(): number { return this._maxLife }
        set maxLife(value: number) {
        this._maxLife = value
        update_labels()
    }

    get keys(): number { return this._keys }
    set keys(value: number) {
        change_floater(assets.image`key`, value - this._keys)
        this._keys = value
        update_labels()
    }

    get life(): number { return info.life() }
    set life(value: number) {
        change_floater(sprites.projectile.heart3, value - info.life())
        info.setLife(value)
        update_labels()
    }

    constructor() {
        this._sprite = sprites.create(sprites.swamp.witchForward0, SpriteKind.Player)
        this._sprite.z = ZOrder.PLAYER
        scene.cameraFollowSprite(this._sprite)
        info.setLife(INITIAL_LIFE)
        info.showLife(false)
        info.showScore(false)
        game.setGameOverScoringType(game.ScoringType.HighScore)

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
        sprites.onOverlap(SpriteKind.Player, SpriteKind.Item, (sprite: Sprite, item: Sprite) => {
            this.touchedItem(item)
        })

        sprites.onOverlap(SpriteKind.Player, SpriteKind.Person, (sprite: Sprite, person: Sprite) => {
            person.data["obj"].touch()
        })

        scene.onHitWall(SpriteKind.Player, (sprite: Sprite, tile: tiles.Location) => {
            this.touchedWall(tile)
        })

        sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, (sprite: Sprite, enemy: Sprite) => {
            this.touchedEnemy(enemy)
        })

        for (let stair of ALL_STAIRS) {
            scene.onOverlapTile(SpriteKind.Player, stair, (sprite: Sprite, tile: tiles.Location) => {
                this.touchedStairs(tile)
            })
        }

        // Casting spells

        controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
            if (!Menu.allClosed || !this._primarySpell.canCast() || this.is_falling) return
            this._primarySpell.cast()
        })

        controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
            if (!Menu.allClosed || !this._secondarySpell.canCast() || this.is_falling) return
            this._secondarySpell.cast()
        })
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
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
            tiles.setWallAt(tile, false)
        }
    }

    touchedEnemy(enemy: Sprite) {
        music.play(music.melodyPlayable(music.thump), music.PlaybackMode.InBackground)
        let injury = enemy.data["obj"].melee(1)
        if (injury != 0) {
            this.life -= injury
        }
    }

    touchedItem(sprite: Sprite) {
        let obj: Item = sprite.data["obj"]
        if (!obj.canUse) return

        obj.use()
    }

    touchedStairs(tile: tiles.Location) {
        if (this._is_falling) return

        this._is_falling = true

        this.freeze()
        tiles.placeOnTile(this._sprite, tile)

        timer.after(250, () => {
            music.play(music.melodyPlayable(music.jumpDown), music.PlaybackMode.InBackground)
            this._sprite.setScale(0.75)

            timer.after(500, () => {
                this._sprite.setScale(0.5)

                timer.after(500, () => {
                    dungeon.advance()
                    this._is_falling = false
                })
            })
        })
    }
}

class Witch extends Player {
    get animUp() { return [sprites.swamp.witchBack0, sprites.swamp.witchBack1, sprites.swamp.witchBack2, sprites.swamp.witchBack3] }
    get animDown() { return [sprites.swamp.witchForward0, sprites.swamp.witchForward1, sprites.swamp.witchForward2, sprites.swamp.witchForward3] }
    get animLeft() { return [sprites.swamp.witchLeft0, sprites.swamp.witchLeft1, sprites.swamp.witchLeft2, sprites.swamp.witchLeft3] }
    get animRight() { return [sprites.swamp.witchRight0, sprites.swamp.witchRight1, sprites.swamp.witchRight2, sprites.swamp.witchRight3] }

    _setInitialSpells() {
        this.primarySpell = new Firebolt()
        this.secondarySpell = new Heal()
    }
}

class Brute extends Player {
    get animUp() { return [sprites.castle.heroWalkBack1 , sprites.castle.heroWalkBack2, sprites.castle.heroWalkBack3, sprites.castle.heroWalkBack4] }
    get animDown() { return [sprites.castle.heroWalkFront1, sprites.castle.heroWalkFront2, sprites.castle.heroWalkFront3, sprites.castle.heroWalkFront4] }
    get animLeft() { return [sprites.castle.heroWalkSideLeft1, sprites.castle.heroWalkSideLeft2, sprites.castle.heroWalkSideLeft3, sprites.castle.heroWalkSideLeft4] }
    get animRight() { return [sprites.castle.heroWalkSideRight1, sprites.castle.heroWalkSideRight2, sprites.castle.heroWalkSideRight3, sprites.castle.heroWalkSideRight4] }

    _setInitialSpells() {
        this.primarySpell = new Firebolt()
        this.secondarySpell = new BloodMagic()
    }
}