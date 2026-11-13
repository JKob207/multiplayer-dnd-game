
import Phaser from "phaser";
import {
    TileType,
    type GeneratedDungeon
} from "../server/functions/MapGenerator";

export default class DungeonRenderer {
    private scene: Phaser.Scene;
    private tileSize: number;
    private container: Phaser.GameObjects.Container;

    private floorFrames = [0, 1, 2, 7, 8, 9, 0, 0];

    // Replace these indices with your own wall frame mapping.
    private wallFrames = {
        top: 1,
        bottom: 1,
        left: 4,
        right: 4,
        topLeft: 4,
        topRight: 4,
        bottomLeft: 5,
        bottomRight: 5
    };

    private getRandomFrame(x: number, y: number, frames: number[]): number {
    const seed = Math.abs(
        Math.sin(x * 127.1 + y * 311.7) * 43758.5453
    );

    return frames[Math.floor((seed % 1) * frames.length)];
    }
    private getWallFrame(
    dungeon: GeneratedDungeon,
    x: number,
    y: number
): number {
    const isWall = (tx: number, ty: number) =>
        ty >= 0 &&
        ty < dungeon.height &&
        tx >= 0 &&
        tx < dungeon.width &&
        dungeon.tiles[ty][tx] === TileType.Wall;

    const up = isWall(x, y - 1);
    const down = isWall(x, y + 1);
    const left = isWall(x - 1, y);
    const right = isWall(x + 1, y);

    const floorOrEmpty = (tx: number, ty: number) =>
        ty < 0 ||
        ty >= dungeon.height ||
        tx < 0 ||
        tx >= dungeon.width ||
        dungeon.tiles[ty][tx] !== TileType.Wall;

    // Corners: two perpendicular sides exposed.
    if (floorOrEmpty(x, y - 1) && floorOrEmpty(x - 1, y)) {
        return this.wallFrames.topLeft;
    }

    if (floorOrEmpty(x, y - 1) && floorOrEmpty(x + 1, y)) {
        return this.wallFrames.topRight;
    }

    if (floorOrEmpty(x, y + 1) && floorOrEmpty(x - 1, y)) {
        return this.wallFrames.bottomLeft;
    }

    if (floorOrEmpty(x, y + 1) && floorOrEmpty(x + 1, y)) {
        return this.wallFrames.bottomRight;
    }

    if (!up) return this.wallFrames.top;
    if (!down) return this.wallFrames.bottom;
    if (!left) return this.wallFrames.left;
    if (!right) return this.wallFrames.right;

    return this.wallFrames.top;
}

    constructor(scene: Phaser.Scene, tileSize = 32) {
        this.scene = scene;
        this.tileSize = tileSize;

        this.container = scene.add.container(0, 0);
        this.container.setDepth(0);
    }

    render(
    dungeon: GeneratedDungeon,
    walls: Phaser.Physics.Arcade.StaticGroup
    ) {
        this.container.removeAll(true);
        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const tile = dungeon.tiles[y][x];

                if (tile === TileType.Empty) continue;

                if (tile === TileType.Floor || tile === TileType.Corridor || tile === TileType.Door) {
                    const frame = this.getRandomFrame(x, y, this.floorFrames);

                    const floor = this.scene.add.image(
                        (x + 0.5) * this.tileSize,
                        (y + 0.5) * this.tileSize,
                        'dungeon-floors',
                        frame
                    );

                    floor.setDisplaySize(this.tileSize, this.tileSize);
                    this.container.add(floor);
                }

            if (tile === TileType.Wall) {
                const frame = this.getWallFrame(dungeon, x, y);

                const wallSprite = this.scene.add.image(
                    (x + 0.5) * this.tileSize,
                    (y + 0.5) * this.tileSize,
                    'dungeon-walls',
                    frame
                );

                wallSprite.setDisplaySize(this.tileSize, this.tileSize);
                this.container.add(wallSprite);

                const wall = walls.create(
                    (x + 0.5) * this.tileSize,
                    (y + 0.5) * this.tileSize
                );

                wall.setVisible(false);
                wall.setDisplaySize(this.tileSize, this.tileSize);
                wall.body.setSize(this.tileSize, this.tileSize);
                wall.setOrigin(0.5, 0.5);
                wall.refreshBody();
            }
                if (tile === TileType.Door) {
            const door = this.scene.add.image(
                (x + 0.5) * this.tileSize,
                (y + 0.5) * this.tileSize,
                'dungeon-utilities',
                28
            );

            door.setDisplaySize(this.tileSize, this.tileSize);
            this.container.add(door);
        }
                        }
                    }
                }

                destroy() {
                    this.container.destroy();
    }
}
