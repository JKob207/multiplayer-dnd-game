
import Phaser from "phaser";
import {
    TileType,
    type GeneratedDungeon
} from "../../../../server/functions/MapGenerator";

export default class DungeonRenderer {
    private scene: Phaser.Scene;
    private tileSize: number;
    private container: Phaser.GameObjects.Container;

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

        const colors: Record<number, number> = {
            [TileType.Floor]: 0x777777,
            [TileType.Wall]: 0x303030,
            [TileType.Corridor]: 0x666666,
            [TileType.Door]: 0x8b5a2b,
        };

        for (let y = 0; y < dungeon.height; y++) {
            for (let x = 0; x < dungeon.width; x++) {
                const tile = dungeon.tiles[y][x];

                if (tile === TileType.Empty) continue;

                const rectangle = this.scene.add.rectangle(
                x * this.tileSize,
                y * this.tileSize,
                this.tileSize,
                this.tileSize,
                colors[tile] ?? 0xff00ff
            );

            rectangle.setOrigin(0, 0);
            this.container.add(rectangle);

            if (tile === TileType.Wall) {
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
                        }
                    }
                }

                destroy() {
                    this.container.destroy();
    }
}
