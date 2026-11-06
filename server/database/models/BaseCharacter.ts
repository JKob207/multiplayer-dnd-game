import { Character } from "./Character.js";
import { CombatComponent } from "./helpers/Combat.js";
import { DamageType, ResourceType, type Damage } from "./helpers/types.js";
import { HealthComponent } from "./helpers/Health.js";
import { ResistsComponent } from "./helpers/Resistance.js";
import { ResourceComponent } from "./helpers/Resource.js";


export class BaseCharacter extends Character {
    health = new HealthComponent(570);
    resource = new ResourceComponent(360, ResourceType.mana);
    resistances = new ResistsComponent(26, 30);
    combat = new CombatComponent(50, 0, 0, 0, 0, 0, 0);
    movementSpeed = 330;

    baseAttack(): Damage | false {
        const success = this.resource.consume(55);
        if (success) {
            const damage: Damage = [
                {
                    amount: 35 + Math.floor(this.combat.abilityPower * 0.4),
                    type: DamageType.AbilityPower,
                    penetration: {
                        percentage: this.combat.magicPenetration,
                        flat: this.combat.magicPenFlat
                    }
                },
                {
                    amount: 0,
                    type: DamageType.AttackDamage,
                    penetration: {
                        percentage: this.combat.armorPenetration,
                        flat: this.combat.lethality
                    }
                },
                {
                    amount: 35 + Math.floor(this.combat.abilityPower * 0.4),
                    type: DamageType.TrueDamage
                }
            ]
            return damage;
        }
        return false;
    }
    secondaryAttack(): Damage | false {
        const success = this.resource.consume(55);
        if (success) {
            const damage: Damage = [
                {
                    amount: 35 + Math.floor(this.combat.abilityPower * 0.4),
                    type: DamageType.AbilityPower,
                    penetration: {
                        percentage: this.combat.magicPenetration,
                        flat: this.combat.magicPenFlat
                    }
                },
                {
                    amount: 0,
                    type: DamageType.AttackDamage,
                    penetration: {
                        percentage: this.combat.armorPenetration,
                        flat: this.combat.lethality
                    }
                },
                {
                    amount: 35 + Math.floor(this.combat.abilityPower * 0.4),
                    type: DamageType.TrueDamage
                }
            ]
            return damage;
        }
        return false;
    }
    specialAttack(): Damage | false {
        const success = this.resource.consume(55);
        if (success) {
            const damage: Damage = [
                {
                    amount: 35 + Math.floor(this.combat.abilityPower * 0.4),
                    type: DamageType.AbilityPower,
                    penetration: {
                        percentage: this.combat.magicPenetration,
                        flat: this.combat.magicPenFlat
                    }
                },
                {
                    amount: 0,
                    type: DamageType.AttackDamage,
                    penetration: {
                        percentage: this.combat.armorPenetration,
                        flat: this.combat.lethality
                    }
                },
                {
                    amount: 35 + Math.floor(this.combat.abilityPower * 0.4),
                    type: DamageType.TrueDamage
                }
            ]
            return damage;
        }
        return false;
    }

}