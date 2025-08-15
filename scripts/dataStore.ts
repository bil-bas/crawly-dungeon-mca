
type HighScore = [string, number, string]

class DataStore {
    static readonly NUM_RICHEST = 7
    public get classes(): string[] { return settings.readJSON("classes") || [Wizard.title] }
    public get richest(): HighScore[] { return settings.readJSON("richest") || [] }
    public get randomUnlocked(): boolean { return settings.readJSON("randomUnlocked") || false }

    public unlockClass(title: string): void {
        let classes = this.classes
        if (classes.indexOf(title) == -1) {
            classes.push(title)
            settings.writeJSON("classes", classes)
        }
    }

    public unlockRandom(): void {
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
