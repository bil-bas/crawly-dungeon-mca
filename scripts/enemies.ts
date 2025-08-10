// Enemy interactions
scene.onHitWall(SpriteKind.Enemy, (enemy: Sprite, tile: tiles.Location) => {
    enemy.data["obj"].touchWall(tile)
})

// Base enemy obj.
class Enemy {
    _sprite: Sprite
    _life: int8
    _lifeBar: StatusBarSprite

    constructor(tile: tiles.Location) {
        this._sprite = sprites.create(this.spriteImage, SpriteKind.Enemy)
        tiles.placeOnTile(this._sprite, tile)
        this._sprite.setFlag(SpriteFlag.BounceOnWall, true)
        this._sprite.z = ZOrder.ENEMIES
        this._sprite.data["obj"] = this
        this._life = this.initial_life
    }

    get name(): string { return null }
    get sprite(): Sprite { return this._sprite }
    get spriteImage(): Image { return null }
    get initial_life(): int8 { return 1 }
    get killedMessage(): string { return `Murdered by ${this.name}` }

    get life(): int8 { return this._life }
    set life(value: number) {
        this._life = Math.max(value, 0)

        if (this._life == 0) {
            this._sprite.destroy()
            if (this._lifeBar) {
                this._lifeBar.destroy()
            }
            music.play(music.melodyPlayable(music.bigCrash), music.PlaybackMode.InBackground)
        } else if (this._life == this.initial_life) {
            // hide status bar when fully healed.
            if (this._lifeBar) {
                this._lifeBar.destroy()
                this._lifeBar = null
            }
        } else {
            // Create a new status bar if necessary
            if (!this._lifeBar) {
                this._lifeBar = statusbars.create(this._sprite.width, 2, StatusBarKind.EnemyHealth)
                this._lifeBar.max = this.initial_life
                this._lifeBar.attachToSprite(this._sprite)
            }

            this._lifeBar.value = this._life
        }
    }

    melee(damage: number) : int8 {
        this.life -= damage
        game.setGameOverMessage(false, this.killedMessage)
        return 1
    }

    add_animation(images: Image[], predicate1: Predicate, predicate2?: Predicate) {
        let rule: characterAnimations.Rule
        
        if (predicate2) {
            rule = characterAnimations.rule(predicate1, predicate2)
        } else {
            rule = characterAnimations.rule(predicate1)
        }
        characterAnimations.loopFrames(this._sprite, images, 200, rule)
    }

    touchWall(tile: tiles.Location) {}
}

// BAT
class Bat extends Enemy {
    get spriteImage(): Image { return sprites.builtin.forestBat0 }
    get name(): string { return "Bat" }
    get killedMessage(): string { return `Exsanguinated by ${this.name}` }

    constructor(tile: tiles.Location) {
        super(tile)

        this._sprite.vx = 40

        let left = [sprites.builtin.forestBat0, sprites.builtin.forestBat1, sprites.builtin.forestBat2, sprites.builtin.forestBat3]
        this.add_animation(left, Predicate.MovingLeft)
        
        this.add_animation(left, Predicate.MovingRight)
    }
}


// HERMIT CRAB
class HermitCrab extends Enemy {
    get spriteImage(): Image { return sprites.builtin.hermitCrabWalk0 }
    get name(): string { return "Hermit Crab" }
    get killedMessage(): string { return `Squished by ${this.name}` }
    get initial_life(): number { return 3 }

    constructor(tile: tiles.Location) {
        super(tile)

        this._sprite.vy = -30
        this._sprite.setScale(2)

        let walk = [sprites.builtin.hermitCrabWalk0, sprites.builtin.hermitCrabWalk1, sprites.builtin.hermitCrabWalk2, sprites.builtin.hermitCrabWalk3]
        this.add_animation(walk, Predicate.MovingUp)
        this.add_animation(walk, Predicate.MovingDown)
        this.add_animation(walk, Predicate.MovingLeft)
        this.add_animation(walk, Predicate.MovingRight)
    }

