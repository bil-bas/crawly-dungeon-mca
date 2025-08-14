namespace SpriteKind {
    export const Pet = SpriteKind.create()
}

sprites.onOverlap(SpriteKind.Pet, SpriteKind.Enemy, (petSprite: Sprite, enemySprite: Sprite) => {
    let pet = petSprite as Pet
    let enemy = enemySprite as Enemy
    pet.onHitEnemy(enemy)
})

scene.onPathCompletion(SpriteKind.Pet, (sprite: Sprite) => {
    let pet = sprite as Pet
    pet.thinkAboutThinking()
})

class Pet extends EntityWithStatus {
    protected get meleeDamage(): int8 { return 1 }
    protected get distanceRange(): [int8, int8] { throw NOT_IMPLEMENTED }
    protected get speed(): int8 { return 30 }
    protected get thinkingDelay(): int16 { return 2000 }
    protected get animationDelay(): int16 { return 200 }
    protected get sitLeft(): Image { return this.walkLeft[0] }
    protected get sitRight(): Image { return images.flipX(this.sitLeft) }
    protected get walkLeft(): Image[] { throw NOT_IMPLEMENTED }
    protected get walkRight(): Image[] { return images.flipXAll(this.walkLeft) }

    constructor(image: Image) {
        super(image, SpriteKind.Pet, ZOrder.PET, scene.locationOfSprite(player))
        this.thinkAboutThinking()
    }

    protected onDeath(): void {
        player.pet = null
        super.onDeath()
    }

    protected think(): void {
        if (!this) return

        let path = scene.aStar(scene.locationOfSprite(this), scene.locationOfSprite(player))

        if (path) {
            let [min, max] = this.distanceRange
            let preferredDistance = randint(min, max)

            if (path.length > preferredDistance) {
                path = path.slice(0, -preferredDistance)
            } else if (path.length < preferredDistance) {
                path = []
            }

            if (path.length > 0) {
                this.move(path)
            } else {
                this.thinkAboutThinking()
            }
        } else {
            this.thinkAboutThinking()
        }
    }

    protected move(path: tiles.Location[]) {
        scene.followPath(this, path, this.speed)

        let direction = (path[path.length - 1].x > path[0].x) ? this.walkRight : this.walkLeft
        animation.runImageAnimation(this, direction, this.animationDelay, true)
    }

    public thinkAboutThinking() {
        animation.stopAnimation(animation.AnimationTypes.ImageAnimation, this)

        this.setImage((randint(0, 1) == 1) ? this.sitLeft : this.sitRight)
        after(this.thinkingDelay, () => {
            this.think()
        })
    }

    public onHitEnemy(enemy: Enemy): void {
        this.life -= enemy.melee(this.meleeDamage)
    }
}

class Cat extends Pet {
    protected get distanceRange(): [int8, int8] { return [0, 2] }
    protected get thinkingDelay(): int16 { return 1000 }
    protected get speed(): int8 { return 40 }
    protected get walkLeft(): Image[] { return [sprites.builtin.cat1, sprites.builtin.cat2] }
    protected get sitLeft(): Image { return assets.image`catSit` }

    constructor() {
        super(sprites.builtin.cat0)
    }
}

class Dog extends Pet {
    protected get distanceRange(): [int8, int8] { return [1, 1] }
    public get maxLife(): int8 { return 2 }
    protected get walkLeft(): Image[] { return [sprites.builtin.dog1, sprites.builtin.dog2] }
    protected get sitLeft(): Image { return assets.image`dogSit` }

    constructor() {
        super(sprites.builtin.dog0)
    }
}

class Zombie extends Pet {
    public get maxLife(): int8 { return 3 }
    protected get animationDelay(): int16 { return 500 }
    protected get distanceRange(): [int8, int8] { return [2, 4] }
    protected get sit(): Image { return Zombie.zombify(sprites.builtin.villager3WalkFront1) }
    protected get walkLeft(): Image[] {
        return [sprites.builtin.villager3WalkLeft1, sprites.builtin.villager3WalkLeft2].map((i) => Zombie.zombify(i))
    }

    protected get meleeDamage(): int8 { return 1 }
    protected get speed(): int8 { return 10 }
    protected get thinkingDelay(): int16 { return 4000 }

    constructor() {
        super(Zombie.zombify(sprites.builtin.villager3WalkFront1))
    }

    public static zombify(image: Image) {
        image = image.clone()
        image.replace(Colour.BROWN, Colour.GREEN)
        image.replace(Colour.ORANGE, Colour.WHITE)
        return image
    }
}