// ============================================================
// MAP GENERATOR - PART 1/3
// TYPES, CONFIGURATION, RANDOM, ROOMS
// ============================================================

export enum TileType {
    Empty = 0,
    Floor = 1,
    Wall = 2,
    Corridor = 3,
    Door = 4
}

export type RoomType =
    | "spawn"
    | "boss"
    | "basic"
    | "treasure"
    | "elite";

export type RoomShape =
    | "rectangle"
    | "L"
    | "U"
    | "T"
    | "cross";

export interface RoomConfig {
    id: RoomType;
    minCount: number;
    maxCount: number;
    required: boolean;
    weight: number;
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
    shapes: RoomShape[];
    maxConnections: number;
}

export interface Room {
    id: number;
    type: RoomType;
    shape: RoomShape;

    x: number;
    y: number;

    width: number;
    height: number;

    tiles: { x: number; y: number }[];

    connections: number[];
}

export interface RoomConnection {
    from: number;
    to: number;
    tiles: { x: number; y: number }[];
}

export interface GeneratedDungeon {
    floor: number;

    width: number;
    height: number;

    tiles: number[][];

    rooms: Room[];
    connections: RoomConnection[];
}

type Point = {
    x: number;
    y: number;
};

interface DungeonGeneratorOptions {
    width: number;
    height: number;
    floor?: number;
    seed?: number;
    roomConfigs?: RoomConfig[];
    placementAttempts?: number;
    extraConnectionChance?: number;
}


export const DEFAULT_ROOM_CONFIGS: RoomConfig[] = [
    {
        id: "spawn",
        minCount: 1,
        maxCount: 1,
        required: true,
        weight: 1,
        minWidth: 9,
        maxWidth: 13,
        minHeight: 9,
        maxHeight: 13,
        shapes: ["rectangle", "cross"],
        maxConnections: 3
    },
    {
        id: "boss",
        minCount: 1,
        maxCount: 1,
        required: true,
        weight: 1,
        minWidth: 13,
        maxWidth: 19,
        minHeight: 13,
        maxHeight: 19,
        shapes: ["rectangle", "cross", "T"],
        maxConnections: 2
    },
    {
        id: "basic",
        minCount: 5,
        maxCount: 9,
        required: true,
        weight: 5,
        minWidth: 7,
        maxWidth: 12,
        minHeight: 7,
        maxHeight: 12,
        shapes: ["rectangle", "L", "T", "cross"],
        maxConnections: 4
    },
    {
        id: "treasure",
        minCount: 1,
        maxCount: 3,
        required: false,
        weight: 2,
        minWidth: 6,
        maxWidth: 9,
        minHeight: 6,
        maxHeight: 9,
        shapes: ["rectangle", "L"],
        maxConnections: 1
    },
    {
        id: "elite",
        minCount: 1,
        maxCount: 2,
        required: false,
        weight: 2,
        minWidth: 9,
        maxWidth: 13,
        minHeight: 9,
        maxHeight: 13,
        shapes: ["rectangle", "T", "cross"],
        maxConnections: 3
    }
];

// ============================================================
// SEEDED RANDOM GENERATOR
// ============================================================

class Random {
    private state: number;

    constructor(seed: number = Date.now()) {
        this.state = seed >>> 0;
    }

    next(): number {
        this.state = (this.state + 0x6D2B79F5) >>> 0;

        let t = this.state;

        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    int(min: number, max: number): number {
        if (max < min) {
            throw new Error("Invalid random range.");
        }

        return Math.floor(
            this.next() * (max - min + 1)
        ) + min;
    }

    pick<T>(array: T[]): T {
        if (array.length === 0) {
            throw new Error("Cannot pick from empty array.");
        }

        return array[this.int(0, array.length - 1)]!;
    }

    chance(probability: number): boolean {
        return this.next() < probability;
    }

    shuffle<T>(array: T[]): T[] {
        const result = [...array];

        for (let i = result.length - 1; i > 0; i--) {
            const j = this.int(0, i);

            const temp = result[i]!;

            result[i] = result[j]!;
            result[j] = temp;
        }

        return result;
    }
}


const DIRECTIONS: Point[] = [
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: -1 }
];

function pointKey(point: Point): string {
    return `${point.x},${point.y}`;
}

function manhattan(a: Point, b: Point): number {
    return (
        Math.abs(a.x - b.x) +
        Math.abs(a.y - b.y)
    );
}

