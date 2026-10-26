

interface Health {
    current: number;
    max: number;
    shield: number;

    takeDamage(amount: number): number;
    regenerate(amount: number): void;
}

export class HealthComponent implements Health{
    current: number;
    max: number;
    shield: number;

    takeDamage(amount: number): number {
        amount -= this.shield;
        this.current -= amount;
        if (this.current < 0) return this.current = 0;
        return this.current;
    }

    regenerate(amount: number): void {
        this.current += amount;
        if (this.current > this.max) this.current = this.max;
    }

    

    constructor(max: number) {
        this.current = max;
        this.max = max;
        this.shield = 0;
    }
}