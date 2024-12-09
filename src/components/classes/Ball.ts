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
            
            if (distanceSquared > radius * radius * 1.2 || particle.isDead) {
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
        this.size = radius * 2 * 1.1; // 1.1 for a small buffer

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
            if (this.particles.length > 0) {
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
        for (const particle of this.particles) {
            let avgX = 0;
            let avgY = 0;
            let count = 0;

            this.particles.forEach(otherParticle => {
                if (otherParticle !== particle && otherParticle.color === particle.color) {
                    const dx = otherParticle.position.x - particle.position.x;
                    const dy = otherParticle.position.y - particle.position.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 30) {
                        const currentAngle = Math.atan2(dy, dx);
                        const preferredAngle = particle.getPreferredAngle(particle.lastBallX, particle.lastBallY);
                        const angleDiff = Math.abs(particle.normalizeAngle(currentAngle - preferredAngle));

                        if (angleDiff < Math.PI / 2) {
                            avgX += otherParticle.position.x;
                            avgY += otherParticle.position.y;
                            count++;
                        }
                    }
                }
            });

            if (count > 0) {
                avgX /= count;
                avgY /= count;
                const cohesionStrength = 0.08;
                particle.vx += (avgX - particle.position.x) * cohesionStrength;
                particle.vy += (avgY - particle.position.y) * cohesionStrength;
            }
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