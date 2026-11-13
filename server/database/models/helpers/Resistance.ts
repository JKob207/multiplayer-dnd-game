import { DamageType, type Damage } from "./types.js";


export class ResistsComponent {
    armor: number;
    magicResist: number;

    toTrueDamage(damage: Damage): number {
        let result = 0;
        damage.forEach(i => {
            
            let reduction = 0;
            let penetrationPercentage = 0;
            let penetrationFlat = 0;
            if (i.type === DamageType.AbilityPower) {
                reduction = this.magicResist;
                penetrationPercentage = i.penetration.percentage;
                penetrationFlat = i.penetration.flat;
            }
            if (i.type === DamageType.AttackDamage) {
                reduction = this.armor;
                penetrationPercentage = i.penetration.percentage;
                penetrationFlat = i.penetration.flat;
            }
            
            reduction -= reduction * penetrationPercentage * 0.01;
            reduction -= penetrationFlat;

            if (reduction >= 0) {
                reduction = 100 / (100 + reduction);
            } else {
                reduction = 2 - (100 / (100 - reduction));
            }

            const postMitigationDamage = i.amount * reduction;
            result += postMitigationDamage;
        })

        return result;
    }

    constructor(armor: number, magicResist: number) {
        this.armor = armor;
        this.magicResist = magicResist;
    }
}