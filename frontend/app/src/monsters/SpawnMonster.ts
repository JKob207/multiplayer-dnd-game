import Phaser from 'phaser';
import Monster from './Monster';

type MonsterClass<T extends Monster> = new (
  scene: Phaser.Scene,
  x: number,
  y: number
) => T;

export function spawnMonster<T extends Monster>(
    scene: Phaser.Scene,
    MonsterType: MonsterClass<T>,
    x: number,
    y: number,
    angle: number
): T {
    const monster = new MonsterType(scene, x, y);
    monster.setInitialDirection(angle);
    return monster;
}