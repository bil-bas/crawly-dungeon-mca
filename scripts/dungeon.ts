namespace SpriteKind {
    export const Item = SpriteKind.create()
}

class Minimap {
    _sprite: Sprite

    constructor() {
        this._sprite = sprites.create(assets.tile`transparency16`, SpriteKind.Player)
        this._sprite.top = 0
        this._sprite.left = 0
        this._sprite.z = ZLevel.UI
        this._sprite.setFlag(SpriteFlag.RelativeToCamera, true)
        
        game.onUpdateInterval(500, () => {
            let map = minimap.minimap(MinimapScale.Sixteenth, 1, Colour.BLACK)
            minimap.includeSprite(map, player.sprite, MinimapSpriteScale.Double)
            this._sprite.setImage(map.image)
        })
    }
}

class Dungeon {
    static ADJACENT_OFFSETS = [
        [-1, -1], [+0, -1], [+1, -1],
        [-1, +0],           [+1, +0],
        [-1, +1], [+0, +1], [+1, +1],
    ]
    
    _levels: Array<tiles.TileMapData>
    _current_level: tiles.TileMapData
    _current_level_index: number = -1
    _items: { [id: string]: Item } = {}
    _minimap: Minimap

    constructor(levels: Array<tiles.TileMapData>) {
        scene.setBackgroundColor(Colour.DARK_PURPLE)
        this._levels = levels
        this.advance_level()
        this._minimap = new Minimap()
    }

    getItem(tile: tiles.Location) {
        return this._items[`${tile.x},${tile.y}`]
    }
    setItem(tile: tiles.Location, item: Item) {
        this._items[`${tile.x},${tile.y}`] = item
    }

    // Render the level tiles, add player and creatues.
    _render_level(): void {
        let read_level = this._levels[this._current_level_index]
        this._current_level = tileUtil.cloneMap(read_level)
        tiles.setCurrentTilemap(this._current_level)

        tileUtil.forEachTileInMap(read_level, (column: number, row: number, location: tiles.Location) => {
            let image = read_level.getTileImage(read_level.getTile(column, row))
            let clear = true
            switch (image) {
                case sprites.builtin.brick:
                    this._render_brick(read_level, column, row, location)
                    clear = false
                    break
                case sprites.dungeon.stairLadder:
                case sprites.dungeon.doorLockedNorth:
                    tiles.setWallAt(location, true)
                    clear = false
                    break
                case sprites.dungeon.stairLarge:
                    tiles.placeOnTile(player.sprite, location)
                    break
        
                case assets.tile`bat`: new Bat(location); break
                case assets.tile`skeleton`: new Skeleton(location); break
                case assets.tile`monkey`: new Monkey(location); break
                case assets.tile`hermit crab`: new HermitCrab(location); break
                case assets.tile`shroom`: new Shroom(location); break
                case assets.tile`mimic`: new Mimic(location); break

                case assets.tile`chest`:
                    tiles.setWallAt(location, true)
                    tiles.setTileAt(location, sprites.dungeon.chestClosed)
                    clear = false
                    break
                case assets.tile`mana potion`:
                    this.setItem(location, new ManaPotion(location))
                    break
                case assets.tile`key tile`:
                    this.setItem(location, new SkeletonKey(location))
                    break
                case assets.tile`life potion`:
                    this.setItem(location, new LifePotion(location))
                    break
                case assets.tile`shrine of life`:
                    this.setItem(location, new ShrineofLife(location))
                    tiles.setWallAt(location, true)
                    break
                case assets.tile`shrine of mana`:
                    this.setItem(location, new ShrineofMana(location))
                    tiles.setWallAt(location, true)
                    break
                default:
                    clear = false
            }
            if (clear) {
                this.clearTile(location)
            }
        })

        tileUtil.forEachTileInMap(this._current_level, (column: number, row: number, location: tiles.Location) => {
            let image = this._current_level.getTileImage(this._current_level.getTile(column, row))
        })
    }

    // Replace default tile with correct, linking walls.
    _render_brick(view_map: tiles.TileMapData, column: number, row: number, location: tiles.Location) : void {
        let adjacent_pattern = Dungeon.ADJACENT_OFFSETS.map((offset: Array<number>) => {
            let x = column + offset[0], y = row + offset[1]
            
            if (view_map.isOutsideMap(x, y)) return 1

            let adjacent = view_map.getTileImage(view_map.getTile(x, y))
            return (adjacent == sprites.builtin.brick) ? 1 : 0
        })
        
        let tile = this._wall_image_from_adjacent(adjacent_pattern.join(""))
        tiles.setTileAt(location, tile)
        tiles.setWallAt(location, true)
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
    advance_level(): void {
        sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
        sprites.destroyAllSpritesOfKind(SpriteKind.Item)
        this._current_level_index += 1
        player.sprite.setScale(1)
        controller.moveSprite(player.sprite, 60, 60)
        this._render_level()
    }

    // Clear tile to transparency
    clearTile(location: tiles.Location): void {
        tiles.setTileAt(location, assets.tile`transparency16`)
    }
}
