import Phaser from 'phaser';
import Monster from './Monster';

export default class Zombie extends Monster {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    this.coneColor = 0xff3333;
    this.bodyVisual.setTexture('zombie', 0);

    
  }

  die() {
    if (!this.active) return;

    this.bodyVisual.anims.play("zombie-death", true);

    this.bodyVisual.once(
        Phaser.Animations.Events.ANIMATION_COMPLETE,
        () => {
            this.destroy();
        }
    );
}

  update() {
    if (!this.active || !this.bodyVisual?.active) return;

    super.update();

    this.bodyVisual.anims.play(
        `zombie-idle-${this.facingDirection}`,
        true
    );
}

}