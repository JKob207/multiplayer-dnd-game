
import Phaser from 'phaser';

export default class CombatAttackScene extends Phaser.Scene {
  private hand!: Phaser.GameObjects.Line;
  private message!: Phaser.GameObjects.Text;
  private handAngle = 0;
  private targetAngle = 0;
  private attackKey!: Phaser.Input.Keyboard.Key;

  constructor() { super('CombatAttackScene'); }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2, cy = height / 2 - 20, radius = 105;

    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
    this.add.text(cx, 45, 'TIME YOUR ATTACK!', { fontSize: '28px', color: '#fff' }).setOrigin(.5);

    const ring = this.add.graphics();
    ring.lineStyle(12, 0x777777);
    ring.strokeCircle(cx, cy, radius);

    this.targetAngle = Phaser.Math.FloatBetween(0, Math.PI * 2);

    for (const [color, degrees] of [[0xe6c542, 50], [0x55cc77, 20]] as const) {
      ring.lineStyle(14, color);
      ring.beginPath();
      ring.arc(cx, cy, radius, this.targetAngle - Math.PI / 2 - Phaser.Math.DegToRad(degrees) / 2, this.targetAngle - Math.PI / 2 + Phaser.Math.DegToRad(degrees) / 2);
      ring.strokePath();
    }

    this.add.circle(cx, cy, 6, 0xffffff);
    this.hand = this.add.line(cx, cy, 0, 0, 0, -radius, 0xffffff).setOrigin(0, 0).setLineWidth(4);
    this.handAngle = Math.PI;
    this.hand.setRotation(this.handAngle);

    this.message = this.add.text(cx, height - 85, 'PRESS SPACE TO STOP THE HAND!', { fontSize: '16px', color: '#fff' }).setOrigin(.5);
    this.attackKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update(_time: number, delta: number) {
    this.handAngle = (this.handAngle + delta / 2200 * Math.PI * 6) % (Math.PI * 2);
    this.hand.setRotation(this.handAngle);

    if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      const degrees = Phaser.Math.RadToDeg(Math.abs(Phaser.Math.Angle.Wrap(this.handAngle - this.targetAngle)));
      const result = degrees <= 10 ? 'PERFECT' : degrees <= 25 ? 'GOOD' : 'MISS';

      this.message.setText(result);
      this.scene.pause();
      this.time.delayedCall(1200, () => this.scene.start('CombatDefenseScene'));
    }
  }
}