    touchWall(tile: tiles.Location) {
        let crab = this._sprite
        if (characterAnimations.matchesRule(crab, characterAnimations.rule(Predicate.MovingUp))) {
            crab.setVelocity(-30, 0)
            console.log("up to left")
        } else if (characterAnimations.matchesRule(crab, characterAnimations.rule(Predicate.MovingDown))) {
            crab.setVelocity(30, 0)
            console.log("down to right")
        } else if (characterAnimations.matchesRule(crab, characterAnimations.rule(Predicate.MovingLeft))) {
            crab.setVelocity(0, 30)
            console.log("left to down")
        } else if (characterAnimations.matchesRule(crab, characterAnimations.rule(Predicate.MovingRight))) {
            crab.setVelocity(0, -30)
            console.log("right to up")
        }
    }
}

// Monkey steals keys
class Monkey extends Enemy {
    get spriteImage(): Image { return sprites.builtin.forestMonkey0 }
    get name(): string { return "Monkey" }
    get killedMessage(): string { return `Eyes gouged by ${this.name}` }

    constructor(tile: tiles.Location) {
        super(tile)
        this._sprite.vy = 50

        let up = [sprites.builtin.forestMonkey0, sprites.builtin.forestMonkey1, sprites.builtin.forestMonkey2, sprites.builtin.forestMonkey3]
        this.add_animation(up, Predicate.MovingUp)
        
        let down = [sprites.builtin.forestMonkey4, sprites.builtin.forestMonkey5, sprites.builtin.forestMonkey2, sprites.builtin.forestMonkey7]
        this.add_animation(up, Predicate.MovingDown)
    }

    melee(damage: number): int8 {
        if (player.keys > 0) {
            player.keys -= 1
            this.life -= damage
            return 0
        }
        return super.melee(damage)
    }
}

class Shroom extends Enemy {
    get tileImage(): Image { return assets.tile`mimic` }
    get spriteImage(): Image { return sprites.builtin.forestMonkey0 }
    get name(): string { return "Shroom" }
    get killedMessage(): string { return `Zoomed by a ${this.name}` }

    constructor(tile: tiles.Location) {
        super(tile)

        this._sprite.vx = 20
        this._sprite.vy = 20

        let ne = [sprites.swamp.mushroomBackLeft0, sprites.swamp.mushroomBackLeft2, sprites.swamp.mushroomBackLeft2, sprites.swamp.mushroomBackLeft3]
        this.add_animation(ne, Predicate.MovingLeft, Predicate.MovingUp)
        
        let nw = [sprites.swamp.mushroomBackRight0, sprites.swamp.mushroomBackRight1, sprites.swamp.mushroomBackRight2, sprites.swamp.mushroomBackRight3]
        this.add_animation(nw, Predicate.MovingRight, Predicate.MovingUp)
        
        let sw = [sprites.swamp.mushroomFrontLeft0, sprites.swamp.mushroomFrontLeft2, sprites.swamp.mushroomFrontLeft2, sprites.swamp.mushroomFrontLeft3]
        this.add_animation(sw, Predicate.MovingLeft, Predicate.MovingDown)
        
        let se = [sprites.swamp.mushroomFrontRight0, sprites.swamp.mushroomFrontRight1, sprites.swamp.mushroomFrontRight2, sprites.swamp.mushroomFrontRight3]
        this.add_animation(se, Predicate.MovingRight, Predicate.MovingDown)
    }
}

// Skeleton steals mana
class Skeleton extends Enemy {
    get spriteImage(): Image { return sprites.castle.skellyFront }
    get name(): string { return "Skellington" }
    get killedMessage(): string { return `Rattled by ${this.name}` }

    constructor(tile: tiles.Location) {
        super(tile)

        this._sprite.vy = 40

        let down = [sprites.castle.skellyWalkFront1, sprites.castle.skellyWalkFront2]
        this.add_animation(down, Predicate.MovingUp)
        this.add_animation(down, Predicate.MovingDown)
    }

    melee(damage: number): int8 {
        if (player.mana > 0) {
            player.mana -= 1
            this.life -= damage
            return 0
        } 
        
        return super.melee(damage)
    }
}

class Mimic extends Enemy {
    get spriteImage(): Image { return sprites.dungeon.chestClosed }
    get name(): string { return "Mimic" }
    get killedMessage(): string { return `Swallowed by ${this.name}` }

    melee(damage: number): int8 {
        let tile = tiles.getTileLocation(this.sprite.x / 16, this.sprite.y / 16)
        tiles.setTileAt(tile, assets.tile`dead mimic`)
        return super.melee(damage)
    }
}
