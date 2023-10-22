export class Health {
    constructor(public max = 100, public current = 0) {}

    kill() {
        this.current = -100;
    }

    full() {
        this.current = this.max;
    }

    damage(amount: number) {
        this.current = Math.max(0, this.current - amount);
    }

    heal(amount: number) {
        this.current = Math.min(this.max, this.current + amount);
    }

    get abstract() {
        const { max, current } = this;
        return { current, max }
    }
}