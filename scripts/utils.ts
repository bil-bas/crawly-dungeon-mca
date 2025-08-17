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
        return value >> (tileMap ? tileMap.scale : TileScale.Sixteen)// default to 16 pixel wide tiles.
    }

    export function locationOfSprite(s: Sprite): tiles.Location {
        return tiles.getTileLocation(screenCoordinateToTile(s.x), screenCoordinateToTile(s.y))
    }
}

namespace images {
    export function replaceColour(image: Image, oldColor: number, newColour: number): Image {
        image = image.clone()
        image.replace(oldColor, newColour)
        return image
    }

    export function replaceColourAll(frames: Image[], oldColor: number, newColour: number): Image[] {
        return frames.map((icon: Image) => replaceColour(icon, oldColor, newColour))
    }

    export function flipX(image: Image) {
        image = image.clone()
        image.flipX()
        return image
    }

    export function flipXAll(frames: Image[]) {
        return frames.map((image: Image) => flipX(image))
    }

    export function visibleToColour(image: Image, colour: number) {
        image = image.clone()
        for (let i = 1; i < 16; i++) {
            image.replace(i, colour)
        }
        return image
    }
}