function getTile(
    tiles: number[][],
    x: number,
    y: number
): number | undefined {
    return tiles[y]?.[x];
}

function setTile(
    tiles: number[][],
    x: number,
    y: number,
    value: TileType
): void {
    const row = tiles[y];

    if (!row || x < 0 || x >= row.length) {
        return;
    }

    row[x] = value;
}


function validateOptions(
    options: DungeonGeneratorOptions
): void {
    const { width, height } = options;

    if (
        !Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width < 20 ||
        height < 20
    ) {
        throw new Error(
            "Dungeon dimensions must be integers >= 20."
        );
    }

    const attempts = options.placementAttempts ?? 100;

    if (!Number.isInteger(attempts) || attempts < 1) {
        throw new Error(
            "placementAttempts must be greater than zero."
        );
    }

    const extraChance =
        options.extraConnectionChance ?? 0.3;

    if (extraChance < 0 || extraChance > 1) {
        throw new Error(
            "extraConnectionChance must be between 0 and 1."
        );
    }

    const configs =
        options.roomConfigs ?? DEFAULT_ROOM_CONFIGS;

    for (const config of configs) {
        if (
            config.minCount < 0 ||
            config.maxCount < config.minCount ||
            config.minWidth < 3 ||
            config.minHeight < 3 ||
            config.maxWidth < config.minWidth ||
            config.maxHeight < config.minHeight ||
            config.maxConnections < 1 ||
            config.shapes.length === 0
        ) {
            throw new Error(
                `Invalid configuration for room: ${config.id}`
            );
        }

        if (
            config.maxWidth > width - 4 ||
            config.maxHeight > height - 4
        ) {
            throw new Error(
                `Room ${config.id} is too large for dungeon.`
            );
        }
    }
}


function createShape(
    width: number,
    height: number,
    shape: RoomShape
): Point[] {
    const points: Point[] = [];

    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let include = false;

            switch (shape) {
                case "rectangle":
                    include = true;
                    break;

                case "L":
                    include =
                        x <= Math.floor(width * 0.35) ||
                        y >= Math.floor(height * 0.65);
                    break;

                case "U":
                    include =
                        x <= Math.floor(width * 0.25) ||
                        x >= Math.ceil(width * 0.75) ||
                        y >= Math.floor(height * 0.7);
                    break;

                case "T":
                    include =
                        y <= Math.floor(height * 0.3) ||
                        Math.abs(x - midX) <=
                        Math.floor(width * 0.2);
                    break;

                case "cross":
                    include =
                        Math.abs(x - midX) <=
                        Math.floor(width * 0.2) ||
                        Math.abs(y - midY) <=
                        Math.floor(height * 0.2);
                    break;
            }

            if (include) {
                points.push({ x, y });
            }
        }
    }

    return points;
}


function generateRoom(
    id: number,
    config: RoomConfig,
    x: number,
    y: number,
    random: Random
): Room {
    const width = random.int(
        config.minWidth,
        config.maxWidth
    );

    const height = random.int(
        config.minHeight,
        config.maxHeight
    );

    const shape = random.pick(config.shapes);

    const tiles = createShape(
        width,
        height,
        shape
    ).map(point => ({
        x: point.x + x,
        y: point.y + y
    }));

    return {
        id,
        type: config.id,
        shape,

        x,
        y,

        width,
        height,

        tiles,

        connections: []
    };
}


function canPlaceRoom(
    room: Room,
    occupied: Set<string>,
    width: number,
    height: number
): boolean {
    for (const tile of room.tiles) {
        if (
            tile.x < 2 ||
            tile.y < 2 ||
            tile.x >= width - 2 ||
            tile.y >= height - 2
        ) {
            return false;
        }

        // Minimum one-tile spacing around rooms.
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const key = `${tile.x + dx},${tile.y + dy}`;

                if (occupied.has(key)) {
                    return false;
                }
            }
        }
    }

    return true;
}

