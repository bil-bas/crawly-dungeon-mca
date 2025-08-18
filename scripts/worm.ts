class Room {
    protected static readonly SPACING = 3

    public get top(): int8 { return this.tile.row - Math.ceil(this.height / 2) }
    public get left(): int8 { return this.tile.column - Math.ceil(this.width / 2) }
    public get bottom(): int8 { return this.tile.row + Math.floor(this.height / 2) }
    public get right(): int8 { return this.tile.column + Math.floor(this.width / 2) }

    public get outerTop(): int8 { return this.top - Room.SPACING }
    public get outerLeft(): int8 { return this.left - Room.SPACING }
    public get outerBottom(): int8 { return this.bottom + Room.SPACING }
    public get outerRight(): int8 { return this.right + Room.SPACING }

    constructor(public tile: tiles.Location, public width: number, public height: number) {
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
        for (let column = this.left; column <= this.bottom; column++) {
            if (column >= other.left && column <= other.right) {
                common.push(column)
            }
        }
        return common
    }
}


class Worm {
    static readonly EDGE_MARGIN = 5

    static readonly DIRECTIONS = [
        CollisionDirection.Bottom, CollisionDirection.Top, CollisionDirection.Left, CollisionDirection.Right,
    ]

    protected width: int8
    protected height: int8
    protected rooms: Room[] = []
    protected entrance: Room
    protected exit: Room

    public get isValid(): boolean {
        let path = scene.aStar(this.entrance.tile, this.exit.tile)
        return path != undefined && path.length >= 30
    }

    constructor(data: tiles.TileMapData) {
        this.width = data.width
        this.height = data.height
        tiles.setCurrentTilemap(data)
    }

    public createDungeon(): void {
        this.digRooms(50)
        this.digCorridors()
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

    protected digTile(column: number, row: number): void {
        let pos = tiles.getTileLocation(column, row)
        if (tiles.tileAtLocationEquals(pos, Dungeon.FULL)) {
            tiles.setTileAt(pos, assets.tile`transparency16`)
            tiles.setWallAt(pos, false)
        }
    }

    protected digCorridorHorizontally(room1: Room, room2: Room): void {
        if (room1.tile.column > room2.tile.column) {
            [room1, room2] = [room2, room1]
        }
        let commonRow = room1.commonRows(room2)._pickRandom()

        for (let column = room1.right + 1; column < room2.left; column++) {
            this.digTile(column, commonRow)
        }
    }

    protected digCorridorVertically(room1: Room, room2: Room): void {
        if (room1.tile.row > room2.tile.row) {
            [room1, room2] = [room2, room1]
        }

        let commonColumn = room1.commonColumns(room2)._pickRandom()

        for (let row = room1.bottom + 1; row < room2.top; row++) {
            this.digTile(commonColumn, row)
        }
    }

    protected digRooms(numRooms: number): void {
        for (let i = 0; i < numRooms; i++) {
            let room: Room | null = this.placeRoom()
            if (room) {
                this.rooms.push(room)
            }
        }

        this.entrance = this.rooms._pickRandom()
        tiles.setTileAt(this.entrance.tile, Dungeon.ENTRANCE)

        this.exit = this.rooms._pickRandom()
        while (this.exit == this.entrance) {
            this.exit = this.rooms._pickRandom()
        }
        tiles.setTileAt(this.exit.tile, Dungeon.EXIT)
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
        return tiles.getTileLocation(randint(Worm.EDGE_MARGIN, this.width - 1 - Worm.EDGE_MARGIN),
                                     randint(Worm.EDGE_MARGIN, this.height - 1 - Worm.EDGE_MARGIN))
    }

    protected isInsideMargin(tile: tiles.Location): boolean {
        return ((tile.column >= Worm.EDGE_MARGIN) &&
            (tile.column < this.width - Worm.EDGE_MARGIN) &&
            (tile.row >= Worm.EDGE_MARGIN) &&
            (tile.row < this.height - Worm.EDGE_MARGIN))
    }
}