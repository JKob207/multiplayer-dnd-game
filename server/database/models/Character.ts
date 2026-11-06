import { DataTypes, Model, Sequelize, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import type { ResourceComponent } from "./helpers/Resource.js";
import { HealthComponent } from "./helpers/Health.js";
import type { ResistsComponent } from "./helpers/Resistance.js";
import type { CombatComponent } from "./helpers/Combat.js";
import type { Damage } from "./helpers/types.js";

export abstract class Character {
    id: number;
    name: string;
    abstract health: HealthComponent;
    abstract resource: ResourceComponent;
    abstract resistances: ResistsComponent;
    abstract combat: CombatComponent;
    abstract movementSpeed: number;

    recieveDmg(damage: Damage): void {
        const trueDamage = this.resistances.toTrueDamage(damage);
        this.health.takeDamage(trueDamage);
        if (this.health.current === 0) {
            console.log("Character Died, do something about it!"); //TODO
        }
    }

    abstract baseAttack(): Damage | false;
    abstract secondaryAttack(): Damage | false;
    abstract specialAttack(): Damage | false;

    constructor(id: number, name: string){
        this.id = id;
        this.name = name;
    }
}

