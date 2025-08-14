function repeat(str: string, count: number): string {
    let array = []
    for (let i = 0; i < count; )
        array[i++] = str
    return array.join('')
}

function padStart(text: string, length: number): string {
    text = repeat(" ", length - text.length) + text
    return text
}

function after(time: number, thenDo: () => void) {
    setTimeout(thenDo, time)
}

namespace scene {
    function screenCoordinateToTile(value: number) {
        const tileMap = game.currentScene().tileMap
        return value >> (tileMap ? tileMap.scale : 4)// default to 16 pixel wide tiles.
    }

    export function locationOfSprite(s: Sprite): tiles.Location {
        return tiles.getTileLocation(screenCoordinateToTile(s.x), screenCoordinateToTile(s.y))
    }
}
