import Phaser from 'phaser';

export default class CombatMenuScene extends Phaser.Scene {
  constructor() { super('CombatMenuScene'); }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
    this.add.text(cx, 45, 'ENCOUNTER!', { fontSize: '32px', color: '#fff' }).setOrigin(.5);
    this.add.text(cx, 95, 'What will you do?', { fontSize: '20px', color: '#fff' }).setOrigin(.5);

    const button = (x: number, label: string, color: number, callback: () => void) => {
      const b = this.add.rectangle(x, height - 90, 170, 52, color).setInteractive({ useHandCursor: true });
      this.add.text(x, height - 90, label, { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(.5);
      b.on('pointerdown', callback);
    };

    button(cx - 185, 'ATTACK', 0xa83232, () => this.scene.start('CombatAttackScene'));
    button(cx, 'ITEM', 0x278447, () => this.showSubmenu('ITEM'));
    button(cx + 185, 'ACT', 0x326db0, () => this.showSubmenu('ACT'));

    this.add.text(cx, height - 155, 'Choose your action.', { fontSize: '18px', color: '#fff' }).setOrigin(.5);
    this.add.text(35, 35, 'Player\nHP: 20 / 20', { fontSize: '18px', color: '#75ff75' });
    this.add.text(width - 210, 35, 'Cave Slime\nHP: 20 / 20', { fontSize: '18px', color: '#75ff75' });
  }

  private showSubmenu(choice: 'ITEM' | 'ACT') {
    this.children.removeAll(true);
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0);
    this.add.text(cx, 100, choice, { fontSize: '30px', color: '#fff' }).setOrigin(.5);
    this.add.text(cx, 190, choice === 'ITEM' ? 'Your inventory is empty for now.' : 'No special abilities available yet.', { fontSize: '18px', color: '#ccc' }).setOrigin(.5);

    const b = this.add.rectangle(cx, height - 90, 170, 52, 0x555555).setInteractive();
    this.add.text(cx, height - 90, 'BACK', { fontSize: '20px', color: '#fff' }).setOrigin(.5);
    b.on('pointerdown', () => this.scene.restart());
  }
}
