export class Random {
    private seed: number;

    constructor(seed: number = Date.now()) {
        this.seed = seed;
    }

    private nextInt(): number {
        this.seed = (this.seed * 16807) % 2147483647;
        return this.seed;
    }

    setSeed(seed: number) {
        this.seed = seed;
    }

    nextIntInRange(min: number, max: number): number {
        return Math.floor(this.nextInt() / 2147483647 * (max - min + 1) + min);
    }

    nextFloat(max?: number): number {
        if (max == null) {
            max = 1;
        }
        return this.nextInt() / 2147483647 * max;
    }

    nextDouble(): number {
        return this.nextFloat(1.0);
    }

    nextBoolean(): boolean {
        return this.nextInt() % 2 === 0;
    }

    nextGaussian(): number {
        let u = 0;
        let v = 0;
        while (u === 0) u = this.nextFloat(1);
        while (v === 0) v = this.nextFloat(1);
        const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return num;
    }

    nextLong(): bigint {
        const high = this.nextInt() >>> 0;
        const low = this.nextInt() >>> 0;
        return high * 0x100000000 + low;
    }
}