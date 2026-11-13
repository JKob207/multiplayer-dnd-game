import Phaser from 'phaser';

export default class Monster extends Phaser.GameObjects.Container {
  protected visionCone: Phaser.GameObjects.Graphics;
  protected bodyVisual: Phaser.GameObjects.Sprite;

  protected targetX: number;
  protected targetY: number;
  protected MonsterAngle = 0;
  protected facingDirection: 'up' | 'down' | 'left' | 'right' = 'right';

  protected mode: "idle" | "chasing" | "engaged" | "dead" = "idle";

  protected visionRange = 150;
  protected visionAngle = Math.PI / 6;
  protected coneColor = 0xff3333;

  protected nameText: Phaser.GameObjects.Text;
  
  setMonsterName(name: string) {
    this.nameText.setText(name);
}

  setInitialDirection(angle: number) {
    const directions: Record<number, 'up' | 'left' | 'down' | 'right'> = {
        0: 'right',
        90: 'down',
        180: 'left',
        270: 'up'
    };

    const coneAngles: Record<number, number> = {
        0: 0,          // right
        90: Math.PI / 2,     // down
        180: Math.PI,              // left
        270: -Math.PI / 2    // up
    };

    this.facingDirection = directions[angle] ?? 'down';

    this.bodyVisual.anims.play(
        `zombie-idle-${this.facingDirection}`,
        true
    );

    this.MonsterAngle = coneAngles[angle] ?? 0;
    this.drawVisionCone();
}
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);

    this.targetX = x;
    this.targetY = y;

    scene.add.existing(this);

    this.visionCone = scene.add.graphics();
    this.bodyVisual = scene.add.sprite(0, 0, 'zombie-idle', 0);
    this.add([this.visionCone, this.bodyVisual]);
    this.nameText = scene.add.text(0, -28, "Zombie", {
    fontSize: "12px",
    color: "#ffffff",
    stroke: "#000000",
    strokeThickness: 3
});

this.nameText.setOrigin(0.5);
this.add(this.nameText);

  this.nameText.setOrigin(0.5);
  this.add(this.nameText);

    this.setDepth(3);
  }

  

  setServerState(state: {
    x: number;
    y: number;
    angle: number;
    mode: "idle" | "chasing" | "engaged" | "dead";
  }) {
    this.targetX = state.x;
    this.targetY = state.y;
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