
class DataStore {
    get classes(): string[] { return settings.readJSON("classes") || [Witch.title] }
    get richest(): { [id: string]: int8 } { return settings.readJSON("richest") || {}}

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
        if (amount > richest[klass]) {
           richest[klass] = amount
           settings.writeJSON("richest", richest)
        }
    }

    clear() {
        settings.clear()
    }
}

const dataStore = new DataStore()