function placeRooms(
    configs: RoomConfig[],
    width: number,
    height: number,
    random: Random,
    attempts: number
): Room[] {
    const rooms: Room[] = [];

    const occupied = new Set<string>();

    // Larger and required rooms are placed first.
    const orderedConfigs = [...configs].sort(
        (a, b) => {
            return Number(b.required) - Number(a.required);
        }
    );

    let roomId = 0;

    for (const config of orderedConfigs) {
        const count = random.int(
            config.minCount,
            config.maxCount
        );

        let placed = 0;

        for (let i = 0; i < count; i++) {
            let success = false;

            for (
                let attempt = 0;
                attempt < attempts;
                attempt++
            ) {
                const roomWidth = random.int(
                    config.minWidth,
                    config.maxWidth
                );

                const roomHeight = random.int(
                    config.minHeight,
                    config.maxHeight
                );

                const x = random.int(
                    2,
                    width - roomWidth - 2
                );

                const y = random.int(
                    2,
                    height - roomHeight - 2
                );

                const room = generateRoom(
                    roomId,
                    {
                        ...config,
                        minWidth: roomWidth,
                        maxWidth: roomWidth,
                        minHeight: roomHeight,
                        maxHeight: roomHeight
                    },
                    x,
                    y,
                    random
                );

                if (
                    !canPlaceRoom(
                        room,
                        occupied,
                        width,
                        height
                    )
                ) {
                    continue;
                }

                rooms.push(room);

                for (const tile of room.tiles) {
                    occupied.add(pointKey(tile));
                }

                roomId++;
                placed++;
                success = true;

                break;
            }

            if (
                !success &&
                config.required &&
                placed < config.minCount
            ) {
                throw new Error(
                    `Could not place required rooms: ${config.id}. ` +
                    `Placed ${placed}/${config.minCount}. ` +
                    `Increase dungeon dimensions or placementAttempts.`
                );
            }
        }
    }

    return rooms;
}


interface RoomEntrance {
    door: Point;
    outside: Point;
}

function findRoomEntrances(
    room: Room,
    roomMap: Map<string, number>
): RoomEntrance[] {
    const entrances: RoomEntrance[] = [];

    for (const tile of room.tiles) {
        for (const direction of DIRECTIONS) {
            const outside: Point = {
                x: tile.x + direction.x,
                y: tile.y + direction.y
            };

            if (roomMap.has(pointKey(outside))) {
                continue;
            }

            entrances.push({
                door: tile,
                outside
            });
        }
    }

    return entrances;
}


function findClosestEntrances(
    a: Room,
    b: Room,
    roomMap: Map<string, number>,
    random: Random
): [RoomEntrance, RoomEntrance] {
    const entrancesA = findRoomEntrances(a, roomMap);
    const entrancesB = findRoomEntrances(b, roomMap);

    if (
        entrancesA.length === 0 ||
        entrancesB.length === 0
    ) {
        throw new Error(
            `Rooms ${a.id} and ${b.id} have no available entrances.`
        );
    }

    let bestDistance = Infinity;

    let bestPairs: [
        RoomEntrance,
        RoomEntrance
    ][] = [];

    for (const entranceA of entrancesA) {
        for (const entranceB of entrancesB) {
            const distance = manhattan(
                entranceA.outside,
                entranceB.outside
            );

            if (distance < bestDistance) {
                bestDistance = distance;
                bestPairs = [[entranceA, entranceB]];
            } else if (distance === bestDistance) {
                bestPairs.push([entranceA, entranceB]);
            }
        }
    }

    return random.pick(bestPairs);
}


interface CandidateConnection {
    from: Room;
    to: Room;
    distance: number;
}

