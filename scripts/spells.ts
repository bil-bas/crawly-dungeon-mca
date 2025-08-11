namespace SpriteKind {
    export const Explosion = SpriteKind.create()
    export const ProjectileSpell = SpriteKind.create()
}

sprites.onDestroyed(SpriteKind.ProjectileSpell, (projectile: Sprite) => {
    projectile.data["obj"].onProjectileDestroyed(projectile)
})

// Spell effects

// Fireball hits ENEMY
sprites.onOverlap(SpriteKind.ProjectileSpell, SpriteKind.Enemy, (projectile: Sprite, enemy: Sprite) => {
    projectile.data["obj"].onProjectileHitEnemy(projectile, enemy.data["obj"])
})

// Destoy flamable items
scene.onHitWall(SpriteKind.ProjectileSpell, (projectile: Sprite, location: tiles.Location) => {
    projectile.data["obj"].onProjectileHitWall(projectile, location)
})

// Abstract base spell logic
class Spell {
    get icon(): Image { return null }
    get title(): string { return null }
    get mana(): int8 { return 1 }
    get value() { return this.mana * 50 }
    get hitDamage(): int8 { return 1 }

    canCast(): boolean {
        return player.mana >= this.mana
    }

    cast() {
        sounds.play(sounds.spellCast)
        player.mana -= this.mana
    }
}

class ProjectileSpell extends Spell {
    get hitDamage(): int8 { return 1 }

    onProjectileHitEnemy(projectile: Sprite, enemy: Enemy) {
        projectile.destroy()
        enemy.life -= this.hitDamage
    }

    onProjectileHitWall(projectile: Sprite, tile: tiles.Location) { }
}

// A firebolt hits a single target for small damage.
class Firebolt extends ProjectileSpell {
    get icon() { return sprites.projectile.explosion1 }
    get title() { return "Firebolt" }
    get mana(): int8 { return 1 }

    get splashRadius(): int8 {return 0 }
    get explosionScale(): int8 { return 1 }

    cast() {
        super.cast()

        if (characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.MovingRight)) ||
            characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingRight))) {
            
            this._firebolt("right")
        } else if (characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.MovingLeft)) ||
            characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingLeft))) {
            
            this._firebolt("left")
        } else if (characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.MovingUp)) ||
            characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingUp))) {
            
            this._firebolt("up")
        } else if (characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.MovingDown)) ||
            characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingDown))) {
            
            this._firebolt("down")
        }
    }

    _firebolt(direction: string) {
        let vx = 0, vy = 0

        if (direction == "left") {
            vx = -100
        } else if (direction == "right") {
            vx = 100
        } else if (direction == "up") {
            vy = -100
        } else { // Down
            vy = 100
        }

        let ball = sprites.createProjectileFromSprite(sprites.projectile.explosion1, player.sprite, vx, vy)
        ball.z = ZOrder.SPELLS
        ball.setKind(SpriteKind.ProjectileSpell)
        ball.setScale(2)
        ball.startEffect(effects.fire)
        ball.data["obj"] = this
    }

    onProjectileDestroyed(projectile: Sprite) {
        this._explosion(projectile.x, projectile.y)
    }

    onProjectileHitWall(projectile: Sprite, tile: tiles.Location) {
        projectile.destroy()

        if (tiles.tileAtLocationEquals(tile, sprites.dungeon.stairLadder)) {
            dungeon.clearTile(tile)
            sounds.play(sounds.destroyCrate)
            tiles.setWallAt(tile, false)
        }
    }

    _explosion(x: number, y: number) {
        let explosion = sprites.create(sprites.projectile.explosion2, SpriteKind.Explosion)
        explosion.z = ZOrder.SPELLS
        explosion.setPosition(x, y)
        explosion.setScale(this.explosionScale)

        timer.after(50, () => {
            explosion.setImage(sprites.projectile.explosion3)

            timer.after(50, () => {
                explosion.setImage(sprites.projectile.explosion4)

                timer.after(50, () => {
                    explosion.destroy()
                })
            })
        })
    }
}

