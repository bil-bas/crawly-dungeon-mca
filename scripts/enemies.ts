// Enemy interactions
scene.onHitWall(SpriteKind.Enemy, (enemy: Sprite, location: tiles.Location) => {
    if (sprites.readDataString(enemy, "type") != "hermit crab") return

    if (characterAnimations.matchesRule(enemy, characterAnimations.rule(Predicate.MovingUp))) {
        enemy.setVelocity(-30, 0)
    } else if (characterAnimations.matchesRule(enemy, characterAnimations.rule(Predicate.MovingDown))) {
        enemy.setVelocity(30, 0)
    } else if (characterAnimations.matchesRule(enemy, characterAnimations.rule(Predicate.MovingLeft))) {
        enemy.setVelocity(0, 30)
    } else if (characterAnimations.matchesRule(enemy, characterAnimations.rule(Predicate.MovingRight))) {
        enemy.setVelocity(0, -30)
    }
})

// Base enemy obj.
class Enemy {
    _sprite: Sprite
    _life: number
    _lifeBar: StatusBarSprite

    constructor(tile: tiles.Location) {
        dungeon.clearTile(tile)
        this._sprite = sprites.create(this.image, SpriteKind.Enemy)
        tiles.placeOnTile(this._sprite, tile)
        this._sprite.setFlag(SpriteFlag.BounceOnWall, true)
        this._sprite.z = ZLevel.ENEMIES
        this._sprite.data["obj"] = this
        this._life = this.initial_life
    }

    get name(): string { return "Enemy"}
    get sprite(): Sprite { return this._sprite }
    get image(): Image { return null }
    get initial_life(): number { return 1 }
    get killedMessage(): string { return `Murdered by ${this.name}` }

    get life(): number { return this._life }
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
                //this._lifeBar.setColor(2, 11)
                this._lifeBar.attachToSprite(this._sprite)
            }

            this._lifeBar.value = this._life
        }
    }

    melee(damage: number) : number {
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
}

// BAT
class Bat extends Enemy {
    get image(): Image { return sprites.builtin.forestBat0 }
    get name(): string { return "Bat" }
    get killedMessage(): string { return "Exsanguinated by bat" }

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
    get image(): Image { return sprites.builtin.hermitCrabWalk0 }
    get name(): string { return "Hermit Crab" }
    get killedMessage(): string { return "Squished by Hermit Crab" }
    get initial_life(): number { return 3 }

    constructor(tile: tiles.Location) {
        super(tile)

        this._sprite.vy = 30
        this._sprite.setScale(2)

        let walk = [sprites.builtin.hermitCrabWalk0, sprites.builtin.hermitCrabWalk1, sprites.builtin.hermitCrabWalk2, sprites.builtin.hermitCrabWalk3]
        this.add_animation(walk, Predicate.MovingUp)
        this.add_animation(walk, Predicate.MovingDown)
        this.add_animation(walk, Predicate.MovingLeft)
        this.add_animation(walk, Predicate.MovingRight)
    }
}

// Monkey steals keys
class Monkey extends Enemy {
    get image(): Image { return sprites.builtin.forestMonkey0 }
    get name(): string { return "Monkey" }
    get killedMessage(): string { return "Eyes gouged by monkey" }

    constructor(tile: tiles.Location) {
        super(tile)
        this._sprite.vy = 50

        let up = [sprites.builtin.forestMonkey0, sprites.builtin.forestMonkey1, sprites.builtin.forestMonkey2, sprites.builtin.forestMonkey3]
        this.add_animation(up, Predicate.MovingUp)
        
        let down = [sprites.builtin.forestMonkey4, sprites.builtin.forestMonkey5, sprites.builtin.forestMonkey2, sprites.builtin.forestMonkey7]
        this.add_animation(up, Predicate.MovingDown)
    }

    melee(damage: number): number {
        if (player.keys > 0) {
            player.keys -= 1
            return 0
        } else {
            return super.melee(damage)
        }
    }
}

class Shroom extends Enemy {
    get image(): Image { return sprites.builtin.forestMonkey0 }
    get name(): string { return "Shroom" }
    get killedMessage(): string { return "Shroomed by a Shroom" }

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
    get image(): Image { return sprites.castle.skellyFront }
    get name(): string { return "Skellington" }
    get killedMessage(): string { return "Rattled by Skellington" }
    constructor(tile: tiles.Location) {
        super(tile)

        this._sprite.vy = 40

        let down = [sprites.castle.skellyWalkFront1, sprites.castle.skellyWalkFront2]
        this.add_animation(down, Predicate.MovingUp)
        this.add_animation(down, Predicate.MovingDown)
    }

    melee(damage: number): number {
        if (player.mana > 0) {
            player.mana -= 1
            return 0
        } else {
            return super.melee(damage)
        }
    }
}
