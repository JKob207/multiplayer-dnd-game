import Phaser from 'phaser';
import Monster from './Monster';

export default class Zombie extends Monster {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    
    this.coneColor = 0xff3333;
    this.bodyVisual.setTexture('zombie', 0);
    
  }

  update() {
  super.update();

  this.bodyVisual.anims.play(`zombie-idle-${this.facingDirection}`, true)
}

}