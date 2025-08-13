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
    public get icon(): Image { throw null }
    public get title(): string { throw null }
    public get mana(): int8 { return 1 }
    public get value(): int16 { return this.mana * 50 }
    public get hitDamage(): int8 { return 1 }

    public canCast(): boolean {
        return player.mana >= this.mana
    }

    public cast(): void {
        sounds.play(sounds.spellCast)
        player.mana -= this.mana
    }
}

class ProjectileSpell extends Spell {
    get hitDamage(): int8 { return 1 }

    public onProjectileHitEnemy(projectile: Sprite, enemy: Enemy): void {
        projectile.destroy()
        enemy.life -= this.hitDamage
    }

    public onProjectileHitWall(projectile: Sprite, tile: tiles.Location): void { }
}

// A firebolt hits a single target for small damage.
class Firebolt extends ProjectileSpell {
    public get icon(): Image { return sprites.projectile.explosion1 }
    public get title(): string { return "Firebolt" }
    public get mana(): int8 { return 1 }

    protected get splashRadius(): int8 {return 0 }
    protected get explosionScale(): int8 { return 1 }

    public cast(): void {
        super.cast()

        if (characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.MovingRight)) ||
            characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingRight))) {
            
            this.firebolt("right")
        } else if (characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.MovingLeft)) ||
            characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingLeft))) {
            
            this.firebolt("left")
        } else if (characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.MovingUp)) ||
            characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingUp))) {
            
            this.firebolt("up")
        } else if (characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.MovingDown)) ||
            characterAnimations.matchesRule(player.sprite, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingDown))) {
            
            this.firebolt("down")
        }
    }

    protected firebolt(direction: string): void {
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

    public onProjectileDestroyed(projectile: Sprite): void {
        this.explosion(projectile.x, projectile.y)
    }

    public onProjectileHitWall(projectile: Sprite, tile: tiles.Location): void {
        projectile.destroy()

        if (tiles.tileAtLocationEquals(tile, sprites.dungeon.stairLadder)) {
            dungeon.clearTile(tile)
            sounds.play(sounds.destroyCrate)
            tiles.setWallAt(tile, false)
        }
    }

    protected explosion(x: number, y: number): void {
        let explosion = sprites.create(sprites.projectile.explosion2, SpriteKind.Explosion)
        explosion.z = ZOrder.SPELLS
        explosion.setPosition(x, y)
        explosion.setScale(this.explosionScale)

        after(50, () => {
            explosion.setImage(sprites.projectile.explosion3)

            after(50, () => {
                explosion.setImage(sprites.projectile.explosion4)

                after(50, () => {
                    explosion.destroy()
                })
            })
        })
    }
}

// Starfire sends 3 firebolts to each of the cardinal directions
class Starfire extends Firebolt {
    public get icon() { return sprites.projectile.flash1 }
    public get title() { return "Starfire" }
    public get mana() { return 3 }

    public cast(): void {
        super.cast()

        this.starfire()

        after(200, () => {
            this.starfire()

            after(200, () => {
                this.starfire()
            })
        })
    }

    protected starfire(): void {
        for (let direction of ["left", "right", "up", "down"]) {
            this.firebolt(direction)
        }
    }
}

// Fireball explodes and does damage over a large area.
class Fireball extends Firebolt {
    public get icon() { return sprites.projectile.explosion3 }
    public get title() { return "Fireball" }
    public get mana(): int8 { return 3 }

    public get hitDamage(): int8 { return 0 }
    protected get splashRadius(): int8 { return 16 * 2 }
    protected get splashDamage(): int8 { return 2 }
    protected get explosionScale(): int8 { return 3 }

    public onProjectileDestroyed(projectile: Sprite): void {
        super.onProjectileDestroyed(projectile)

        sprites.allOfKind(SpriteKind.Enemy).forEach((enemy: Sprite) => {
            let distance_to_center = spriteutils.distanceBetween(projectile, enemy)
            if (distance_to_center - enemy.width * 0.5 < this.splashRadius) {
                enemy.data["obj"].life -= this.splashDamage
            }
        })
    }
}


class Heal extends Spell {
    public get icon() { return sprites.projectile.heart3 }
    public get title() { return "Heal" }
    public get mana(): int8 { return 1 }

    public cast(): void {
        super.cast()
        player.life += 1
    }
}

class BloodMagic extends Spell {
    public get icon() { return sprites.skillmap.decoration8 }
    public get title() { return "Blood Magic" }
    public get mana(): int8 { return 0 }
    public get value(): int16 { return 50 }

    public canCast(): boolean {
        return player.life >= 2 && player.mana < player.maxMana
    }

    public cast(): void {
        super.cast()
        player.life -= 1
        player.mana += 1
    }
}

class Restore extends Spell {
    public get icon(): Image { return sprites.projectile.heart2 }
    public get title(): string { return "Restore" }
    public get mana(): int8 { return 2 }

    public cast(): void {
        super.cast()
        player.life = INITIAL_LIFE
    }
}

const SPELL_BOOK: Spell[] = [
    // cost 1
    new Heal(),
    new Firebolt(),
    new BloodMagic(),

    // cost 2 - Raise dead,
  
    // cost 3 - Goblin Horde,
    new Restore(),
    new Fireball(), 
    new Starfire(),

    // cost 4
]

function findSpell(title: string): Spell {
    return SPELL_BOOK.find((value: Spell, i: number) => value.title == title)
    throw title
}


