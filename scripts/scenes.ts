namespace scenes {
    export const INTRO = "intro"
    export const CHOOSE_CLASS = "choose"
    export const PLAY_GAME = "play"
    export const DEATH = "death"
}

storyboard.registerScene(scenes.INTRO, () => {
    let message = [
        "\\n",
        "     Welcome to the",
        "     Crawly Dungeon!",
        "\\n",
        "Seek your fortune, as",
        "many before you have",
        "tried and, unerringly,",
        "failed...",
    ]

    new ScreenMessage(message, "Press <A> to delve!", () => storyboard.replace(scenes.CHOOSE_CLASS))
})

storyboard.registerScene(scenes.CHOOSE_CLASS, () => {
    function playerIcon(title: string): Image {
        switch (title) {
            case Druid.title: return Druid.icon
            case Wizard.title: return Wizard.icon
            case BloodWitch.title: return BloodWitch.icon
            case Necromancer.title: return Necromancer.icon
            case Random.title: return Random.icon
            default: throw title
        }
    }

    let options = dataStore.classes.map<MenuOption>((title: string) => {
        return [playerIcon(title), title]
    })

    if (dataStore.randomUnlocked) {
        options.push([Random.icon, Random.title])
    }

    new Menu(sprites.dungeon.statueLight, "Who are you?", options, false,
        (selected: string, index: number): boolean => {
            if (index == Menu.CANCELLED) {
                return true // Disable cancel button!
            }

            if (selected == Random.title) {
                selected = dataStore.classes[randint(0, dataStore.classes.length - 1)]
            }

            playerClass = selected
            storyboard.replace(scenes.PLAY_GAME)

            return false
        }
    )
})

storyboard.registerScene(scenes.PLAY_GAME, () => {
    function createPlayer(title: string): Player {
        switch (title) {
            case Druid.title: return new Druid(title)
            case Wizard.title: return new Wizard(title)
            case BloodWitch.title: return new BloodWitch(title)
            case Necromancer.title: return new Necromancer(title)
            default: throw title
        }
    }

    Enemy.registerHandlers()
    ProjectileSpell.registerHandlers()

    player = createPlayer(playerClass)
    gui = new Gui()
    dungeon = new Dungeon()
})

storyboard.registerScene(scenes.DEATH, () => {
    let message: string[] = [
        `A ${player.title} just died,`,
        `${player.killedBy.killedMessage},`,
        `but clasping ${player.coins} gold.`,
        "\\nThe richest corpses were:",
    ]

    for (let highscore of dataStore.richest) {
        let [klass, score, killedBy] = highscore
        message.push(`${padStart(score.toString(), 4)}: ${klass} by ${killedBy}`)
    }

    new ScreenMessage(message, "\\nPress <A> to live again!", () => storyboard.replace(scenes.CHOOSE_CLASS))
})
