


enum ResourceType {
    "mana",
    "energy"
}

interface Resource {
    current: number;
    max: number;
    type: ResourceType;

    consume(amount: number): boolean;
    regenerate(amount: number): void;
}

export class ResourceComponent implements Resource{
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

    constructor(current: number, max: number, type: ResourceType){
        this.current = current;
        this.max = max;
        this.type = type;
    }
}