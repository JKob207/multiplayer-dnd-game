import type { EnemyData } from './DungeonScene';
import Phaser from 'phaser';

const UI_STYLE = {
  fontFamily: '"Trebuchet MS", sans-serif',

  title: {
    fontSize: '22px',
    color: '#ffffff',
    fontFamily: '"Trebuchet MS", sans-serif',
  },

  normal: {
    fontSize: '18px',
    color: '#ffffff',
    fontFamily: '"Trebuchet MS", sans-serif',
  },

  small: {
    fontSize: '15px',
    color: '#cccccc',
    fontFamily: '"Trebuchet MS", sans-serif',
  },

  hp: {
    fontSize: '15px',
    color: '#75ff75',
    fontFamily: '"Trebuchet MS", sans-serif',
  },
};



type AttackResult = 'PERFECT' | 'GOOD' | 'MISS';

function calculateDamage(result: AttackResult): number {
  switch (result) {
    case 'PERFECT':
      return 15;
    case 'GOOD':
      return 10;
    case 'MISS':
      return 5;
  }
}

export default class CombatScene extends Phaser.Scene {
  
  private centerX = 0;
  private centerY = 0;

  // Attack minigame
  private hand!: Phaser.GameObjects.Line;
  private message!: Phaser.GameObjects.Text;
  private handAngle = 0;
  private targetAngle = 0;
  private attackActive = false;
  private menuActive = false;
  private attackKey!: Phaser.Input.Keyboard.Key;

  // Dodge phase
  private dodgeActive = false;
  private dodgePlayer!: Phaser.GameObjects.Text;
  private dodgeMessage!: Phaser.GameObjects.Text;
  private dodgeTimerText!: Phaser.GameObjects.Text;
  private dodgeKeys!: {
    up: Phaser.Input.Keyboard.Key;
    down: Phaser.Input.Keyboard.Key;
    left: Phaser.Input.Keyboard.Key;
    right: Phaser.Input.Keyboard.Key;
    w: Phaser.Input.Keyboard.Key;
    a: Phaser.Input.Keyboard.Key;
    s: Phaser.Input.Keyboard.Key;
    d: Phaser.Input.Keyboard.Key;
  };

  private projectiles: {
    object: Phaser.GameObjects.Arc;
    vx: number;
    vy: number;
  }[] = [];

  private projectileEvent?: Phaser.Time.TimerEvent;
  private dodgeTime = 0;
  private hasBeenHit = false;

  private arenaBounds = {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  };

  private monsterHpText!: Phaser.GameObjects.Text;
  private enemy!: EnemyData;
  private monsterNameText!: Phaser.GameObjects.Text;

  constructor() {
    super('CombatScene');
  }

  create(data: { enemy: EnemyData }) {
  this.enemy = data.enemy;

  console.log('Received enemy:', this.enemy);
    const { width, height } = this.scale;

    this.centerX = width / 2;
    this.centerY = height / 2;

    this.showMenu();
    

    if (this.input.keyboard) {
      this.attackKey = this.input.keyboard.addKey(
        Phaser.Input.Keyboard.KeyCodes.SPACE
      );

      this.dodgeKeys = this.input.keyboard.addKeys({
        up: 'W',
        down: 'S',
        left: 'A',
        right: 'D',
        w: 'UP',
        a: 'LEFT',
        s: 'DOWN',
        d: 'RIGHT',
      }) as typeof this.dodgeKeys;
    }

    this.events.once('shutdown', () => {
      this.attackActive = false;
      this.dodgeActive = false;
      this.stopProjectileSpawner();
    });
  }

  update(_time: number, delta: number) {
    // Attack timing minigame
    if (this.attackActive) {
      this.handAngle += (delta / 2200) * Math.PI * 6;
      this.handAngle %= Math.PI * 2;

      this.hand.setRotation(this.handAngle);

      if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
        this.checkAttackTiming();
      }
    }

