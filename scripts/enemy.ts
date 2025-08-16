// Base enemy obj.
class Enemy extends EntityWithStatus {
    public get title(): string { throw NOT_IMPLEMENTED }
    public get killedMessage(): string { throw NOT_IMPLEMENTED }

    protected get meleeCooldown(): int16 { return 500 }
    protected meleeCooldownAt: number = 0

    constructor(tile: tiles.Location) {
        super(SpriteKind.Enemy, ZOrder.ENEMIES, tile)
        if (this.killedMessage.length > 24) throw this.killedMessage

        this.setFlag(SpriteFlag.BounceOnWall, true)
    }

    public melee(damage: number): int8 {
        if (game.runtime() < this.meleeCooldownAt) return 0

        this.life -= damage
        this.meleeCooldownAt = game.runtime() + this.meleeCooldown
        sounds.play(sounds.melee)
        player.killedBy = this
        return 1
    }

    public static registerHandlers(): void {
        // Enemy interactions
        scene.onHitWall(SpriteKind.Enemy, (sprite: Sprite, tile: tiles.Location) => {
            let enemy = sprite as Enemy
            enemy.touchWall(tile)
        })
    }

    protected onDeath() {
        super.onDeath()
        dataStore.addKill(this.title)
    }

    public touchWall(tile: tiles.Location): void { }
}

// BAT
class Bat extends Enemy {
    public get image(): Image { return sprites.builtin.forestBat0 }
    public get title(): string { return "Bat" }
    public get killedMessage(): string { return `exsanguinated by a ${this.title}` }

    constructor(tile: tiles.Location) {
        super(tile)
        this.vx = 40

        let left = [sprites.builtin.forestBat0, sprites.builtin.forestBat1, sprites.builtin.forestBat2, sprites.builtin.forestBat3]
        this.addAnimation(left, Predicate.MovingLeft)
        this.addAnimation(left, Predicate.MovingRight)
    }
}


// HERMIT CRAB
class HermitCrab extends Enemy {
    public get image(): Image { return sprites.builtin.hermitCrabWalk0 }
    public get title(): string { return "Crab" }
    public get killedMessage(): string { return `crushed by a ${this.title}` }
    public get maxLife(): number { return 3 }

    constructor(tile: tiles.Location) {
        super(tile)

        this.vy = -30
        this.setScale(2)

        let walk = [sprites.builtin.hermitCrabWalk0, sprites.builtin.hermitCrabWalk1, sprites.builtin.hermitCrabWalk2, sprites.builtin.hermitCrabWalk3]
        this.addAnimation(walk, Predicate.MovingUp)
        this.addAnimation(walk, Predicate.MovingDown)
        this.addAnimation(walk, Predicate.MovingLeft)
        this.addAnimation(walk, Predicate.MovingRight)
    }

    public touchWall(tile: tiles.Location): void {
        if (characterAnimations.matchesRule(this, characterAnimations.rule(Predicate.MovingUp))) {
            this.setVelocity(-30, 0)
            //console.log("up to left")
        } else if (characterAnimations.matchesRule(this, characterAnimations.rule(Predicate.MovingDown))) {
            this.setVelocity(30, 0)
            //console.log("down to right")
        } else if (characterAnimations.matchesRule(this, characterAnimations.rule(Predicate.MovingLeft))) {
            this.setVelocity(0, 30)
            //console.log("left to down")
        } else if (characterAnimations.matchesRule(this, characterAnimations.rule(Predicate.MovingRight))) {
            this.setVelocity(0, -30)
            //console.log("right to up")
        }
    }
}

// Monkey steals keys
class Monkey extends Enemy {
    public get image(): Image { return sprites.builtin.forestMonkey0 }
    public get title(): string { return "Monkey" }
    public get killedMessage(): string { return `eyes gouged by a ${this.title}` }

    constructor(tile: tiles.Location) {
        super(tile)
        this.vy = 50

        let up = [sprites.builtin.forestMonkey0, sprites.builtin.forestMonkey1, sprites.builtin.forestMonkey2, sprites.builtin.forestMonkey3]
        this.addAnimation(up, Predicate.MovingUp)

        let down = [sprites.builtin.forestMonkey4, sprites.builtin.forestMonkey5, sprites.builtin.forestMonkey2, sprites.builtin.forestMonkey7]
        this.addAnimation(up, Predicate.MovingDown)
    }

    public melee(damage: number): int8 {
        let effect = super.melee(damage)
        if (effect && player.keys > 0) {
            player.keys -= 1
            this._life -= damage
            return 0
        }
        return effect
    }
}

class Shroom extends Enemy {
    public get image(): Image { return sprites.swamp.mushroomFrontLeft0 }
    public get maxLife(): int8 { return 2 }
    public get title(): string { return "Shroom" }
    public get killedMessage(): string { return `zoomed by a ${this.title}` }

    constructor(tile: tiles.Location) {
        super(tile)

        this.vx = 20
        this.vy = 20

        let ne = [sprites.swamp.mushroomBackLeft0, sprites.swamp.mushroomBackLeft2, sprites.swamp.mushroomBackLeft2, sprites.swamp.mushroomBackLeft3]
        this.addAnimation(ne, Predicate.MovingLeft, Predicate.MovingUp)

        let nw = [sprites.swamp.mushroomBackRight0, sprites.swamp.mushroomBackRight1, sprites.swamp.mushroomBackRight2, sprites.swamp.mushroomBackRight3]
        this.addAnimation(nw, Predicate.MovingRight, Predicate.MovingUp)

        let sw = [sprites.swamp.mushroomFrontLeft0, sprites.swamp.mushroomFrontLeft2, sprites.swamp.mushroomFrontLeft2, sprites.swamp.mushroomFrontLeft3]
        this.addAnimation(sw, Predicate.MovingLeft, Predicate.MovingDown)

        let se = [sprites.swamp.mushroomFrontRight0, sprites.swamp.mushroomFrontRight1, sprites.swamp.mushroomFrontRight2, sprites.swamp.mushroomFrontRight3]
        this.addAnimation(se, Predicate.MovingRight, Predicate.MovingDown)
    }
}

// Skeleton steals mana
class Skeleton extends Enemy {
    public get image(): Image { return sprites.castle.skellyFront }
    public get title(): string { return "Skelly" }
    public get killedMessage(): string { return `rattled by a ${this.title}` }

    constructor(tile: tiles.Location) {
        super(tile)

        this.vy = 40

        let down = [sprites.castle.skellyWalkFront1, sprites.castle.skellyWalkFront2]
        this.addAnimation(down, Predicate.MovingUp)
        this.addAnimation(down, Predicate.MovingDown)
    }

    public melee(damage: number): int8 {
        let effect = super.melee(damage)
        if (effect && player.mana > 0) {
            player.mana -= 1
            this._life -= damage
            return 0
        }

        return effect
    }
}

class Mimic extends Enemy {
    public get image(): Image { return sprites.dungeon.chestClosed }
    public get maxLife(): int8 { return 2 }
    public get title(): string { return "Mimic" }
    public get killedMessage(): string { return `swallowed by a ${this.title}` }

    protected onWounded() {
        animation.runImageAnimation(this, [sprites.dungeon.chestOpen, sprites.dungeon.chestClosed],
                                    200, true)
    }

    protected onDeath() {
        tiles.setTileAt(scene.locationOfSprite(this), assets.tile`dead mimic`)
        super.onDeath()
    }
}
