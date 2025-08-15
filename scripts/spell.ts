namespace SpriteKind {
    export const Explosion = SpriteKind.create()
    export const ProjectileSpell = SpriteKind.create()
}

namespace Direction {
    export const LEFT: int8 = 1
    export const RIGHT: int8 = 2
    export const UP: int8 = 3
    export const DOWN: int8 = 4
}

// Abstract base spell logic
class Spell {
    public get icon(): Image { throw NOT_IMPLEMENTED }
    public get title(): string { throw NOT_IMPLEMENTED }
    public get mana(): int8 { return 1 }
    public get value(): int16 { return this.mana * 5 }

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

    public cast(): void {
        super.cast()

        if (characterAnimations.matchesRule(player, characterAnimations.rule(Predicate.MovingRight)) ||
            characterAnimations.matchesRule(player, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingRight))) {

            this.castInDirection(Direction.RIGHT)
        } else if (characterAnimations.matchesRule(player, characterAnimations.rule(Predicate.MovingLeft)) ||
            characterAnimations.matchesRule(player, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingLeft))) {

            this.castInDirection(Direction.LEFT)
        } else if (characterAnimations.matchesRule(player, characterAnimations.rule(Predicate.MovingUp)) ||
            characterAnimations.matchesRule(player, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingUp))) {

            this.castInDirection(Direction.UP)
        } else if (characterAnimations.matchesRule(player, characterAnimations.rule(Predicate.MovingDown)) ||
            characterAnimations.matchesRule(player, characterAnimations.rule(Predicate.NotMoving, Predicate.FacingDown))) {

            this.castInDirection(Direction.DOWN)
        }
    }

    public static registerHandlers(): void {
        sprites.onDestroyed(SpriteKind.ProjectileSpell, (projectile: Sprite) => {
            projectile.data["obj"].onProjectileDestroyed(projectile)
        })

        // Fireball hits ENEMY
        sprites.onOverlap(SpriteKind.ProjectileSpell, SpriteKind.Enemy, (projectile: Sprite, enemy: Sprite) => {
            let enemy_ = enemy as Enemy
            projectile.data["obj"].onProjectileHitEnemy(projectile, enemy_)
        })

        // Destoy flamable items
        scene.onHitWall(SpriteKind.ProjectileSpell, (projectile: Sprite, location: tiles.Location) => {
            projectile.data["obj"].onProjectileHitWall(projectile, location)
        })
    }

    protected castInDirection(direction: number) { }
}

// A firebolt hits a single target for small damage.
class Firebolt extends ProjectileSpell {
    public get icon(): Image { return assets.image`firebolt` }
    public get title(): string { return "Firebolt" }
    public get mana(): int8 { return 1 }

    protected get splashRadius(): int8 {return 0 }

    protected castInDirection(direction: number): void {
        let vx = 0, vy = 0

        switch (direction) {
            case Direction.LEFT:
                vx = -100
                break
            case Direction.RIGHT:
                vx = 100
                break
            case Direction.UP:
                vy = -100
                break
            default:
                vy = 100
        }

        let ball = sprites.createProjectileFromSprite(sprites.projectile.explosion1, player, vx, vy)
        ball.z = ZOrder.SPELLS
        ball.setFlag(SpriteFlag.AutoDestroy, false) // Allow it to go off-camera.
        ball.setKind(SpriteKind.ProjectileSpell)
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

    protected explosion(x: number, y: number): Sprite {
        let explosion = sprites.create(sprites.projectile.explosion2, SpriteKind.Explosion)
        explosion.z = ZOrder.SPELLS
        explosion.setPosition(x, y)

        after(50, () => {
            explosion.setImage(sprites.projectile.explosion3)

            after(50, () => {
                explosion.setImage(sprites.projectile.explosion4)

                after(50, () => {
                    explosion.destroy()
                })
            })
        })
        return explosion
    }
}

// Starfire sends 3 firebolts to each of the cardinal directions
class Starfire extends Firebolt {
    public get icon() { return assets.image`starfire` }
    public get title() { return "Starfire" }
    public get mana() { return 3 }

    public cast(): void {
        super.cast()

        this.starfire()

        after(300, () => {
            this.starfire()

            after(300, () => {
                this.starfire()
            })
        })
    }

    protected starfire(): void {
        for (let direction of [Direction.UP, Direction.DOWN, Direction.RIGHT, Direction.LEFT]) {
            this.castInDirection(direction)
        }
    }
}

// Fireball explodes and does damage over a large area.
class Fireball extends Firebolt {
    public get icon() { return assets.image`fireball` }
    public get title() { return "Fireball" }
    public get mana(): int8 { return 3 }
    public get hitDamage(): int8 { return 0 }
    protected get splashDamage(): int8 { return 2 }

    protected explosion(x: number, y: number): Sprite {
        let explosion = super.explosion(x, y)
        explosion.setScale(4)

        sprites.allOfKind(SpriteKind.Enemy).forEach((sprite: Sprite) => {
            if (explosion.overlapsWith(sprite)) {
                let enemy = sprite as Enemy
                enemy.life -= this.splashDamage
            }
        })
        return explosion
    }
}


class Heal extends Spell {
    public get icon() { return assets.image`heal` }
    public get title() { return "Heal" }
    public get mana(): int8 { return 1 }

    public cast(): void {
        super.cast()
        player.life += 1
    }
}

class BloodMagic extends Spell {
    public get icon() { return assets.image`blood magic` }
    public get title() { return "Blood Magic" }
    public get mana(): int8 { return 0 }
    public get value(): int16 { return 5 }

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
    public get icon(): Image { return assets.image`restore` }
    public get title(): string { return "Restore" }
    public get mana(): int8 { return 2 }

    public cast(): void {
        super.cast()
        player.life = INITIAL_LIFE
    }
}

class BeastFriend extends Spell {
    public get icon(): Image { return assets.image`beast friend` }
    public get title(): string { return "Beast Friend" }
    public get mana(): int8 { return 2 }

    public cast(): void {
        super.cast()

        player.pet = this.randomPet()
        player.pet.summon()
    }

    protected randomPet(): Pet {
        Math.randomRange(0, game.runtime()) // Push the RNG to be more random.

        switch (randint(0, 1)) {
            case 0: return new Cat()
            case 1: return new Dog()
            default: throw null
        }
    }
}

class RaiseDead extends Spell {
    public get icon(): Image { return assets.image`raise dead` }
    public get title(): string { return "Raise Dead" }
    public get mana(): int8 { return 2 }

    public cast(): void {
        super.cast()

        player.pet = new Zombie()
        player.pet.summon()
    }
}

const SPELL_BOOK: Spell[] = [
    // cost 1
    new Heal(),
    new Firebolt(),
    new BloodMagic(),

    // cost 2 - Raise dead,
    new BeastFriend(),
    new RaiseDead(),

    // cost 3 - Goblin Horde,
    new Restore(),
    new Fireball(),
    new Starfire(),

    // cost 4
]

function findSpell(title: string): Spell {
    return SPELL_BOOK.find((value: Spell, i: number) => value.title == title)
}
