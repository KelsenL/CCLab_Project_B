import p5 from "p5";
import Particle from "./Particle";
import { ParticlePool } from "./ParticlePool";

export default class Ball {
    protected p5: p5;
    x: number;
    y: number;
    vx: number = 0;
    vy: number = 0;
    size: number;
    color: "white" | "black";
    particles: Particle[] = [];
    targetX: number;
    targetY: number;

    private static readonly PARTICLES_PER_AREA = 0.05;

    constructor(p5: p5, x: number, y: number, color: "white" | "black", size: number) {
        this.p5 = p5;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.targetX = x;
        this.targetY = y;
        this.particles = [];
    }

    private addParticle(color?: "white" | "black"): boolean {
        const radius = this.size / 2;
        const angle = this.p5.random(0, this.p5.TWO_PI);
        const r = this.p5.random(0, radius);
        const x = this.x + r * Math.cos(angle);
        const y = this.y + r * Math.sin(angle);

        const particle = ParticlePool.getInstance().acquire(
            this.p5,
            x,
            y,
            color || this.color,
        );

        this.particles.push(particle);
        return true;
    }


    display() {
        this.p5.noStroke();
        this.p5.noFill();
        this.p5.circle(this.x, this.y, this.size);

        const area = Math.PI * Math.pow(this.size / 2, 2);
        const maxParticles = Math.floor(area * Ball.PARTICLES_PER_AREA);
        const particlesToAdd = Math.min(5, maxParticles - this.particles.length);
        for (let i = 0; i < particlesToAdd; i++) {
            this.addParticle();
        }
        const radius = this.size / 2;
        for (const particle of this.particles) {
            particle.update(this.x, this.y, radius);
            particle.display();
        }
    }


