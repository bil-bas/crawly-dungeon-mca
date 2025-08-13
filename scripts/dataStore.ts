
type HighScore = [string, number]

class DataStore {
    public get classes(): string[] { return settings.readJSON("classes") || [Witch.title] }
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

    public setRichest(klass: string, amount: number): void {
        let richest = this.richest
        richest.push([klass, amount])
        richest = richest.sort((a, b) => {
            let [ak, aa] = a
            let [bk, ba] = b
            return ba - aa
        }).slice(0, 8)

        settings.writeJSON("richest", richest)
    }
}
