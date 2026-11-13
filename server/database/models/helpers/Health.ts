export class HealthComponent{
    current: number;
    max: number;
    shield: number;

    takeDamage(amount: number): void {
        amount -= this.shield;
        this.current -= amount;
        if (this.current < 0) this.current = 0;
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