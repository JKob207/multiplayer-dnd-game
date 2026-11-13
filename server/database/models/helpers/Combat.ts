import type { Damage, DamageType } from "./types.js";

interface Combat {
    attackDamage: number;
    abilityPower: number;
    magicPenetration: number;
    magicPenFlat: number;
    lethality: number;
    armorPenetration: number;
    lifeSteal: number;

}

export class CombatComponent implements Combat {
    attackDamage: number;
    abilityPower: number;
    magicPenetration: number;
    magicPenFlat: number;
    lethality: number;
    armorPenetration: number;
    lifeSteal: number;

    constructor(attackDamage: number, abilityPower: number, magicPenetration: number, magicPenFlat: number, lethality: number, armorPenetration: number, lifeSteal: number) {
        this.attackDamage = attackDamage;
        this.abilityPower = abilityPower;
        this.magicPenetration = magicPenetration;
        this.magicPenFlat = magicPenFlat;
        this.lethality = lethality;
        this.armorPenetration = armorPenetration;
        this.lifeSteal = lifeSteal;
    }

}