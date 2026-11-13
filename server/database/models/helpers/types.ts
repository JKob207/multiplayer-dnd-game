export enum DamageType {
    AbilityPower,
    AttackDamage,
    TrueDamage
}

export type Damage = [
    {
        amount: number,
        type: DamageType.AbilityPower,
        penetration: {
            percentage: number,
            flat: number,
        }
    },
    {
        amount: number,
        type: DamageType.AttackDamage,
        penetration: {
            percentage: number,
            flat: number,
        }
    },
    {
        amount: number,
        type: DamageType.TrueDamage
    }
]

export enum ResourceType {
    "mana",
    "energy"
}