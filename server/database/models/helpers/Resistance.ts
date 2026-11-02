import { DamageType } from "./DamageTypes.js";

interface Resists {
    armor: number;
    magicResist: number;

    toTrueDamage(damageType: DamageType, amount: number, penetrationPercentage: number, penetrationFlat: number): number;
}

export class ResistsComponent implements Resists{
    armor: number;
    magicResist: number;

    toTrueDamage(damageType: DamageType, amount: number, penetrationPercentage: number, penetrationFlat: number): number{
        let reduction = 0;
        if(damageType === 0){
            reduction = this.magicResist;
        }
        if(damageType === 1){
            reduction = this.armor;
        }

        reduction -= reduction*penetrationPercentage*0.01;
        reduction -= penetrationFlat;

        if(reduction >= 0){
            reduction = 100/(100 + reduction);
        }else{
            reduction = 2-(100/(100-reduction));
        }

        const postMitigationDamage = amount * reduction;
        return postMitigationDamage;
    }

    constructor(armor: number, magicResist: number){
        this.armor = armor;
        this.magicResist = magicResist;
    }
}