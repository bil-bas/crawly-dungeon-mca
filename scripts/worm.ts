class Room {
    protected static readonly SPACING = 4

    public get top(): int8 { return this.tile.row }
    public get left(): int8 { return this.tile.column }
    public get bottom(): int8 { return this.tile.row + this.height - 1 }
    public get right(): int8 { return this.tile.column + this.width - 1 }

    public get outerTop(): int8 { return this.top - Room.SPACING }
    public get outerLeft(): int8 { return this.left - Room.SPACING }
    public get outerBottom(): int8 { return this.bottom + Room.SPACING }
    public get outerRight(): int8 { return this.right + Room.SPACING }
    public get area(): int8 { return this.width * this.height }

    constructor(public readonly tile: tiles.Location,
                public readonly width: number,
                public readonly height: number) {
    }

    public commonRows(other: Room): number[] {
        let common: number[] = []
        for (let row = this.top; row <= this.bottom; row++) {
            if (row >= other.top && row <= other.bottom) {
                common.push(row)
            }
        }
        return common
    }

    public commonColumns(other: Room): number[] {
        let common: number[] = []
        for (let column = this.left; column <= this.right; column++) {
            if (column >= other.left && column <= other.right) {
                common.push(column)
            }
        }
        return common
    }

    public randomTile(margin?: number): tiles.Location {
        margin = margin || 0
        return tiles.getTileLocation(randint(this.left + margin, this.right - margin),
            randint(this.top + margin, this.bottom - margin))
    }
}


class Worm {
    protected static readonly EDGE_MARGIN: int8 = 5
    protected static readonly MINIMUM_AREA: int8 = 50
    protected static readonly MINIMUM_DISTANCE: int8 = 25
    protected static readonly MAX_ROOM_PLACEMENTS: int8 = 75
    protected static readonly MIN_ROOMS: int8 = 4
    protected static readonly MAX_ROOMS: int8 = 7

    static readonly DIRECTIONS = [
        CollisionDirection.Bottom, CollisionDirection.Top, CollisionDirection.Left, CollisionDirection.Right,
    ]

    protected readonly width: int8
    protected readonly height: int8
    protected readonly rooms: Room[] = []
    protected entrance: Room
    protected exit: Room

    public get isValid(): boolean {
        let area = this.rooms.reduce((p: number, r: Room) => p + r.area, 0)

        if (area < Worm.MINIMUM_AREA) return false

        if (!this.entrance || !this.exit) return false

        let path = scene.aStar(this.entrance.tile, this.exit.tile)
        return path != undefined && path.length >= Worm.MINIMUM_DISTANCE
    }

    protected isClear(column: number, row: number): boolean {
        return tiles.getTileAt(column, row) == assets.tile`transparency16`
    }

    constructor(data: tiles.TileMapData) {
        this.width = data.width
        this.height = data.height
        tiles.setCurrentTilemap(data)
    }

    public createDungeon(): void {
        this.digRooms(Worm.MAX_ROOM_PLACEMENTS)
        if (this.rooms.length < Worm.MIN_ROOMS) {
            console.log(this.rooms.length)
            return
        }
        this.assignEntrance()
        this.assignExit()
        this.digCorridors()
    }

    protected clear(column: number, row: number): void {
        let tile = tiles.getTileLocation(column, row)
        tiles.setTileAt(tile, assets.tile`transparency16`)
        tiles.setWallAt(tile, false)
    }

    protected digCorridors(): void {
        for (let r1 = 0; r1 < this.rooms.length - 1; r1++) {
            for (let r2 = r1 + 1; r2 < this.rooms.length; r2++) {
                let [room1, room2] = [this.rooms[r1], this.rooms[r2]]
                if ((room1 != this.entrance && room1 != this.exit) ||
                    (room2 != this.entrance && room2 != this.exit)) {
                    this.joinRooms(room1, room2)
                }
            }
        }
    }

    protected joinRooms(room1: Room, room2: Room): void {
        if (room1.commonRows(room2)) {
            this.digCorridorHorizontally(room1, room2)
        }

        if (room1.commonColumns(room2)) {
            this.digCorridorVertically(room1, room2)
        }
    }

    protected digCorridorHorizontally(room1: Room, room2: Room): void {
        if (room1.tile.column > room2.tile.column) {
            [room1, room2] = [room2, room1]
        }

        let row = room1.commonRows(room2)._pickRandom()

        for (let column = room1.right + 1; column <= room2.left - 1; column++) {
            if (this.isClear(column, row)) {
                return
            }
        }

        this.buildDoor(room1.right + 1, row)
        for (let column = room1.right + 2; column <= room2.left - 2; column++) {
            this.clear(column, row)
        }
        this.buildDoor(room2.left - 1, row)
    }

    protected digCorridorVertically(room1: Room, room2: Room): void {
        if (room1.tile.row > room2.tile.row) {
            [room1, room2] = [room2, room1]
        }

        let column = room1.commonColumns(room2)._pickRandom()

        for (let row = room1.bottom + 1; row <= room2.top - 1; row++) {
            if (this.isClear(column, row)) {
                return
            }
        }

        this.buildDoor(column, room1.bottom + 1)
        for (let row = room1.bottom + 2; row <= room2.top - 2; row++) {
            this.clear(column, row)
        }
        this.buildDoor(column, room2.top - 1)
    }

    protected buildDoor(column: number, row: number): void {
        let tile = tiles.getTileLocation(column, row)
        tiles.setTileAt(tile, sprites.dungeon.doorClosedNorth)
        tiles.setWallAt(tile, false)
    }

    protected digRooms(numRooms: number): void {
        for (let i = 0; i < numRooms; i++) {
            this.placeRoom()
            if (this.rooms.length == Worm.MAX_ROOMS) break
        }
    }

    protected assignEntrance(): void {
        this.entrance = this.rooms._pickRandom()
        tiles.setTileAt(this.entrance.randomTile(1), Dungeon.ENTRANCE)
    }

    protected assignExit(): void {
        this.exit = this.rooms._pickRandom()
        while (this.exit == this.entrance) {
            this.exit = this.rooms._pickRandom()
        }
        tiles.setTileAt(this.exit.randomTile(1), Dungeon.EXIT)
    }

    protected placeRoom(): void {
        let width = [3, 4, 4, 5, 5, 5, 6, 6, 7]._pickRandom()
        let height = [3, 4, 4, 5, 5, 5, 6, 6, 7]._pickRandom()
        let position = this.getSafeLocation(width, height)
        let room = new Room(position, width, height)

        if (!this.isRoomOverlappingRoom(room)) {
            this.clearRoom(room)
            this.rooms.push(room)
        }
    }

    protected isRoomOverlappingRoom(room: Room): boolean {
        // Not over any other room.
        for (let column = room.outerLeft; column <= room.outerRight; column++) {
            for (let row = room.outerTop; row <= room.outerBottom; row++) {
                if (this.isClear(column, row)) {
                    return true
                }
            }
        }
        return false
    }

    protected clearRoom(room: Room): void {
        for (let column = room.left; column <= room.right;  column++) {
            for (let row = room.top; row <= room.bottom; row++) {
                this.clear(column, row)
            }
        }
    }

    protected getSafeLocation(width: number, height: number): tiles.Location {
        return tiles.getTileLocation(randint(Worm.EDGE_MARGIN, this.width - 1 - Worm.EDGE_MARGIN - width),
                                     randint(Worm.EDGE_MARGIN, this.height - 1 - Worm.EDGE_MARGIN - height))
    }
}