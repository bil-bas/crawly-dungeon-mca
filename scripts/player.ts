const INITIAL_MANA = 3
const INITIAL_LIFE = 3

const ALL_STAIRS = [
    sprites.dungeon.stairNorth,
    sprites.dungeon.stairEast,
    sprites.dungeon.stairWest,
    sprites.dungeon.stairSouth,
]

// Interacting with the dungeon

sprites.onOverlap(SpriteKind.Player, SpriteKind.Item, (sprite: Sprite, item: Sprite) => {
    player.touchedItem(item)
})

scene.onHitWall(SpriteKind.Player, (sprite: Sprite, tile: tiles.Location) => {
   player.touchedWall(tile)
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, (sprite: Sprite, enemy: Sprite) => {
    player.touchedEnemy(enemy)
})

ALL_STAIRS.forEach((stair) => {
    scene.onOverlapTile(SpriteKind.Player, stair, (sprite: Sprite, tile: tiles.Location) => {
        player.touchedStairs(tile)
    })
})

// Casting spells

controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
    if (menuIsVisible) return
    player.castPrimarySpell()
})

controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
    if (menuIsVisible) return
    player.castSecondarySpell()
})


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
    }

    constructor() {
        this._sprite = sprites.create(sprites.swamp.witchForward0, SpriteKind.Player)
        this._sprite.z = ZLevel.PLAYER
        scene.cameraFollowSprite(this._sprite)
        info.setLife(INITIAL_LIFE)
        this.addAnimations()

        this.primarySpell = new Firebolt()
        this.secondarySpell = new Heal()
    }

    addAnimations() {
        // UP
        characterAnimations.loopFrames(this._sprite,
            [sprites.swamp.witchBack0, sprites.swamp.witchBack1, sprites.swamp.witchBack2, sprites.swamp.witchBack3],
            200, characterAnimations.rule(Predicate.MovingUp))
        
        characterAnimations.loopFrames(this._sprite, [sprites.swamp.witchBack0],
            200, characterAnimations.rule(Predicate.FacingUp))
        
        // DOWN
        characterAnimations.loopFrames(this._sprite,
            [sprites.swamp.witchForward0, sprites.swamp.witchForward1, sprites.swamp.witchForward2, sprites.swamp.witchForward3],
            200, characterAnimations.rule(Predicate.MovingDown))
        
        characterAnimations.loopFrames(this._sprite, [sprites.swamp.witchForward0],
            200, characterAnimations.rule(Predicate.FacingDown))
        
        // LEFT
        characterAnimations.loopFrames(this._sprite,
            [sprites.swamp.witchLeft0, sprites.swamp.witchLeft1, sprites.swamp.witchLeft2, sprites.swamp.witchLeft3],
            200, characterAnimations.rule(Predicate.MovingLeft))
        
        characterAnimations.loopFrames(this._sprite, [sprites.swamp.witchLeft0],
            200, characterAnimations.rule(Predicate.FacingLeft))
        
        // Right
        characterAnimations.loopFrames(this._sprite,
            [sprites.swamp.witchRight0, sprites.swamp.witchRight1, sprites.swamp.witchRight2, sprites.swamp.witchRight3],
            200, characterAnimations.rule(Predicate.MovingRight))
        
        characterAnimations.loopFrames(this._sprite, [sprites.swamp.witchRight0],
            200, characterAnimations.rule(Predicate.FacingRight))
    }

    touchedWall(tile: tiles.Location) {
        if (tiles.tileAtLocationEquals(tile, sprites.dungeon.doorLockedNorth) && this.keys >= 1) {
            this.keys -= 1
            tiles.setTileAt(tile, sprites.dungeon.doorOpenNorth)
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
            tiles.setWallAt(tile, false)
        } else if (tiles.tileAtLocationEquals(tile, sprites.dungeon.chestClosed) && this.keys >= 1) {
            this.keys -= 1
            tiles.setTileAt(tile, sprites.dungeon.chestOpen)
            music.play(music.melodyPlayable(music.knock), music.PlaybackMode.InBackground)
            this.coins += 100
        }
    }

    touchedEnemy(enemy: Sprite) {
        music.play(music.melodyPlayable(music.thump), music.PlaybackMode.InBackground)
        this.life -= enemy.data["obj"].melee(1)
    }

    touchedItem(sprite: Sprite) {
        let obj: Item = sprite.data["obj"]
        if (!obj.canUse) return

        obj.use()
    }

    touchedStairs(tile: tiles.Location) {
        if (this._is_falling) return

        this._is_falling = true

        controller.moveSprite(this._sprite, 0, 0)
        tiles.placeOnTile(this._sprite, tile)

        timer.after(250, () => {
            music.play(music.melodyPlayable(music.jumpDown), music.PlaybackMode.InBackground)
            this._sprite.setScale(0.75)

            timer.after(500, () => {
                this._sprite.setScale(0.5)

                timer.after(500, () => {
                    dungeon.advance_level()
                    this._is_falling = false
                })
            })
        })
    }

    castPrimarySpell() {
        if (!this.primarySpell.canCast() || this.is_falling) return

        this._primarySpell.cast()
    }

    castSecondarySpell() {
        if (!this.secondarySpell.canCast() || this.is_falling) return

        this.secondarySpell.cast()
    }
}
