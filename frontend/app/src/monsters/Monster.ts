import Phaser from 'phaser';

export default class Monster extends Phaser.GameObjects.Container {
  protected visionCone: Phaser.GameObjects.Graphics;
  protected bodyVisual: Phaser.GameObjects.Sprite;

  protected targetX: number;
  protected targetY: number;
  protected MonsterAngle = 0;
  protected facingDirection: 'up' | 'down' | 'left' | 'right' = 'right';

  protected mode: "idle" | "chasing" | "engaged" = "idle";

  protected visionRange = 150;
  protected visionAngle = Math.PI / 6;
  protected coneColor = 0xff3333;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.targetX = x;
    this.targetY = y;

    scene.add.existing(this);

    this.visionCone = scene.add.graphics();
    this.bodyVisual = scene.add.sprite(0, 0, 'zombie', 0);
    this.add([this.visionCone, this.bodyVisual]);

    this.setDepth(3);
    this.drawVisionCone();
  }

  setServerState(state: {
    x: number;
    y: number;
    angle: number;
    mode: "idle" | "chasing" | "engaged";
  }) {
    this.targetX = state.x;
    this.targetY = state.y;
    this.MonsterAngle = state.angle;
    this.mode = state.mode;
  }

  private drawVisionCone() {
    const steps = 30;

    this.visionCone.clear();
    this.visionCone.fillStyle(this.coneColor, 0.18);
    this.visionCone.beginPath();
    this.visionCone.moveTo(0, 0);

    for (let i = 0; i <= steps; i++) {
      const angle =
        this.MonsterAngle - this.visionAngle +
        (i / steps) * this.visionAngle * 2;

      this.visionCone.lineTo(
        Math.cos(angle) * this.visionRange,
        Math.sin(angle) * this.visionRange
      );
    }

    this.visionCone.closePath();
    this.visionCone.fillPath();
  }

  update() {
    if (this.mode !== "engaged") {
      this.x = Phaser.Math.Linear(this.x, this.targetX, 0.15);
      this.y = Phaser.Math.Linear(this.y, this.targetY, 0.15);
    }

    this.drawVisionCone();
  }
}