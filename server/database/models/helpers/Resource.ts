import type { ResourceType } from "./types.js";

export class ResourceComponent{
    current: number;
    max: number;
    type: ResourceType;
    consume(amount: number): boolean {
        if(this.current-amount < 0){
            return false;
        }

        this.current-=amount;
        return true;
    }
    regenerate(amount: number): void {
        this.current += amount;
        if(this.current > this.max) this.current = this.max;
    }

    constructor(max: number, type: ResourceType){
        this.current = max;
        this.max = max;
        this.type = type;
    }
}