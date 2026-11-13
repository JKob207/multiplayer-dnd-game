import { Character } from "./Character.js";
import { CombatComponent } from "./helpers/Combat.js";
import { DamageType, ResourceType, type Damage } from "./helpers/types.js";
import { HealthComponent } from "./helpers/Health.js";
import { ResistsComponent } from "./helpers/Resistance.js";
import { ResourceComponent } from "./helpers/Resource.js";


export class Monster {
    health = new HealthComponent(570);
    resistances = new ResistsComponent(26, 30);
    combat = new CombatComponent(5, 7, 0, 0, 0, 0, 0);

    recieveDmg(damage: Damage): void {
        const trueDamage = this.resistances.toTrueDamage(damage);
        this.health.takeDamage(trueDamage);
        if (this.health.current === 0) {
            console.log("Character Died, do something about it!"); //TODO
        }
    }

    dealDamage(): Damage {
        const damage: Damage = [
            {
                amount: this.combat.abilityPower,
                type: DamageType.AbilityPower,
                penetration: {
                    percentage: this.combat.magicPenetration,
                    flat: this.combat.magicPenFlat
                }
            },
            {
                amount: this.combat.attackDamage,
                type: DamageType.AttackDamage,
                penetration: {
                    percentage: this.combat.armorPenetration,
                    flat: this.combat.lethality
                }
            },
            {
                amount: 0,
                type: DamageType.TrueDamage
            }
        ]
        return damage;
    }
}