
type HighScore = [string, number, string]

class DataStore {
    static readonly NUM_RICHEST = 7

    public get classes(): string[] { return settings.readJSON("classes") || [Wizard.title] }
    public get richest(): HighScore[] { return settings.readJSON("richest") || [] }
    public get randomUnlocked(): boolean { return settings.readJSON("randomUnlocked") || false }
    public get totalKills(): number {
        let kills: { [id: string]: number } = settings.readJSON("kills") || {}
        let total = Object.keys(kills).reduce((prev: number, key: string, i: number) => {
            return prev + kills[key]
        }, 0)
        return total
    }

    public addKill(title: string) {
        let kills: { [id: string]: number } = settings.readJSON("kills") || {}

        kills[title] = (kills[title] || 0) + 1

        settings.writeJSON("kills", kills)

        if (this.totalKills == 10) {
            achievements.create("Killed 10 enemies", undefined, "Red Handed", assets.image`life`)
        } else if (this.totalKills == 100) {
            achievements.create("Killed 100 enemies", undefined, "Butcher", assets.image`life`)
        } else if (this.totalKills == 100) {
            achievements.create("Killed 1000 enemies", undefined, "Berserker", assets.image`life`)
        }

        if (kills["Crab"] == 1) {
            achievements.create("Cooked a big crab", undefined, "Crabman", sprites.builtin.hermitCrabWalk0)
        }
    }

    public unlockClass(title: string): void {
        let classes = this.classes

        if (classes.indexOf(title) == -1) {
            classes.push(title)
            settings.writeJSON("classes", classes)

            if (classes.length == 4) {
                this.unlockRandom()
                achievements.create("Got all classes", undefined, "Random class", assets.image`random`)
            }
        }
    }

    public unlockRandom(): void {
        if (this.randomUnlocked) return

        settings.writeJSON("randomUnlocked", "true")
    }

    public setRichest(klass: string, amount: number, killedBy: string): void {
        let richest = this.richest
        richest.push([klass, amount, killedBy])
        richest = richest.sort((a, b) => {
            let [aClass, aCoins, aKilledBy] = a
            let [bClass, bCoins, bKilledBy] = b

            return bCoins - aCoins
        }).slice(0, DataStore.NUM_RICHEST)

        settings.writeJSON("richest", richest)
    }
}
