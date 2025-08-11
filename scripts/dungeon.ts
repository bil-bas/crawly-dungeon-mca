namespace SpriteKind {
    export const Item = SpriteKind.create()
}

class Dungeon {
    static ADJACENT_OFFSETS = [
        [-1, -1], [+0, -1], [+1, -1],
        [-1, +0],           [+1, +0],
        [-1, +1], [+0, +1], [+1, +1],
    ]
    
    _level: tiles.TileMapData
    _levelIndex: int8 = -1

    constructor() {
        scene.setBackgroundColor(Colour.DPURPLE)
        this.advance()
    }

    _getLevel(index: number): tiles.TileMapData {
        switch (index) {
            case 0: return tilemap`level 1`
            case 1: return tilemap`level 2`
            case 2: return tilemap`level 3`
            default: return null
        }
    }

    // Render the level tiles, add player and creatues.
    _render_level(): void {
        let read_level = this._getLevel(this._levelIndex)
        this._level = tileUtil.cloneMap(read_level)
        tiles.setCurrentTilemap(this._level)

        tileUtil.forEachTileInMap(read_level, (column: number, row: number, tile: tiles.Location) => {
            let image = read_level.getTileImage(read_level.getTile(column, row))
            let clear = true
            switch (image) {
                case sprites.builtin.brick:
                    this._render_brick(read_level, column, row, tile)
                    clear = false
                    break
                case sprites.dungeon.stairLadder:
                case sprites.dungeon.doorLockedNorth:
                    tiles.setWallAt(tile, true)
                    clear = false
                    break
                case sprites.dungeon.stairLarge:
                    tiles.placeOnTile(player.sprite, tile)
                    break
        
                case assets.tile`bat`: new Bat(tile); break
                case assets.tile`skeleton`: new Skeleton(tile); break
                case assets.tile`monkey`: new Monkey(tile); break
                case assets.tile`hermit crab`: new HermitCrab(tile); break
                case assets.tile`shroom`: new Shroom(tile); break
                case assets.tile`mimic`: new Mimic(tile); break

                case assets.tile`item shop`: new ItemShop(tile); break
                case assets.tile`spell shop`: new SpellShop(tile); break

                case assets.tile`chest`: new Chest(tile); break
                case assets.tile`mana potion`: new ManaPotion(tile); break
                case assets.tile`key`: new SkeletonKey(tile); break
                case assets.tile`life potion`: new LifePotion(tile); break
                case assets.tile`shrine`: new Shrine(tile); break
                case assets.tile`mushroom`: new Mushroom(tile); break
                case assets.tile`rockslide`: new Rockslide(tile); break

                default:
                    clear = false
            }
            
            if (clear) {
                this.clearTile(tile)
            }
        })
    }

    // Replace default tile with correct, linking walls.
    _render_brick(view_map: tiles.TileMapData, column: number, row: number, tile: tiles.Location) : void {
        let adjacent_pattern = Dungeon.ADJACENT_OFFSETS.map((offset: Array<number>) => {
            let x = column + offset[0], y = row + offset[1]
            
            if (view_map.isOutsideMap(x, y)) return 1

            let adjacent = view_map.getTileImage(view_map.getTile(x, y))
            return (adjacent == sprites.builtin.brick) ? 1 : 0
        })
        
        tiles.setTileAt(tile, this._wall_image_from_adjacent(adjacent_pattern.join("")))
        tiles.setWallAt(tile, true)
    }

    // check adjacent squares for walls, to work out how to join them.
    _wall_image_from_adjacent(pattern: string): Image {
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
                return assets.tile`transparency16` // To see backround
        }
    }

    // go down one level
    advance(): void {
        for (let kind of [SpriteKind.Enemy, SpriteKind.Item, SpriteKind.Person]) {
            sprites.destroyAllSpritesOfKind(kind)
        }
        
        this._levelIndex += 1
        player.sprite.setScale(1)
        player.resetMovement()
        this._render_level()
    }

    // Clear tile to transparency
    clearTile(location: tiles.Location): void {
        tiles.setTileAt(location, assets.tile`transparency16`)
    }
}
