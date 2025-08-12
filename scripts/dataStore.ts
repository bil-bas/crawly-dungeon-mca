
type HighScore = [string, number]

class DataStore {

    get classes(): string[] { return settings.readJSON("classes") || [Witch.title] }
    get richest(): HighScore[] { return settings.readJSON("richest") || [] }

    unlockClass(title: string) {
        let classes = this.classes
        if (classes.indexOf(title) == -1) {
            classes.push(title)
            classes = classes.sort()
            settings.writeJSON("classes", classes)
        }
    }

    setRichest(klass: string, amount: number) {
        let richest = this.richest
        richest.push([klass, amount])
        richest = richest.sort((a, b) => {
            let [ak, aa] = a
            let [bk, ba] = b
            return ba - aa
        }).slice(0, 8)
        settings.writeJSON("richest", richest)
        console.inspect(richest)
    }
}

const dataStore = new DataStore()
