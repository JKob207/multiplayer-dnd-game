
import Phaser from 'phaser';

const TILE_SIZE = 32;
const MAP_WIDTH = 25;
const MAP_HEIGHT = 18;

export default class DungeonScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private zombie!: Phaser.GameObjects.Arc;
  private visionCone!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private combatStarted = false;

  constructor() {
    super('DungeonScene');
  }

  private drawVisionCone() {
    if (!this.zombie?.active) return;

    const range = 250, halfAngle = Math.PI / 4;
    this.visionCone.clear().fillStyle(0xff3333, 0.18).beginPath();
    this.visionCone.moveTo(this.zombie.x, this.zombie.y);

    for (let i = 0; i <= 30; i++) {
      const angle = -halfAngle + i / 30 * halfAngle * 2;
      this.visionCone.lineTo(
        this.zombie.x + Math.cos(angle) * range,
        this.zombie.y + Math.sin(angle) * range
      );
    }

    this.visionCone.closePath().fillPath();
  }

  private createZombie() {
    this.zombie = this.add.circle(400, 300, 18, 0x35c759).setDepth(3);
    this.visionCone = this.add.graphics().setDepth(2);
    this.drawVisionCone();

    this.physics.add.existing(this.zombie, true);

    this.physics.add.overlap(this.player, this.zombie, () => {
      if (this.combatStarted) return;

      this.combatStarted = true;
      this.scene.pause();
      this.scene.launch('CombatMenuScene');
    });
  }

  create() {
    const graphics = this.make.graphics({ x: 0, y: 0 });

    graphics.fillStyle(0x38363b).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.generateTexture('floor', TILE_SIZE, TILE_SIZE);

    graphics.clear().fillStyle(0x171619).fillRect(0, 0, TILE_SIZE, TILE_SIZE);
    graphics.lineStyle(2, 0x49454b).strokeRect(1, 1, TILE_SIZE - 2, TILE_SIZE - 2);
    graphics.generateTexture('wall', TILE_SIZE, TILE_SIZE);

    graphics.clear().fillStyle(0xc99b65).fillRect(5, 5, 22, 22);
    graphics.lineStyle(2, 0x30251e).strokeRect(5, 5, 22, 22);
    graphics.generateTexture('player', TILE_SIZE, TILE_SIZE);
    graphics.destroy();

    const walls = this.physics.add.staticGroup();

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const px = x * TILE_SIZE + TILE_SIZE / 2;
        const py = y * TILE_SIZE + TILE_SIZE / 2;

        if (!x || !y || x === MAP_WIDTH - 1 || y === MAP_HEIGHT - 1)
          walls.create(px, py, 'wall');
        else
          this.add.image(px, py, 'floor');
      }
    }

    this.player = this.physics.add.sprite(TILE_SIZE * 4, TILE_SIZE * 4, 'player');
    this.player.setCollideWorldBounds(true).setDepth(1);
    this.physics.add.collider(this.player, walls);

    this.createZombie();

    this.events.once('enemy-defeated', () => {
      this.zombie.destroy();
      this.visionCone.destroy();
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys('W,A,S,D') as typeof this.wasd;

    this.add.text(12, 12, 'WASD / Arrow Keys to move', {
      fontSize: '16px',
      color: '#f5f3ee',
      backgroundColor: '#171619',
      padding: { x: 8, y: 6 }
    }).setScrollFactor(0).setDepth(10);
  }

  update() {
    if (!this.player || !this.cursors || !this.wasd) return;

    this.drawVisionCone();

    const speed = 160;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    if (this.cursors.left.isDown || this.wasd.A.isDown) body.setVelocityX(-speed);
    else if (this.cursors.right.isDown || this.wasd.D.isDown) body.setVelocityX(speed);

    if (this.cursors.up.isDown || this.wasd.W.isDown) body.setVelocityY(-speed);
    else if (this.cursors.down.isDown || this.wasd.S.isDown) body.setVelocityY(speed);

    body.velocity.normalize().scale(speed);
  }
}
