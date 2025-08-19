namespace SpriteKind {
    export const Item = SpriteKind.create()
}

class Dungeon {
    static readonly FULL = sprites.builtin.brick
    static readonly ENTRANCE = sprites.dungeon.stairLarge
    static readonly EXIT = sprites.dungeon.stairWest

    public static readonly ADJACENT_OFFSETS = [
        [-1, -1], [+0, -1], [+1, -1],
        [-1, +0],           [+1, +0],
        [-1, +1], [+0, +1], [+1, +1],
    ]

    public level: int8 = 0

    constructor() {
        scene.setBackgroundColor(Colour.DARK_PURPLE)
    }

    // Render the level tiles, add player and creatues.
    protected render_level(): void {
        let level: tiles.TileMapData = tileUtil.cloneMap(assets.tilemap`empty36`)

        let isValid = false
        while (!isValid) {
            let worm = new Worm(level)
            worm.createDungeon()
            if (worm.isValid) {
                isValid = true
            } else {
                level = tileUtil.cloneMap(assets.tilemap`empty36`)
            }
        }

        tiles.placeOnRandomTile(player, Dungeon.ENTRANCE)

        let readLevel = tileUtil.cloneMap(level)

        tiles.getTilesByType(sprites.builtin.brick).forEach((tile: tiles.Location) => {
            this.render_brick(readLevel, tile)
        })

        tiles.getTilesByType(sprites.dungeon.doorClosedNorth).forEach((tile: tiles.Location) => {
            tiles.setWallAt(tile, true)
        })
    }

    // Replace default tile with correct, linking walls.
    protected render_brick(view_map: tiles.TileMapData, tile: tiles.Location) : void {
        let adjacent_pattern = Dungeon.ADJACENT_OFFSETS.map((offset: Array<number>) => {
            let x = tile.column + offset[0], y = tile.row + offset[1]

            if (view_map.isOutsideMap(x, y)) return 1

            let adjacent = view_map.getTileImage(view_map.getTile(x, y))
            return (adjacent == sprites.builtin.brick) ? 1 : 0
        })

        let image = this.wall_image_from_adjacent(adjacent_pattern.join(""), tile)
        if (!image) throw adjacent_pattern.join("")
        tiles.setTileAt(tile, image)
    }

    // check adjacent squares for walls, to work out how to join them.
    protected wall_image_from_adjacent(pattern: string, tile: tiles.Location): Image {
        switch (pattern) {
            case "11111110":
                return assets.tile`wall outer nw+`
            case "11111011":
                return assets.tile`wall outer ne+`
            case "11011111":
                return assets.tile`wall outer se+`
            case "01111111":
                return assets.tile`wall outer sw+`

            case "11111000":
            case "11111001":
            case "11111100":
            case "11111101":
                return assets.tile`wall outer n`
            case "00011111":
            case "10011111":
            case "00111111":
            case "10111111":
                return assets.tile`wall outer s`
            case "01101011":
            case "11101011":
            case "01101111":
            case "11101111":
                return assets.tile`wall outer e`
            case "11010110":
            case "11110110":
            case "11010111":
            case "11110111":
                return assets.tile`wall outer w`
            case "00001011":
            case "00001111":
            case "00101011":
            case "00101111":
                return assets.tile`wall inner nw`
            case "00010110":
            case "10010110":
            case "00010111":
            case "10010111":
                return assets.tile`wall inner ne`
            case "11010000":
            case "11010100":
            case "11110000":
            case "11110100":
                return assets.tile`wall inner se`
            case "01101000":
            case "01101001":
            case "11101000":
            case "11101001":
                return assets.tile`wall inner sw`
            case "11111111":
                return assets.tile`wall solid`
            default:
                return sprites.castle.rock2
        }
    }

    // go down one level
    public advance(): void {
        for (let kind of [SpriteKind.Enemy, SpriteKind.Item]) {
            sprites.destroyAllSpritesOfKind(kind)
        }

        this.level += 1
        gui.updateLabels()

        player.setScale(1)
        player.resetMovement()
        this.render_level()
    }

    // Clear tile to transparency
    public clearTile(tile: tiles.Location): void {
        tiles.setTileAt(tile, assets.tile`transparency16`)
        tiles.setWallAt(tile, false)
    }
}
