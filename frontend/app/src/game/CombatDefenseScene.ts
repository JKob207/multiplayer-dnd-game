
import Phaser from 'phaser';

export default class CombatDefenseScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Text;
  private message!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private keys!: any;
  private projectiles: Phaser.GameObjects.Arc[] = [];
  private projectileEvent?: Phaser.Time.TimerEvent;
  private timeLeft = 8;
  private hit = false;
  private bounds = { left: 0, right: 0, top: 160, bottom: 0 };

  constructor() { super('CombatDefenseScene'); }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.timeLeft = 8;
    this.hit = false;
    this.projectiles = [];
    this.bounds = { left: 70, right: width - 70, top: 160, bottom: height - 65 };

    this.add.rectangle(0, 0, width, height, 0x101018).setOrigin(0);
    this.add.text(cx, 40, 'DODGE!', { fontSize: '30px', color: '#fff' }).setOrigin(.5);
    this.message = this.add.text(cx, 90, 'Avoid the incoming projectiles!', { fontSize: '17px', color: '#ccc' }).setOrigin(.5);

    this.add.rectangle(cx, (this.bounds.top + this.bounds.bottom) / 2, this.bounds.right - this.bounds.left, this.bounds.bottom - this.bounds.top, 0x000000);
    const border = this.add.graphics();
    border.lineStyle(3, 0xffffff);
    border.strokeRect(this.bounds.left, this.bounds.top, this.bounds.right - this.bounds.left, this.bounds.bottom - this.bounds.top);

    this.player = this.add.text(cx, this.bounds.bottom - 45, 'o', { fontSize: '32px', color: '#ff4444' }).setOrigin(.5);
    this.timerText = this.add.text(cx, height - 30, 'TIME: 8', { fontSize: '16px', color: '#fff' }).setOrigin(.5);

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT');
    this.projectileEvent = this.time.addEvent({ delay: 350, callback: this.spawnProjectile, callbackScope: this, loop: true });
  }

  private spawnProjectile() {
    const y = Phaser.Math.Between(this.bounds.top + 15, this.bounds.bottom - 15);
    const p = this.add.circle(this.bounds.left + 10, y, 9, 0xe64b4b);
    this.projectiles.push(p);
  }

  update(_time: number, delta: number) {
    const movement = 240 * delta / 1000;

    if (this.keys.A.isDown || this.keys.LEFT.isDown) this.player.x -= movement;
    if (this.keys.D.isDown || this.keys.RIGHT.isDown) this.player.x += movement;
    if (this.keys.W.isDown || this.keys.UP.isDown) this.player.y -= movement;
    if (this.keys.S.isDown || this.keys.DOWN.isDown) this.player.y += movement;

    this.player.x = Phaser.Math.Clamp(this.player.x, this.bounds.left + 15, this.bounds.right - 15);
    this.player.y = Phaser.Math.Clamp(this.player.y, this.bounds.top + 15, this.bounds.bottom - 15);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += 230 * delta / 1000;

      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, p.x, p.y) < 19) {
        this.hit = true;
        this.message.setText('You were hit!');
        this.player.setColor('#888888');
      }

      if (p.x > this.bounds.right + 20) {
        p.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    this.timeLeft -= delta / 1000;
    this.timerText.setText(`TIME: ${Math.max(0, Math.ceil(this.timeLeft))}`);

    if (this.timeLeft <= 0) {
      this.projectileEvent?.remove();
      this.message.setText(this.hit ? 'You were hit by the Cave Slime!' : 'You successfully dodged the attack!');

      this.scene.pause();
      this.time.delayedCall(1000, () => this.scene.start('CombatMenuScene'));
    }
  }
}
