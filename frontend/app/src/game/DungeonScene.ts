
import Phaser from 'phaser';

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;

export default class DungeonScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super('DungeonScene');
  }

  create() {
    // Create simple placeholder textures.
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0x38363b);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('floor', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0x171619);
    graphics.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(2, 0x49454b);
    graphics.strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
    graphics.generateTexture('wall', TILE_SIZE, TILE_SIZE);

    graphics.clear();
    graphics.fillStyle(0xc99b65);
    graphics.fillRect(5, 5, 22, 22);
    graphics.lineStyle(2, 0x30251e);
    graphics.strokeRect(5, 5, 22, 22);
    graphics.generateTexture('player', TILE_SIZE, TILE_SIZE);

    graphics.destroy();

    // Draw the dungeon floor and walls.
    const walls = this.physics.add.staticGroup();

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const isWall =
          x === 0 ||
          y === 0 ||
          x === MAP_WIDTH - 1 ||
          y === MAP_HEIGHT - 1;

        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;

        if (isWall) {
          walls.create(px, py, 'wall');
        } else {
          this.add.image(px, py, 'floor');
        }
      }
    }

    // Add a player inside the room.
    this.player = this.physics.add.sprite(
      TILE_SIZE * 4,
      TILE_SIZE * 4,
      'player'
    );

    this.player.setCollideWorldBounds(true);
    this.player.setDepth(1);

    this.physics.add.collider(this.player, walls);

    // Keyboard controls.
    if (!this.input.keyboard) return;

    this.cursors = this.input.keyboard.createCursorKeys();

    this.wasd = this.input.keyboard.addKeys(
      'W,A,S,D'
    ) as typeof this.wasd;

    this.add.text(12, 12, 'WASD / Arrow Keys to move', {
      fontSize: '16px',
      color: '#f5f3ee',
      backgroundColor: '#171619',
      padding: { x: 8, y: 6 },
    }).setScrollFactor(0).setDepth(2);
  }

  update() {
    if (!this.player || !this.cursors || !this.wasd) return;

    const speed = 160;
    const body = this.player.body as Phaser.Physics.Arcade.Body;

    body.setVelocity(0);

    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      body.setVelocityX(-speed);
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      body.setVelocityX(speed);
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      body.setVelocityY(-speed);
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      body.setVelocityY(speed);
    }

    body.velocity.normalize().scale(speed);
  }
}
