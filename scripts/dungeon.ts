namespace SpriteKind {
    export const Item = SpriteKind.create()
}

class Dungeon {
    static readonly FULL = sprites.builtin.brick
    static readonly ENTRANCE = sprites.dungeon.stairLarge
    static readonly EXIT = sprites.dungeon.stairNorth
    static readonly RUBBLE = sprites.castle.rock2

    public static readonly ADJACENT_OFFSETS = [
        [-1, -1], [+0, -1], [+1, -1],
        [-1, +0],           [+1, +0],
        [-1, +1], [+0, +1], [+1, +1],
    ]

    protected levelIndex: int8 = -1

    constructor() {
        scene.setBackgroundColor(Colour.DARK_PURPLE)
        this.advance()
    }

    // Render the level tiles, add player and creatues.
    protected render_level(): void {
        let level = tileUtil.cloneMap(assets.tilemap`empty16`)

        let worm = new Worm(level)
        worm.createDungeon()
        tiles.placeOnRandomTile(player, Dungeon.ENTRANCE)

        let readLevel = tileUtil.cloneMap(level)

        tiles.getTilesByType(sprites.builtin.brick).forEach((tile: tiles.Location) => {
            this.render_brick(readLevel, tile)
        })

        tiles.setCurrentTilemap(level)
    }

    // protected render_object(image: Image, tile: tiles.Location): void {
    //     let clear = true

    //     switch (image) {
    //         case assets.tile`bat`: new Bat(tile); break
    //         case assets.tile`skeleton`: new Skeleton(tile); break
    //         case assets.tile`monkey`: new Monkey(tile); break
    //         case assets.tile`hermit crab`: new HermitCrab(tile); break
    //         case assets.tile`shroom`: new Shroom(tile); break
    //         case assets.tile`mimic`: new Mimic(tile); break

    //         case assets.tile`key`: new Key(tile); break
    //         case assets.tile`chest`: new Chest(tile); break
    //         case assets.tile`mana potion`: new ManaPotion(tile); break
    //         case assets.tile`life potion`: new LifePotion(tile); break
    //         case assets.tile`coins`: new Coins(tile); break

    //         case assets.tile`item shop`: new ItemShop(tile); break
    //         case assets.tile`spell shop`: new SpellShop(tile); break
    //         case assets.tile`shrine`: new Shrine(tile); break
    //         case assets.tile`mushroom`: new Mushroom(tile); break
    //         default:
    //             clear = false
    //     }
    // }

    // Replace default tile with correct, linking walls.
    protected render_brick(view_map: tiles.TileMapData, tile: tiles.Location) : void {
        let adjacent_pattern = Dungeon.ADJACENT_OFFSETS.map((offset: Array<number>) => {
            let x = tile.column + offset[0], y = tile.row + offset[1]

            if (view_map.isOutsideMap(x, y)) return 1

            let adjacent = view_map.getTileImage(view_map.getTile(x, y))
            return (adjacent == sprites.builtin.brick) ? 1 : 0
        })

        tiles.setTileAt(tile, this.wall_image_from_adjacent(adjacent_pattern.join("")))
    }

    // check adjacent squares for walls, to work out how to join them.
    protected wall_image_from_adjacent(pattern: string): Image {
        switch (pattern) {
            case "11111110":
                return sprites.dungeon.purpleOuterNorthWest
            case "11111011":
                return sprites.dungeon.purpleOuterNorthEast
            case "11011111":
                return sprites.dungeon.purpleOuterSouthEast
            case "01111111":
                return sprites.dungeon.purpleOuterSouthWest

            case "11111000":
            case "11111001":
            case "11111100":
            case "11111101":
                return sprites.dungeon.purpleOuterNorth0
            case "00011111":
            case "10011111":
            case "00111111":
            case "10111111":
                return sprites.dungeon.purpleOuterSouth0
            case "01101011":
            case "11101011":
            case "01101111":
            case "11101111":
                return sprites.dungeon.purpleOuterEast0
            case "11010110":
            case "11110110":
            case "11010111":
            case "11110111":
                return sprites.dungeon.purpleOuterWest0

            case "00001011":
            case "00001111":
            case "00101011":
            case "00101111":
                return sprites.dungeon.purpleInnerNorthWest
            case "00010110":
            case "10010110":
            case "00010111":
            case "10010111":
                return sprites.dungeon.purpleInnerNorthEast
            case "11010000":
            case "11010100":
            case "11110000":
            case "11110100":
                return sprites.dungeon.purpleInnerSouthEast
            case "01101000":
            case "01101001":
            case "11101000":
            case "11101001":
                return sprites.dungeon.purpleInnerSouthWest
            case "11111111":
                return assets.tile`top of wall`
            default:
                return Dungeon.RUBBLE
        }
    }

    // go down one level
    public advance(): void {
        for (let kind of [SpriteKind.Enemy, SpriteKind.Item]) {
            sprites.destroyAllSpritesOfKind(kind)
        }

        this.levelIndex += 1
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
