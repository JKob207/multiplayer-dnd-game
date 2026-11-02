import { Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from "sequelize";
import type { ResourceComponent } from "./helpers/Resource.js";
import type { HealthComponent } from "./helpers/Health.js";
import type { ResistsComponent } from "./helpers/Resistance.js";


export class Character extends Model<InferAttributes<Character>, InferCreationAttributes<Character>>{
    declare id: CreationOptional<number>;
    declare name: string;
    declare health: HealthComponent;
    declare resource: ResourceComponent;
    declare resistances: ResistsComponent;
    declare movementSpeed: number;

    
}

