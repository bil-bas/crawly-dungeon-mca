namespace SpriteKind {
    export const Pet = SpriteKind.create()
}

sprites.onOverlap(SpriteKind.Pet, SpriteKind.Enemy, (pet: Sprite, enemy: Sprite) => {
    let pet_ = pet as Pet
    pet_.onHitEnemy(enemy.data["obj"])
})


namespace scene {
    function screenCoordinateToTile(value: number) {
        const tm = game.currentScene().tileMap
        return value >> tm.scale
    }

    export function locationOfSprite(s: Sprite): tiles.Location {
        return tiles.getTileLocation(screenCoordinateToTile(s.x), screenCoordinateToTile(s.y))
    }
}

class Pet extends Sprite {
    protected get damage(): int8 { return 1 }
    protected get speed(): int8 { return 30 }
    protected get thinkingDelay(): int16 { return 2000 }

    constructor(image: Image) {
        super(image)
        this.setKind(SpriteKind.Pet)
        game.currentScene().physicsEngine.addSprite(this)

        this.z = ZOrder.PET
        this.setPosition(player.sprite.x, player.sprite.y)

        after(this.thinkingDelay, () => this.think())
    }

    protected think(): void {
        if (!this || !player.sprite) return

        let path = scene.aStar(scene.locationOfSprite(this), scene.locationOfSprite(player.sprite))

        if (path != undefined && path.length > 2) {
            scene.followPath(this, path.slice(0, -2), this.speed)
        }

        after(this.thinkingDelay, () => {
            this.think()
        })
    }

    public onHitEnemy(enemy: Enemy): void {
        if (enemy.melee(1) > 0) {
            player.pet = null
            this.destroy(effects.ashes)
            sounds.play(sounds.enemyDeath)
        }
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
    constructor() {
        super(sprites.builtin.dog0)
    }
}

class ClownFish extends Pet {
    protected get speed(): int8 { return 10 }
    protected get thinkingDelay(): int16 { return 3000 }


    constructor() {
        super(sprites.builtin.clownFish0)
    }
}