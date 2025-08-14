namespace SpriteKind {
    export const Pet = SpriteKind.create()
}

sprites.onOverlap(SpriteKind.Pet, SpriteKind.Enemy, (pet: Sprite, enemy: Sprite) => {
    let pet_ = pet as Pet
    let enemy_ = enemy as Enemy
    pet_.onHitEnemy(enemy_)
})

class Pet extends EntityWithStatus {
    public get maxLife(): int8 { return 1 }
    protected get damage(): int8 { return 1 }
    protected get speed(): int8 { return 30 }
    protected get thinkingDelay(): int16 { return 2000 }

    constructor(image: Image) {
        super(image, SpriteKind.Pet, ZOrder.PET, scene.locationOfSprite(player))
        this.setScale(0.75)
        after(this.thinkingDelay, () => this.think())
    }

    protected think(): void {
        if (!this || !player) return

        let path = scene.aStar(scene.locationOfSprite(this), scene.locationOfSprite(player))

        if (path != undefined && path.length > 2) {
            scene.followPath(this, path.slice(0, -2), this.speed)
        }

        after(this.thinkingDelay, () => {
            this.think()
        })
    }

    public onHitEnemy(enemy: Enemy): void {
        enemy.melee(this.damage)
    }
}

class Cat extends Pet {
    protected get thinkingDelay(): int16 { return 1000 }
    protected get speed(): int8 { return 40 }

    constructor() {
        super(sprites.builtin.cat0)
    }
}

class Dog extends Pet {
    public get maxLife(): int8 { return 2 }

    constructor() {
        super(sprites.builtin.dog0)
    }
}

class ClownFish extends Pet {
    protected get damage(): int8 { return 2 }
    protected get speed(): int8 { return 10 }
    protected get thinkingDelay(): int16 { return 3000 }

    constructor() {
        super(sprites.builtin.clownFish0)
    }
}