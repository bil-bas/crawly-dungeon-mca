namespace SpriteKind {
    export const Item = SpriteKind.create()
}

const ADJACENT_OFFSETS = [
    [-1, -1], [+0, -1], [+1, -1],
    [-1, +0],           [+1, +0],
    [-1, +1], [+0, +1], [+1, +1],
]

// Render the level tiles, add player and creatues.
function render_walls() {
    let view_map = tileUtil.cloneMap(LEVELS[current_level])

    tileUtil.forEachTileInMap(view_map, (column: number, row: number, location: tiles.Location) => {
        switch (view_map.getTileImage(view_map.getTile(column, row))) {
            case sprites.builtin.brick:
                tiles.setWallAt(location, true)
                render_brick(view_map, column, row, location)
                break
            case sprites.dungeon.stairLadder:
            case sprites.dungeon.doorLockedNorth:
                tiles.setWallAt(location, true)
                break
            case sprites.dungeon.stairLarge:
                clearTile(location)
                tiles.placeOnTile(player.sprite, location)
                break
            case assets.tile`bat`:
                new Bat(location)
                break
            case assets.tile`skeleton`:
                new Skeleton(location)
                break
            case assets.tile`monkey`:
                new Monkey(location)
                break
            case assets.tile`hermit crab`:
                new HermitCrab(location)
                break
             case assets.tile`shroom`:
                new Shroom(location)
                break
            case assets.tile`mana potion`:
                createItem("mana potion", sprites.projectile.firework1, location)
                break
            case assets.tile`key tile`:
                createItem("key", assets.image`key`, location)
                break
            case assets.tile`life potion`:
                createItem("life potion", sprites.projectile.heart1, location)
                break
            case assets.tile`chest`:
                tiles.setTileAt(location, sprites.dungeon.chestClosed)
                tiles.setWallAt(location, true)
                break
        }
    })
}

// create a sprite from tile
function createItem(type: string, image: Image, location: tiles.Location) {
    clearTile(location)
    let item = sprites.create(image, SpriteKind.Item)
    tiles.placeOnTile(item, location)
    sprites.setDataString(item, "type", type)
}

// Replace default tile with correct, linking walls.
function render_brick(view_map: tiles.TileMapData, column: number, row: number, location: tiles.Location) : void {
    let adjacent_pattern = ADJACENT_OFFSETS.map((offset) => {
        let x = column + offset[0], y = row + offset[1]
        
        if (view_map.isOutsideMap(x, y)) return 1

        let adjacent = view_map.getTileImage(view_map.getTile(x, y))
        return (adjacent == sprites.builtin.brick) ? 1 : 0
    })
    
    let tile = wall_image_from_adjacent(adjacent_pattern.join(""))
    tiles.setTileAt(location, tile)
}

// check adjacent squares for walls, to work out how to join them.
function wall_image_from_adjacent(pattern: string): Image {
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
            return assets.tile`transparency16`
        default:
            return sprites.dungeon.floorDark0
    }
}

// go down one level
function advance_level() {
    sprites.destroyAllSpritesOfKind(SpriteKind.Enemy)
    sprites.destroyAllSpritesOfKind(SpriteKind.Item)
    current_level += 1
    player.sprite.setScale(1)
    controller.moveSprite(player.sprite, 60, 60)
    tiles.setCurrentTilemap(LEVELS[current_level])
    render_walls()
}

// Clear tile to transparency
function clearTile(location: tiles.Location) {
    tiles.setTileAt(location, assets.tile`transparency16`)
}