    update(targetX: number, targetY: number) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = this.p5.lerp(this.x, this.targetX, 0.1);
        this.y = this.p5.lerp(this.y, this.targetY, 0.1);
        this.applyCohesion();
        this.cleanupParticles();
    }

    private cleanupParticles() {
        const radius = this.size / 2;
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const dx = particle.position.x - this.x;
            const dy = particle.position.y - this.y;
            const distanceSquared = dx * dx + dy * dy;
            
            if (distanceSquared > radius * radius || particle.isDead) {
                if (i >= 0 && i < this.particles.length) {
                    ParticlePool.getInstance().release(particle);
                    this.particles.splice(i, 1);
                }
            }
        }
    }

    updateSize() {
        if (this.particles.length === 0) {
            this.size = 0;
            return;
        }
        const particleArea = this.particles.length / Ball.PARTICLES_PER_AREA;
        const radius = Math.sqrt(particleArea / Math.PI);
        this.size = radius * 2 * this.p5.map(this.p5.random(0,1),0,1,1.09,1.1);
        const currentRadius = this.size / 2;
        for (const particle of this.particles) {
            particle.reposition(this.x, this.y, currentRadius);
        }
    }

    checkCollision(other: Ball): { isColliding: boolean, dx: number, dy: number, distance: number, minDistance: number } {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (this.size + other.size) / 2;
        return {
            isColliding: distance < minDistance,
            dx,
            dy,
            distance,
            minDistance
        };
    }

    handleCollision(other: Ball) {
        const collision = this.checkCollision(other);

        if (collision.isColliding) {
            // Calculate overlap
            const overlap = collision.minDistance - collision.distance;

            // Normalize the collision vector
            const nx = collision.dx / collision.distance;
            const ny = collision.dy / collision.distance;

            // Separate the balls to remove overlap
            this.x -= nx * overlap / 2;
            this.y -= ny * overlap / 2;
            other.x += nx * overlap / 2;
            other.y += ny * overlap / 2;

            // Calculate relative velocity
            const dvx = other.vx - this.vx;
            const dvy = other.vy - this.vy;

            // Calculate velocity along the normal
            const velocityAlongNormal = dvx * nx + dvy * ny;

            // Do not resolve if velocities are separating
            if (velocityAlongNormal > 0) return;

            // Calculate restitution (bounciness)
            const restitution = 0.8; // Adjust this value for more or less bounce

            // Calculate impulse scalar
            const impulse = -(1 + restitution) * velocityAlongNormal;
            const impulseX = impulse * nx;
            const impulseY = impulse * ny;

            // Apply impulse to the balls
            this.vx -= impulseX / 2;
            this.vy -= impulseY / 2;
            other.vx += impulseX / 2;
            other.vy += impulseY / 2;
        }
    }

    transferParticlesTo(targetBall: Ball, count: number) {
        for (let i = 0; i < count; i++) {
            if (this.particles.length >= 0) {
                const particle = this.particles.pop()!;
                particle.flowTowards(targetBall.x, targetBall.y, 0.5);
                targetBall.particles.push(particle);
            }
        }
        this.updateSize();
        targetBall.updateSize();
    }

    public countParticlesByColor(color: "white" | "black"): number {
        return this.particles.filter(p => p.color === color).length;
    }

    private applyCohesion() {
        // Replace grid system with a single center point approach
        const centerX = this.x;
        const centerY = this.y;
        
        // Calculate center of mass for black and white particles separately
        const centers = {
            white: { x: 0, y: 0, count: 0 },
            black: { x: 0, y: 0, count: 0 }
        };

        // Calculate center of mass for each color
        for (const particle of this.particles) {
            centers[particle.color].x += particle.position.x;
            centers[particle.color].y += particle.position.y;
            centers[particle.color].count++;
        }

        // Normalize center coordinates
        for (const color of ['white', 'black'] as const) {
            if (centers[color].count > 0) {
                centers[color].x /= centers[color].count;
                centers[color].y /= centers[color].count;
            }
        }

        const radius = this.size / 2;
        for (const particle of this.particles) {
            // Calculate distance to ball center
            const dxCenter = particle.position.x - centerX;
            const dyCenter = particle.position.y - centerY;
            const distanceToCenter = Math.sqrt(dxCenter * dxCenter + dyCenter * dyCenter);

            // Calculate distance to same color center of mass
            const colorCenter = centers[particle.color];
            const dxColor = particle.position.x - colorCenter.x;
            const dyColor = particle.position.y - colorCenter.y;
            
            // Force calculations
            const boundaryForce = 0.02; // Boundary force
            const cohesionForce = 0.01; // Cohesion force
            const rotationForce = 0.03; // Rotation force
            const repulsionForce = 0.1; // New repulsion force

            // Boundary constraint
            if (distanceToCenter > radius * 0.8) {
                particle.vx -= (dxCenter / distanceToCenter) * boundaryForce;
                particle.vy -= (dyCenter / distanceToCenter) * boundaryForce;
            }

            // Same color cohesion
            if (colorCenter.count > 0) {
                particle.vx -= dxColor * cohesionForce;
                particle.vy -= dyColor * cohesionForce;
            }

            // Apply repulsion force if too close to the center
            if (distanceToCenter < radius * 0.5) {
                particle.vx += (dxCenter / distanceToCenter) * repulsionForce;
                particle.vy += (dyCenter / distanceToCenter) * repulsionForce;
            }

            // Add rotation force, black and white rotate in opposite directions
            const rotationDirection = particle.color === 'white' ? 1 : -1;
            particle.vx += -dyCenter * rotationForce * rotationDirection;
            particle.vy += dxCenter * rotationForce * rotationDirection;

            // Speed limit
            const maxSpeed = 2;
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed > maxSpeed) {
                particle.vx = (particle.vx / speed) * maxSpeed;
                particle.vy = (particle.vy / speed) * maxSpeed;
            }

            // Add small randomness
            const randomness = 0.02;
            particle.vx += this.p5.random(-randomness, randomness);
            particle.vy += this.p5.random(-randomness, randomness);
        }
    }

    victoryAnimationReleaseParticles() {
        // Release all particles back to the pool
        this.particles.forEach(particle => {
            ParticlePool.getInstance().release(particle);
        });
        this.particles = [];
    }
}