function generateConnections(
    rooms: Room[],
    random: Random,
    extraChance: number,
    configs: RoomConfig[],
    roomMap: Map<string, number>
): RoomConnection[] {
    if (rooms.length < 2) {
        return [];
    }

    const maxConnections = new Map(
        configs.map(config => [
            config.id,
            config.maxConnections
        ])
    );

    const getLimit = (room: Room): number => {
        return maxConnections.get(room.type) ?? 2;
    };

    const getRemaining = (room: Room): number => {
        return getLimit(room) - room.connections.length;
    };

    const candidates: CandidateConnection[] = [];

    for (let i = 0; i < rooms.length; i++) {
        for (let j = i + 1; j < rooms.length; j++) {
            const from = rooms[i]!;
            const to = rooms[j]!;

            const [entranceA, entranceB] =
                findClosestEntrances(
                    from,
                    to,
                    roomMap,
                    random
                );

            candidates.push({
                from,
                to,
                distance: manhattan(
                    entranceA.outside,
                    entranceB.outside
                )
            });
        }
    }


    const parent = new Map<number, number>();

    for (const room of rooms) {
        parent.set(room.id, room.id);
    }

    function find(id: number): number {
        const p = parent.get(id);

        if (p === undefined) {
            throw new Error(
                `Room ${id} not found in connection graph.`
            );
        }

        if (p !== id) {
            const root = find(p);
            parent.set(id, root);

            return root;
        }

        return id;
    }

    function union(a: number, b: number): boolean {
        const rootA = find(a);
        const rootB = find(b);

        if (rootA === rootB) {
            return false;
        }

        parent.set(rootA, rootB);

        return true;
    }


    const connections: RoomConnection[] = [];

    const sortedCandidates = random.shuffle(
        candidates
    ).sort((a, b) => a.distance - b.distance);

    for (const candidate of sortedCandidates) {
        const { from, to } = candidate;

        if (
            getRemaining(from) <= 0 ||
            getRemaining(to) <= 0
        ) {
            continue;
        }

        if (!union(from.id, to.id)) {
            continue;
        }

        from.connections.push(to.id);
        to.connections.push(from.id);

        connections.push({
            from: from.id,
            to: to.id,
            tiles: []
        });

        if (connections.length === rooms.length - 1) {
            break;
        }
    }


    const root = find(rooms[0]!.id);

    const connected = rooms.every(
        room => find(room.id) === root
    );

    if (!connected) {
        throw new Error(
            "Could not connect all rooms. " +
            "Increase maxConnections or dungeon dimensions."
        );
    }


    for (const candidate of random.shuffle(candidates)) {
        const { from, to } = candidate;

        if (
            from.connections.includes(to.id) ||
            getRemaining(from) <= 0 ||
            getRemaining(to) <= 0
        ) {
            continue;
        }

        if (!random.chance(extraChance)) {
            continue;
        }

        from.connections.push(to.id);
        to.connections.push(from.id);

        connections.push({
            from: from.id,
            to: to.id,
            tiles: []
        });
    }

    return connections;
}


function findCorridorPath(
    start: Point,
    end: Point,
    roomMap: Map<string, number>,
    tiles: number[][],
    width: number,
    height: number,
    random: Random
): Point[] | null {
    const startKey = pointKey(start);
    const endKey = pointKey(end);

    const queue: Point[] = [start];

    let queueIndex = 0;

    const visited = new Set<string>([
        startKey
    ]);

    const previous = new Map<string, Point>();

    let found = false;

    while (queueIndex < queue.length) {
        const current = queue[queueIndex++]!;

        if (pointKey(current) === endKey) {
            found = true;
            break;
        }

        const directions = random.shuffle(
            DIRECTIONS
        );

        for (const direction of directions) {
            const next: Point = {
                x: current.x + direction.x,
                y: current.y + direction.y
            };

            if (
                next.x < 1 ||
                next.y < 1 ||
                next.x >= width - 1 ||
                next.y >= height - 1
            ) {
                continue;
            }

            const nextKey = pointKey(next);

            if (visited.has(nextKey)) {
                continue;
            }

            // Never pass through another room.
            if (roomMap.has(nextKey)) {
                continue;
            }

            const tile = getTile(
                tiles,
                next.x,
                next.y
            );

            // Allow existing corridors to be crossed.
            // Never overwrite walls or room interiors.
            if (
                tile !== TileType.Empty &&
                tile !== TileType.Corridor
            ) {
                continue;
            }

            visited.add(nextKey);

            previous.set(
                nextKey,
                current
            );

            queue.push(next);
        }
    }

    if (!found) {
        return null;
    }

    const path: Point[] = [];

    let current: Point | undefined = end;

    while (current !== undefined) {
        path.push(current);

        if (pointKey(current) === startKey) {
            break;
        }

        current = previous.get(
            pointKey(current)
        );
    }

    path.reverse();

    if (
        path.length === 0 ||
        pointKey(path[0]!) !== startKey
    ) {
        return null;
    }

    return path;
}

function carveConnection(
    connection: RoomConnection,
    rooms: Room[],
    roomMap: Map<string, number>,
    tiles: number[][],
    random: Random,
    width: number,
    height: number
): boolean {
    const from = rooms.find(
        room => room.id === connection.from
    );

    const to = rooms.find(
        room => room.id === connection.to
    );

    if (!from || !to) {
        return false;
    }

    const [entranceA, entranceB] =
        findClosestEntrances(
            from,
            to,
            roomMap,
            random
        );

    const path = findCorridorPath(
        entranceA.outside,
        entranceB.outside,
        roomMap,
        tiles,
        width,
        height,
        random
    );

    if (!path) {
        return false;
    }

    setTile(
        tiles,
        entranceA.door.x,
        entranceA.door.y,
        TileType.Door
    );

    setTile(
        tiles,
        entranceB.door.x,
        entranceB.door.y,
        TileType.Door
    );

    for (const point of path) {
        const currentTile = getTile(
            tiles,
            point.x,
            point.y
        );

        if (currentTile === TileType.Empty) {
            setTile(
                tiles,
                point.x,
                point.y,
                TileType.Corridor
            );
        }
    }

    connection.tiles = [
        entranceA.door,
        ...path,
        entranceB.door
    ];

    return true;
}