    // Dodge phase
    if (this.dodgeActive) {
      this.updateDodge(delta);
    }
  }

  private makeButton(
    x: number,
    y: number,
    label: string,
    color: number,
    callback: () => void
  ) {
    const button = this.add.rectangle(
      x, y, 170, 52, color
    ).setInteractive({ useHandCursor: true });

    const text = this.add.text(x, y, label, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: '"Trebuchet MS", sans-serif'
    }).setOrigin(0.5);

    button.on('pointerover', () => button.setAlpha(0.75));
    button.on('pointerout', () => button.setAlpha(1));
    button.on('pointerdown', () => {
      if (!this.menuActive) return;

      this.menuActive = false;
      callback();
    });

    return this.add.container(0, 0, [button, text]);
  }

  private createStatusPanels() {
  const { width } = this.scale;

  // PLAYER PANEL — LEFT
  const playerPanel = this.add.container(35, 35);

  const playerBox = this.add.rectangle(
    0, 0, 210, 85, 0x222222
  ).setOrigin(0, 0);

  const playerIcon = this.add.text(
    12, 15, '🧍', { fontSize: '28px' }
  );

    const playerName = this.add.text(
    55, 12, 'Player',
    UI_STYLE.normal
  );

    const playerHp = this.add.text(
    55, 42, 'HP: 20 / 20',
    UI_STYLE.hp
  );

  playerPanel.add([
    playerBox,
    playerIcon,
    playerName,
    playerHp
  ]);

  // MONSTER PANEL — RIGHT
  const monsterPanel = this.add.container(width - 245, 35);

  const monsterBox = this.add.rectangle(
    0, 0, 210, 85, 0x222222
  ).setOrigin(0, 0);

  const monsterIcon = this.add.circle(
    28, 29, 15, 0x35c759
  );

  this.monsterNameText = this.add.text(
  55, 12, this.enemy.name,
  UI_STYLE.normal
);

  this.monsterHpText = this.add.text(
  55, 42,
  `HP: ${this.enemy.hp} / ${this.enemy.maxHp}`,
  UI_STYLE.hp
);

  monsterPanel.add([
    monsterBox,
    monsterIcon,
    this.monsterNameText,
    this.monsterHpText
  ]);
}

  private showMenu() {
    this.attackActive = false;
    this.dodgeActive = false;
    this.menuActive = true;
    this.stopProjectileSpawner();

    this.children.removeAll(true);
    this.projectiles = [];

    const { width, height } = this.scale;

    this.add.rectangle(
      0, 0, width, height, 0x000000, 1
    ).setOrigin(0);

    this.add.text(this.centerX, 45, 'ENCOUNTER!', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
      fontFamily: '"Trebuchet MS", sans-serif',
      
    }).setOrigin(0.5);

    this.add.text(this.centerX, 95, 'What will you do?', {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: '"Trebuchet MS", sans-serif',
    }).setOrigin(0.5);

    this.add.container(0, 0, [
      this.makeButton(
        this.centerX - 185, height - 90,
        'ATTACK', 0xa83232,
        () => this.showAttack()
      ),
      this.makeButton(
        this.centerX, height - 90,
        'ITEM', 0x278447,
        () => this.showSubmenu('ITEM')
      ),
      this.makeButton(
        this.centerX + 185, height - 90,
        'ACT', 0x326db0,
        () => this.showSubmenu('ACT')
      )
    ]);

    this.add.text(
      this.centerX, height - 155,
      'Choose your action.',
      UI_STYLE.normal
      
    ).setOrigin(0.5);

    this.createStatusPanels();
  }

  private showSubmenu(choice: 'ITEM' | 'ACT') {
    this.menuActive = true;
    this.children.removeAll(true);

    const { width, height } = this.scale;

    this.add.rectangle(
      0, 0, width, height, 0x000000, 0.85
    ).setOrigin(0);

    this.add.text(this.centerX, 100, choice, {
      fontSize: '30px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const description = choice === 'ITEM'
      ? 'Your inventory is empty for now.'
      : 'No special abilities available yet.';

    this.add.text(this.centerX, 190, description, {
      fontSize: '18px',
      color: '#cccccc',
    }).setOrigin(0.5);

    this.makeButton(
      this.centerX, height - 90,
      'BACK', 0x555555,
      () => this.showMenu()
    );
  }

  private showAttack() {
    this.children.removeAll(true);
    this.menuActive = false;

    const { width, height } = this.scale;
    const cx = this.centerX;
    const cy = this.centerY - 20;
    const radius = 105;

    this.add.rectangle(
      0, 0, width, height, 0x000000, 0.9
    ).setOrigin(0);

    this.add.text(cx, 45, 'TIME YOUR ATTACK!', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const ring = this.add.graphics();

    ring.lineStyle(12, 0x777777, 1);
    ring.strokeCircle(cx, cy, radius);

    this.targetAngle = Phaser.Math.FloatBetween(
      0, Math.PI * 2
    );

    const perfectWidth = Phaser.Math.DegToRad(20);
    const goodWidth = Phaser.Math.DegToRad(50);

    // Yellow GOOD zone
    ring.lineStyle(14, 0xe6c542, 1);
    ring.beginPath();
    ring.arc(
      cx, cy, radius,
      this.targetAngle - Math.PI / 2 - goodWidth / 2,
      this.targetAngle - Math.PI / 2 + goodWidth / 2,
      false
    );
    ring.strokePath();

    // Green PERFECT zone
    ring.lineStyle(14, 0x55cc77, 1);
    ring.beginPath();
    ring.arc(
      cx, cy, radius,
      this.targetAngle - Math.PI / 2 - perfectWidth / 2,
      this.targetAngle - Math.PI / 2 + perfectWidth / 2,
      false
    );
    ring.strokePath();

    this.add.circle(cx, cy, 6, 0xffffff);

    this.hand = this.add.line(
      cx, cy,
      0, 0,
      0, -radius,
      0xffffff
    ).setOrigin(0, 0).setLineWidth(4);

    this.handAngle = Phaser.Math.DegToRad(180);
    this.hand.setRotation(this.handAngle);

    this.message = this.add.text(
      cx, height - 85,
      'PRESS SPACE TO STOP THE HAND!',
      { fontSize: '16px', color: '#ffffff' }
    ).setOrigin(0.5);

    this.attackActive = true;
  }

  private checkAttackTiming() {
    if (!this.attackActive) return;

    this.attackActive = false;

    const difference = Math.abs(
      Phaser.Math.Angle.Wrap(
        this.handAngle - this.targetAngle
      )
    );

    const degrees = Phaser.Math.RadToDeg(difference);

    let result: AttackResult;

    if (degrees <= 10) {
      result = 'PERFECT';
    } else if (degrees <= 25) {
      result = 'GOOD';
    } else {
      result = 'MISS';
    }
    this.dealDamage(result);

    if (this.enemy.hp <= 0) return;

    this.message.setText(result);

    this.time.delayedCall(1500, () => {
      this.showEnemyTurn();
    });
  }

  // --------------------------------
  // ENEMY TURN
  // --------------------------------

  private showEnemyTurn() {
    this.children.removeAll(true);
    this.menuActive = false;

    const { width, height } = this.scale;

    this.add.rectangle(
      0, 0, width, height, 0x000000, 0.9
    ).setOrigin(0);

    this.add.text(
      this.centerX, 45,
      'ENEMY TURN',
      {
        fontSize: '30px',
        color: '#e6c542',
        fontStyle: 'bold',
      }
    ).setOrigin(0.5);

    this.add.rectangle(
      this.centerX, 125,
      width - 80, 90,
      0x252525
    );

    this.add.text(
      this.centerX, 125,
      'The monster attacks!',
      {
        fontSize: '19px',
        color: '#ffffff',
        align: 'center',
      }
    ).setOrigin(0.5);

    this.time.delayedCall(1800, () => {
      this.showDodgeArena();
    });
  }

  private dealDamage(result: AttackResult) {
  const damage = calculateDamage(result);

  this.enemy.hp = Math.max(0, this.enemy.hp - damage);

  this.monsterHpText.setText(
    `HP: ${this.enemy.hp} / ${this.enemy.maxHp}`
  );

  console.log(
    `${result}! ${this.enemy.name} took ${damage} damage.`
  );

  if (this.enemy.hp <= 0) {
    this.monsterDefeated();
  }
}

  // --------------------------------
  // DODGE ARENA
  // --------------------------------

  private showDodgeArena() {
    this.children.removeAll(true);
    this.projectiles = [];

    const { width, height } = this.scale;

    this.dodgeTime = 8;
    this.hasBeenHit = false;

    this.arenaBounds = {
      left: 70,
      right: width - 70,
      top: 160,
      bottom: height - 65,
    };

    this.add.rectangle(
      0, 0, width, height, 0x101018
    ).setOrigin(0);

    this.add.text(
      this.centerX, 40,
      'DODGE!',
      {
        fontSize: '30px',
        color: '#ffffff',
        fontStyle: 'bold',
      }
    ).setOrigin(0.5);

    this.dodgeMessage = this.add.text(
      this.centerX, 90,
      'Avoid the incoming projectiles!',
      {
        fontSize: '17px',
        color: '#cccccc',
      }
    ).setOrigin(0.5);

    // Arena background and border
    this.add.rectangle(
      this.centerX,
      (this.arenaBounds.top + this.arenaBounds.bottom) / 2,
      this.arenaBounds.right - this.arenaBounds.left,
      this.arenaBounds.bottom - this.arenaBounds.top,
      0x202b40
    );

    const border = this.add.graphics();
    border.lineStyle(3, 0xffffff, 1);
    border.strokeRect(
      this.arenaBounds.left,
      this.arenaBounds.top,
      this.arenaBounds.right - this.arenaBounds.left,
      this.arenaBounds.bottom - this.arenaBounds.top
    );

    // Player's heart
    this.dodgePlayer = this.add.text(
      this.centerX,
      this.arenaBounds.bottom - 45,
      '𔘓',
      {
        fontSize: '32px',
        color: '#ff4444',
      }
    ).setOrigin(0.5);

    this.dodgeTimerText = this.add.text(
      this.centerX, height - 30,
      'TIME: 8',
      {
        fontSize: '16px',
        color: '#ffffff',
      }
    ).setOrigin(0.5);

    this.dodgeActive = true;

    // Spawn projectiles periodically
    this.projectileEvent = this.time.addEvent({
      delay: 350,
      callback: this.spawnProjectile,
      callbackScope: this,
      loop: true,
    });
  }

  private spawnProjectile() {
    if (!this.dodgeActive) return;

    const y = Phaser.Math.Between(
      this.arenaBounds.top + 15,
      this.arenaBounds.bottom - 15
    );

    const projectile = this.add.circle(
      this.arenaBounds.left + 10,
      y,
      9,
      0xe64b4b
    );

    this.projectiles.push({
      object: projectile,
      vx: 230,
      vy: 0,
    });
  }

  private updateDodge(delta: number) {
    const speed = 240;
    const movement = speed * (delta / 1000);

    // Keyboard movement
    if (
      this.dodgeKeys.left.isDown ||
      this.dodgeKeys.a.isDown
    ) {
      this.dodgePlayer.x -= movement;
    }

    if (
      this.dodgeKeys.right.isDown ||
      this.dodgeKeys.d.isDown
    ) {
      this.dodgePlayer.x += movement;
    }

    if (
      this.dodgeKeys.up.isDown ||
      this.dodgeKeys.w.isDown
    ) {
      this.dodgePlayer.y -= movement;
    }

    if (
      this.dodgeKeys.down.isDown ||
      this.dodgeKeys.s.isDown
    ) {
      this.dodgePlayer.y += movement;
    }

    // Keep player inside the arena
    this.dodgePlayer.x = Phaser.Math.Clamp(
      this.dodgePlayer.x,
      this.arenaBounds.left + 15,
      this.arenaBounds.right - 15
    );

    this.dodgePlayer.y = Phaser.Math.Clamp(
      this.dodgePlayer.y,
      this.arenaBounds.top + 15,
      this.arenaBounds.bottom - 15
    );

    // Move projectiles and check collisions
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];

      projectile.object.x += projectile.vx * (delta / 1000);
      projectile.object.y += projectile.vy * (delta / 1000);

      const distance = Phaser.Math.Distance.Between(
        this.dodgePlayer.x,
        this.dodgePlayer.y,
        projectile.object.x,
        projectile.object.y
      );

      if (distance < 19 && !this.hasBeenHit) {
        this.hasBeenHit = true;

        this.dodgeMessage.setText(
          'You were hit!'
        );

        this.dodgePlayer.setColor('#888888');
      }

      // Remove projectiles outside the arena
      if (
        projectile.object.x > this.arenaBounds.right + 20
      ) {
        projectile.object.destroy();
        this.projectiles.splice(i, 1);
      }
    }

    // Countdown
    this.dodgeTime -= delta / 1000;

    this.dodgeTimerText.setText(
      `TIME: ${Math.max(0, Math.ceil(this.dodgeTime))}`
    );

    if (this.dodgeTime <= 0) {
      this.finishDodge();
    }
  }

  private finishDodge() {
    if (!this.dodgeActive) return;

    this.dodgeActive = false;
    this.stopProjectileSpawner();

    const result = this.hasBeenHit
      ? 'You were hit by the Cave Slime!'
      : 'You successfully dodged the attack!';

    this.dodgeMessage.setText(result);

    this.time.delayedCall(2000, () => {
      this.showMenu();
    });
  }

  private stopProjectileSpawner() {
    if (this.projectileEvent) {
      this.projectileEvent.remove();
      this.projectileEvent = undefined;
    }
  }
  private monsterDefeated() {
  // Prevent further attacks
  this.attackActive = false;
  this.dodgeActive = false;
  this.menuActive = false;

  this.stopProjectileSpawner();

  // Clear the current combat UI
  this.children.removeAll(true);
  this.scene.get('DungeonScene').events.emit('enemy-defeated');

  this.exitCombat();

  
}

  // --------------------------------
  // EXIT
  // --------------------------------

  private exitCombat() {
    this.attackActive = false;
    this.dodgeActive = false;
    this.stopProjectileSpawner();

    this.scene.stop();
    this.scene.resume('DungeonScene');
  }
}
