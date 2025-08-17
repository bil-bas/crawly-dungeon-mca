namespace RoomRole {
    export const NORMAL = 0
    export const ENTRANCE = 1
    export const EXIT = 2
}

class Room {
    public edges: Room[] = []

    public get top(): int8 { return this.tile.row - Math.ceil(this.height / 2) }
    public get left(): int8 { return this.tile.column - Math.ceil(this.width / 2) }
    public get bottom(): int8 { return this.tile.row + Math.floor(this.height / 2) }
    public get right(): int8 { return this.tile.column + Math.floor(this.width / 2) }

    public get outerTop(): int8 { return this.top - 2 }
    public get outerLeft(): int8 { return this.left - 2 }
    public get outerBottom(): int8 { return this.bottom + 2 }
    public get outerRight(): int8 { return this.right + 2 }

    public get isEntranceOrExit(): boolean { return this.role == RoomRole.ENTRANCE || this.role == RoomRole.EXIT }

    public role: int8

    constructor(public tile: tiles.Location, public width: number, public height: number) {
    }
}


class Worm {
    static readonly MARGIN = 5

    static readonly DIRECTIONS = [
        CollisionDirection.Bottom, CollisionDirection.Top, CollisionDirection.Left, CollisionDirection.Right,
    ]

    protected width: int8
    protected height: int8
    protected rooms: Room[] = []

    constructor(data: tiles.TileMapData) {
        this.width = data.width
        this.height = data.height
        tiles.setCurrentTilemap(data)
    }

    public createDungeon(): void {
        this.digRooms(6)
        this.digCorridors()
    }

    protected digCorridors() {
        for (let room1 of this.rooms) {
            for (let room2 of this.rooms) {
                if (room1 == room2) continue
                if (room1.isEntranceOrExit && room2.isEntranceOrExit) continue
                this.joinRooms(room1, room2)
            }
        }
    }

    protected joinRooms(room1: Room, room2: Room): void {
        if (room1.tile.column > room2.tile.column) {
            [room1, room2] = [room2, room1]
        }

        for (let column = room1.tile.column + 1; column <= room2.tile.column - 1; column++) {
            let pos = tiles.getTileLocation(column, room1.tile.row)
            tiles.setTileAt(pos, assets.tile`transparency16`)
            tiles.setWallAt(pos, false)
        }

        if (room1.tile.row > room2.tile.row) {
            [room1, room2] = [room2, room1]
        }

        for (let row = room1.tile.row + 1; row <= room2.tile.row - 1; row++) {
            let pos = tiles.getTileLocation(room1.tile.column, row)
            tiles.setTileAt(pos, assets.tile`transparency16`)
            tiles.setWallAt(pos, false)
        }
    }

    protected digRooms(numRooms: number): void {
        while (this.rooms.length < numRooms) {
            let room: Room | null = this.placeRoom()
            if (room) {
                this.rooms.push(room)
            }
        }

        let entrance = this.rooms._pickRandom()
        tiles.setTileAt(entrance.tile, Dungeon.ENTRANCE)
        entrance.role = RoomRole.ENTRANCE

        let exit = this.rooms._pickRandom()
        while (exit == entrance) {
            exit = this.rooms._pickRandom()
        }
        exit.role = RoomRole.EXIT
        tiles.setTileAt(exit.tile, Dungeon.EXIT)
    }

    protected placeRoom(): Room | null {
        let width = randint(3, 6)
        let height = randint(3, 6)
        let position = this.getSafeLocation()
        let room = new Room(position, width, height)

        if (this.isRoomValid(room)) {
            return room
        } else {
            return null
        }
    }

    protected isRoomValid(room: Room): boolean {
        for (let col = room.outerLeft; col <= room.outerRight;  col++) {
            for (let row = room.outerTop; row <= room.outerBottom;  row++) {
                if (tiles.getTileAt(col, row) == assets.tile`transparency16`) {
                    return false
                }
            }
        }

        for (let col = room.left; col <= room.right;  col++) {
            for (let row = room.top; row <= room.bottom; row++) {
                let pos = tiles.getTileLocation(col, row)
                tiles.setTileAt(pos, assets.tile`transparency16`)
                tiles.setWallAt(pos, false)
            }
        }

        return true
    }

    protected getSafeLocation(): tiles.Location {
        return tiles.getTileLocation(randint(Worm.MARGIN, this.width - 1 - Worm.MARGIN),
                                     randint(Worm.MARGIN, this.height - 1 - Worm.MARGIN))
    }

    protected isInsideMargin(tile: tiles.Location): boolean {
        return ((tile.column >= Worm.MARGIN) &&
            (tile.column < this.width - Worm.MARGIN) &&
            (tile.row >= Worm.MARGIN) &&
            (tile.row < this.height - Worm.MARGIN))
    }
}