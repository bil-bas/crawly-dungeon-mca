class Entity extends Sprite {
    protected _life: int8
    public get maxLife(): int8 { return 1 }

    constructor(image: Image, kind: number, z: number, tile: tiles.Location) {
        super(image)
        this.setKind(kind)
        this._life = this.maxLife
        this.z = z
        tiles.placeOnTile(this, tile)
        game.currentScene().physicsEngine.addSprite(this)
    }

    public summon(): void {
        sounds.play(sounds.teleport)
        this.setFlag(SpriteFlag.Invisible, true)
        this.startEffect(effects.bubbles, 1000)
        after(500, () => this.setFlag(SpriteFlag.Invisible, false))
    }

    public unsummon(): void {
        sounds.play(sounds.teleport)
        this.startEffect(effects.bubbles, 1000)
        after(500, () => this.destroy())
    }

    protected addAnimation(images: Image[], predicate1: Predicate, predicate2?: Predicate) {
        let rule: characterAnimations.Rule

        if (predicate2) {
            rule = characterAnimations.rule(predicate1, predicate2)
        } else {
            rule = characterAnimations.rule(predicate1)
        }
        characterAnimations.loopFrames(this, images, 200, rule)
    }

    protected onDeath() {
        music.play(sounds.enemyDeath, music.PlaybackMode.InBackground)
        this.destroy(effects.ashes, 200)
    }
}

class EntityWithStatus extends Entity {
    protected lifeBar: StatusBarSprite|null

    public get life(): int8 { return this._life }
    public set life(value: number) {
        this._life = Math.max(value, 0)

        if (this._life == 0) {
            this.onDeath()
        } else if (this._life == this.maxLife) {
            // hide status bar when fully healed.
            if (this.lifeBar) {
                this.lifeBar.destroy()
                this.lifeBar = null
            }
        } else {
            // Create a new status bar if necessary.
            if (!this.lifeBar) {
                this.lifeBar = statusbars.create(this.width, 2, StatusBarKind.EnemyHealth)
                this.lifeBar.max = this.maxLife
                this.lifeBar.attachToSprite(this)
            }
            this.lifeBar.value = this._life

            this.onWounded()
        }
    }

    protected onWounded(): void { }

    protected onDeath(): void {
        super.onDeath()
        if (this.lifeBar) {
            this.lifeBar.destroy()
        }
    }
}