function generateWalls(
    tiles: number[][],
    width: number,
    height: number
): void {
    const wallCandidates = new Set<string>();

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const tile = getTile(tiles, x, y);

            if (
                tile !== TileType.Floor &&
                tile !== TileType.Door &&
                tile !== TileType.Corridor
            ) {
                continue;
            }

            // Check all neighboring tiles.
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) {
                        continue;
                    }

                    const nx = x + dx;
                    const ny = y + dy;

                    if (
                        nx < 0 ||
                        ny < 0 ||
                        nx >= width ||
                        ny >= height
                    ) {
                        continue;
                    }

                    if (
                        getTile(tiles, nx, ny) ===
                        TileType.Empty
                    ) {
                        wallCandidates.add(`${nx},${ny}`);
                    }
                }
            }
        }
    }

    for (const candidate of wallCandidates) {
        const parts = candidate.split(",");

        const x = Number(parts[0]);
        const y = Number(parts[1]);

        if (
            !Number.isInteger(x) ||
            !Number.isInteger(y)
        ) {
            continue;
        }

        setTile(
            tiles,
            x,
            y,
            TileType.Wall
        );
    }
}

// ============================================================
// CONNECTION GRAPH VALIDATION
// ============================================================

function validateDungeonConnections(
    rooms: Room[],
    connections: RoomConnection[]
): boolean {
    if (rooms.length <= 1) {
        return true;
    }

    const adjacency = new Map<number, number[]>();

    for (const room of rooms) {
        adjacency.set(room.id, []);
    }

    for (const connection of connections) {
        adjacency.get(connection.from)?.push(
            connection.to
        );

        adjacency.get(connection.to)?.push(
            connection.from
        );
    }

    const visited = new Set<number>();

    const queue: number[] = [
        rooms[0]!.id
    ];

    visited.add(rooms[0]!.id);

    let queueIndex = 0;

    while (queueIndex < queue.length) {
        const current = queue[queueIndex++]!;

        const neighbors = adjacency.get(current) ?? [];

        for (const neighbor of neighbors) {
            if (visited.has(neighbor)) {
                continue;
            }

            visited.add(neighbor);
            queue.push(neighbor);
        }
    }

    return visited.size === rooms.length;
}

// ============================================================
// TILE CONNECTIVITY VALIDATION
// ============================================================

function validateTileConnectivity(
    dungeon: GeneratedDungeon
): boolean {
    const {
        tiles,
        width,
        height,
        rooms
    } = dungeon;

    if (rooms.length === 0) {
        return false;
    }

    const spawn = rooms.find(
        room => room.type === "spawn"
    );

    if (!spawn || spawn.tiles.length === 0) {
        return false;
    }

    const start = spawn.tiles[0]!;

    const queue: Point[] = [start];

    const visited = new Set<string>([
        pointKey(start)
    ]);

    let queueIndex = 0;

    while (queueIndex < queue.length) {
        const current = queue[queueIndex++]!;

        for (const direction of DIRECTIONS) {
            const next: Point = {
                x: current.x + direction.x,
                y: current.y + direction.y
            };

            if (
                next.x < 0 ||
                next.y < 0 ||
                next.x >= width ||
                next.y >= height
            ) {
                continue;
            }

            const key = pointKey(next);

            if (visited.has(key)) {
                continue;
            }

            const tile = getTile(
                tiles,
                next.x,
                next.y
            );

            if (
                tile !== TileType.Floor &&
                tile !== TileType.Door &&
                tile !== TileType.Corridor
            ) {
                continue;
            }

            visited.add(key);
            queue.push(next);
        }
    }

    // Every room must be reachable from spawn.
    for (const room of rooms) {
        const reachable = room.tiles.some(
            tile => visited.has(pointKey(tile))
        );

        if (!reachable) {
            return false;
        }
    }

    return true;
}

// ============================================================
// MAIN DUNGEON GENERATOR
// ============================================================

