// Enemy interactions
scene.onHitWall(SpriteKind.Enemy, (enemy: Sprite, tile: tiles.Location) => {
    enemy.data["obj"].touchWall(tile)
})

// Base enemy obj.
class Enemy {
    protected readonly sprite: Sprite
    protected _life: int8
    protected lifeBar: StatusBarSprite

    constructor(tile: tiles.Location) {
        this.sprite = sprites.create(this.spriteImage, SpriteKind.Enemy)
        tiles.placeOnTile(this.sprite, tile)
        this.sprite.setFlag(SpriteFlag.BounceOnWall, true)
        this.sprite.z = ZOrder.ENEMIES
        this.sprite.data["obj"] = this
        this._life = this.initialLife
    }

    protected get spriteImage(): Image { return null }
    protected get initialLife(): int8 { return 1 }
    protected get killedMessage(): string { return null }

    public get life(): int8 { return this._life }
    public set life(value: number) {
        this._life = Math.max(value, 0)

        if (this._life == 0) {
            this.sprite.destroy()
            if (this.lifeBar) {
                this.lifeBar.destroy()
            }
            music.play(sounds.enemyDeath, music.PlaybackMode.InBackground)
        } else if (this._life == this.initialLife) {
            // hide status bar when fully healed.
            if (this.lifeBar) {
                this.lifeBar.destroy()
                this.lifeBar = null
            }
        } else {
            // Create a new status bar if necessary
            if (!this.lifeBar) {
                this.lifeBar = statusbars.create(this.sprite.width, 2, StatusBarKind.EnemyHealth)
                this.lifeBar.max = this.initialLife
                this.lifeBar.attachToSprite(this.sprite)
            }
            this.lifeBar.value = this._life
        }
    }

    public melee(damage: number) : int8 {
        this._life -= damage
        game.setGameOverMessage(false, this.killedMessage)
        return 1
    }

    protected add_animation(images: Image[], predicate1: Predicate, predicate2?: Predicate) {
        let rule: characterAnimations.Rule
        
        if (predicate2) {
            rule = characterAnimations.rule(predicate1, predicate2)
        } else {
            rule = characterAnimations.rule(predicate1)
        }
        characterAnimations.loopFrames(this.sprite, images, 200, rule)
    }

    public touchWall(tile: tiles.Location) { }
    
    public destroy(): void {
        this.sprite.destroy()
        if (this.lifeBar) {
            this.lifeBar.destroy()
        }
    }
}

// BAT
class Bat extends Enemy {
    protected get spriteImage(): Image { return sprites.builtin.forestBat0 }
    protected get killedMessage(): string { return `Exsanguinated by Bat` }

    constructor(tile: tiles.Location) {
        super(tile)

        this.sprite.vx = 40

        let left = [sprites.builtin.forestBat0, sprites.builtin.forestBat1, sprites.builtin.forestBat2, sprites.builtin.forestBat3]
        this.add_animation(left, Predicate.MovingLeft)
        
        this.add_animation(left, Predicate.MovingRight)
    }
}


// HERMIT CRAB
class HermitCrab extends Enemy {
    protected get spriteImage(): Image { return sprites.builtin.hermitCrabWalk0 }
    protected get killedMessage(): string { return `Squished by Hermit Crab` }
    protected get initialLife(): number { return 3 }

    constructor(tile: tiles.Location) {
        super(tile)

        this.sprite.vy = -30
        this.sprite.setScale(2)

        let walk = [sprites.builtin.hermitCrabWalk0, sprites.builtin.hermitCrabWalk1, sprites.builtin.hermitCrabWalk2, sprites.builtin.hermitCrabWalk3]
        this.add_animation(walk, Predicate.MovingUp)
        this.add_animation(walk, Predicate.MovingDown)
        this.add_animation(walk, Predicate.MovingLeft)
        this.add_animation(walk, Predicate.MovingRight)
    }

    public touchWall(tile: tiles.Location): void {
        let crab = this.sprite
        if (characterAnimations.matchesRule(crab, characterAnimations.rule(Predicate.MovingUp))) {
            crab.setVelocity(-30, 0)
            //console.log("up to left")
        } else if (characterAnimations.matchesRule(crab, characterAnimations.rule(Predicate.MovingDown))) {
            crab.setVelocity(30, 0)
            //console.log("down to right")
        } else if (characterAnimations.matchesRule(crab, characterAnimations.rule(Predicate.MovingLeft))) {
            crab.setVelocity(0, 30)
            //console.log("left to down")
        } else if (characterAnimations.matchesRule(crab, characterAnimations.rule(Predicate.MovingRight))) {
            crab.setVelocity(0, -30)
            //console.log("right to up")
        }
    }
}

// Monkey steals keys
class Monkey extends Enemy {
    protected get spriteImage(): Image { return sprites.builtin.forestMonkey0 }
    protected get killedMessage(): string { return `Eyes gouged by Monkey` }

    constructor(tile: tiles.Location) {
        super(tile)
        this.sprite.vy = 50

        let up = [sprites.builtin.forestMonkey0, sprites.builtin.forestMonkey1, sprites.builtin.forestMonkey2, sprites.builtin.forestMonkey3]
        this.add_animation(up, Predicate.MovingUp)
        
        let down = [sprites.builtin.forestMonkey4, sprites.builtin.forestMonkey5, sprites.builtin.forestMonkey2, sprites.builtin.forestMonkey7]
        this.add_animation(up, Predicate.MovingDown)
    }

    public melee(damage: number): int8 {
        if (player.keys > 0) {
            player.keys -= 1
            this._life -= damage
            return 0
        }
        return super.melee(damage)
    }
}

class Shroom extends Enemy {
    protected get tileImage(): Image { return assets.tile`mimic` }
    protected get spriteImage(): Image { return sprites.builtin.forestMonkey0 }
    protected get killedMessage(): string { return `Zoomed by a Shroom` }

    constructor(tile: tiles.Location) {
        super(tile)

        this.sprite.vx = 20
        this.sprite.vy = 20

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
    protected get spriteImage(): Image { return sprites.castle.skellyFront }
    protected get killedMessage(): string { return `Rattled by Skellington` }

    constructor(tile: tiles.Location) {
        super(tile)

        this.sprite.vy = 40

        let down = [sprites.castle.skellyWalkFront1, sprites.castle.skellyWalkFront2]
        this.add_animation(down, Predicate.MovingUp)
        this.add_animation(down, Predicate.MovingDown)
    }

    public melee(damage: number): int8 {
        if (player.mana > 0) {
            player.mana -= 1
            this._life -= damage
            return 0
        } 
        
        return super.melee(damage)
    }
}

class Mimic extends Enemy {
    protected get spriteImage(): Image { return sprites.dungeon.chestClosed }
    protected get killedMessage(): string { return `Swallowed by Mimic` }

    public melee(damage: number): int8 {
        let tile = tiles.getTileLocation(this.sprite.x / 16, this.sprite.y / 16)
        tiles.setTileAt(tile, assets.tile`dead mimic`)
        return super.melee(damage)
    }
}
