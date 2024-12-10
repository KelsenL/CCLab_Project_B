import Particle from './Particle';
import p5 from 'p5';

export class ParticlePool {
    private static instance: ParticlePool;
    private pool: Particle[] = [];
    private readonly maxSize: number = 1000; // Maximum size of the pool

    private constructor() {}

    public static getInstance(): ParticlePool {
        if (!ParticlePool.instance) {
            ParticlePool.instance = new ParticlePool();
        }
        return ParticlePool.instance;
    }

    public acquire(p5: p5, x: number, y: number, color: "white" | "black"): Particle {
        // Try to get a particle from the pool
        const particle = this.pool.pop();
        if (particle) {
            // Reset particle state
            particle.reset(x, y, color);
            return particle;
        }
        // If pool is empty, create new particle
        return new Particle(p5, x, y, color);
    }

    public release(particle: Particle) {
        // If pool is not full, return particle to pool
        if (this.pool.length < this.maxSize) {
            this.pool.push(particle);
        }
    }
} 