export function generateDungeon(
    options: DungeonGeneratorOptions
): GeneratedDungeon {
    // --------------------------------------------------------
    // 1. Validate options.
    // --------------------------------------------------------

    validateOptions(options);

    const {
        width,
        height,
        floor = 1,
        seed = Date.now(),
        roomConfigs = DEFAULT_ROOM_CONFIGS,
        placementAttempts = 100,
        extraConnectionChance = 0.3
    } = options;

    const random = new Random(seed);

    // --------------------------------------------------------
    // 2. Create empty map.
    // --------------------------------------------------------

    const tiles: number[][] = Array.from(
        { length: height },
        () => Array<number>(width).fill(TileType.Empty)
    );

    // --------------------------------------------------------
    // 3. Generate rooms.
    // --------------------------------------------------------

    const rooms = placeRooms(
        roomConfigs,
        width,
        height,
        random,
        placementAttempts
    );

    if (rooms.length < 2) {
        throw new Error(
            "Dungeon must contain at least two rooms."
        );
    }

    if (!rooms.some(room => room.type === "spawn")) {
        throw new Error(
            "Dungeon must contain a spawn room."
        );
    }

    if (!rooms.some(room => room.type === "boss")) {
        throw new Error(
            "Dungeon must contain a boss room."
        );
    }

    // --------------------------------------------------------
    // 4. Draw rooms and create room lookup map.
    // --------------------------------------------------------

    const roomMap = new Map<string, number>();

    for (const room of rooms) {
        for (const tile of room.tiles) {
            setTile(
                tiles,
                tile.x,
                tile.y,
                TileType.Floor
            );

            roomMap.set(
                pointKey(tile),
                room.id
            );
        }
    }

    // --------------------------------------------------------
    // 5. Generate connection graph.
    // --------------------------------------------------------

    const connections = generateConnections(
        rooms,
        random,
        extraConnectionChance,
        roomConfigs,
        roomMap
    );

    // --------------------------------------------------------
    // 6. Carve corridors.
    // --------------------------------------------------------

    const validConnections: RoomConnection[] = [];

    for (const connection of connections) {
        const success = carveConnection(
            connection,
            rooms,
            roomMap,
            tiles,
            random,
            width,
            height
        );

        if (!success) {
            // Remove failed connection from room graph.
            const from = rooms.find(
                room => room.id === connection.from
            );

            const to = rooms.find(
                room => room.id === connection.to
            );

            if (from) {
                from.connections = from.connections.filter(
                    id => id !== connection.to
                );
            }

            if (to) {
                to.connections = to.connections.filter(
                    id => id !== connection.from
                );
            }

            continue;
        }

        validConnections.push(connection);
    }

    // --------------------------------------------------------
    // 7. Validate room graph.
    // --------------------------------------------------------

    if (
        !validateDungeonConnections(
            rooms,
            validConnections
        )
    ) {
        throw new Error(
            "Dungeon room graph is disconnected. " +
            "Try increasing dungeon dimensions or placementAttempts."
        );
    }

    // --------------------------------------------------------
    // 8. Generate walls.
    // --------------------------------------------------------

    generateWalls(
        tiles,
        width,
        height
    );

    // --------------------------------------------------------
    // 9. Build result.
    // --------------------------------------------------------

    const dungeon: GeneratedDungeon = {
        floor,
        width,
        height,
        tiles,
        rooms,
        connections: validConnections
    };


    if (!validateTileConnectivity(dungeon)) {
        throw new Error(
            "Dungeon contains unreachable rooms. " +
            "Try generating another seed."
        );
    }

    return dungeon;
}

export function printDungeon(
    dungeon: GeneratedDungeon
): void {
    const symbols: Record<number, string> = {
        [TileType.Empty]: " ",
        [TileType.Floor]: ".",
        [TileType.Wall]: "#",
        [TileType.Corridor]: "+",
        [TileType.Door]: "D"
    };

    const output = dungeon.tiles
        .map(row =>
            row.map(tile => symbols[tile] ?? "?").join("")
        )
        .join("\n");

    console.log(output);

    console.log("Floor:", dungeon.floor);
    console.log("Seed: deterministic per generation");
    console.log("Rooms:", dungeon.rooms.length);
    console.log("Connections:", dungeon.connections.length);

    console.table(
        dungeon.rooms.map(room => ({
            id: room.id,
            type: room.type,
            shape: room.shape,
            x: room.x,
            y: room.y,
            width: room.width,
            height: room.height,
            connections: room.connections.length
        }))
    );
}