// Starfire sends 3 firebolts to each of the cardinal directions
class Starfire extends Firebolt {
    get icon() { return sprites.projectile.flash1 }
    get title() { return "Starfire" }
    get mana() { return 3 }

    cast() {
        super.cast()

        this._starfire()

        timer.after(200, () => {
            this._starfire()

            timer.after(200, () => {
                this._starfire()
            })
        })
    }

    _starfire() {
        for (let direction of ["left", "right", "up", "down"]) {
            this._firebolt(direction)
        }
    }
}

// Fireball explodes and does damage over a large area.
class Fireball extends Firebolt {
    get icon() { return sprites.projectile.explosion3 }
    get title() { return "Fireball" }
    get mana(): int8 { return 3 }

    get hitDamage(): int8 { return 0 }
    get splashRadius(): int8 { return 16 * 2 }
    get splashDamage(): int8 { return 2 }
    get explosionScale(): int8 { return 3 }

    onProjectileDestroyed(projectile: Sprite) {
        super.onProjectileDestroyed(projectile)

        sprites.allOfKind(SpriteKind.Enemy).forEach((enemy: Sprite) => {
            let distance_to_center = spriteutils.distanceBetween(projectile, enemy)
            if (distance_to_center - enemy.width * 0.5 < this.splashRadius) {
                enemy.data["obj"].life -= this.splashDamage
            }
        })
    }
}

class Shock extends ProjectileSpell {
    get icon() { return sprites.projectile.firework1 }
    get title() { return "Shock" }
    get mana(): int8 { return 2 }
}

class IceJavelin extends ProjectileSpell {
    get icon() { return sprites.projectile.firework4 }
    get title() { return "Ice Javelin" }
    get mana(): int8 { return 1 }
}

class FrostStorm extends ProjectileSpell {
    get icon() { return sprites.projectile.explosion4 }
    get title() { return "Frost Storm" }
    get mana(): int8 { return 3 }
}

class RockBlast extends ProjectileSpell {
    get icon() { return sprites.castle.rock1 }
    get title() { return "Rock Blast" }
    get mana(): int8 { return 2 }
}

class Heal extends Spell {
    get icon() { return sprites.projectile.heart3 }
    get title() { return "Heal" }
    get mana(): int8 { return 1 }

    cast() {
        super.cast()
        player.life += 1
    }
}

class BloodMagic extends Spell {
    get icon() { return sprites.skillmap.decoration8 }
    get title() { return "Blood Magic" }
    get mana(): int8 { return 0 }
    get value() { return 50 }

    canCast(): boolean {
        return player.life >= 2 && player.mana < player.maxMana
    }

    cast() {
        player.life -= 1
        player.mana += 1
    }
}

class Restore extends Spell {
    get icon() { return sprites.projectile.heart2 }
    get title() { return "Restore" }
    get mana(): int8 { return 2 }

    cast() {
        super.cast()
        player.life = INITIAL_LIFE
    }
}

class Earthquake extends Spell {
    get icon() { return sprites.projectile.drop5 }
    get title() { return "Earthquake" }
    get mana(): int8 { return 4 }
}

class BallLightning extends ProjectileSpell {
    get icon() { return sprites.projectile.laser2 }
    get title() { return "Ball Lighting" }
    get mana(): int8 { return 2 }
}

class Thunderbolt extends ProjectileSpell {
    get icon() { return sprites.projectile.laser4 }
    get title() { return "Thunderbolt" }
    get mana(): int8 { return 3 }
}

const SPELL_BOOK: Spell[] = [
    // cost 1
    new Heal(),
    new Firebolt(),
    new IceJavelin(),
    new BloodMagic(),

    // cost 2 - Raise dead,
    new Shock(),
    new RockBlast(),
    new BallLightning(),
  
    // cost 3 - Goblin Horde,
    new Restore(),
    new FrostStorm(),
    new Fireball(), 
    new Starfire(),
    new Thunderbolt(),

    // cost 4
    new Earthquake(),
]


