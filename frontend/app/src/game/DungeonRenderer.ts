
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

    render(dungeon: GeneratedDungeon) {
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
            }
        }
    }

    destroy() {
        this.container.destroy();
    }
}
