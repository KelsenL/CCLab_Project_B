import p5 from "p5";
import Particle from "./Particle";

export default class Ball {
    protected p5: p5;
    x: number;
    y: number;
    size: number;
    color: "white" | "black";
    particles: Particle[] = [];
    targetX: number;
    targetY: number;


    protected static readonly BASE_PARTICLE_DENSITY = 0.05;
    static MAX_PARTICLE_COUNT = 1000;
    private isVictoryAnimating: boolean = false;
    private victoryAnimationPhase: 'gathering' | 'releasing' = 'gathering';

    constructor(p5: p5, x: number, y: number, color: "white" | "black", size: number) {
        this.p5 = p5;
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.targetX = x;
        this.targetY = y;
        const particleCount = Math.floor(Math.PI * Math.pow(size / 2, 2) * Ball.BASE_PARTICLE_DENSITY);
        
        this.particles = Array.from({ length: particleCount }, () => {
            const radius = this.size / 2;
            const angle = p5.random(0, Math.PI * 2);
            const r = p5.random(0, radius);
            const particleX = this.x + r * Math.cos(angle);
            const particleY = this.y + r * Math.sin(angle);
            const particle = new Particle(this.p5, particleX, particleY, this.color, this.x, this.y);
            return particle;
        });
    }

    public update(targetX: number, targetY: number) {
        this.targetX = targetX;
        this.targetY = targetY;
        this.x = this.p5.lerp(this.x, this.targetX, 0.35);
        this.y = this.p5.lerp(this.y, this.targetY, 0.35);
        const radius = this.size / 2;
        
        this.YinYangBallEffect()
        for (const particle of this.particles) {
            particle.update(this.x, this.y, radius);
        }
        if (this.isVictoryAnimating) {
            if (this.victoryAnimationPhase === 'gathering') {
                //forming one yin yang
                this.particles.forEach(particle => {
                    const dx = particle.position.x - this.x;
                    const dy = particle.position.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > this.size * 0.4) {  
                        particle.reposition(this.x, this.y, this.size * 0.4);
                    }
                });
            }
        }
    }

    public display() {
        // Add debug visualization
        this.p5.push();
        this.p5.noStroke();
        this.p5.noFill();
        this.p5.circle(this.x, this.y, this.size);
        this.p5.pop();

        // Original particle rendering
        for (const particle of this.particles) {
            particle.display();
        }
    }
    public transferParticleTo(targetBall: Ball) {
        if (this.particles.length > 0) {
            const particle = this.particles.pop()!;
            particle.resetOffset(targetBall.x, targetBall.y);
            particle.flowTowards(targetBall.x, targetBall.y);
            targetBall.particles.push(particle);
            this.updateSize();
            targetBall.updateSize()
        }
    }

    updateSize() :boolean{
        if (this.particles.length === 0) {
            return false;
        }  
        const targetSize = Math.max(30, Math.min(100, 30 + Math.sqrt(this.particles.length) * 2));
        this.size = this.p5.lerp(this.size, targetSize, 0.1);
        const currentRadius = this.size / 2;
        let needsReposition = false;

        this.particles.forEach(particle => {
            const dx = particle.position.x - this.x;
            const dy = particle.position.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > currentRadius) {
                needsReposition = true;
                particle.reposition(this.x, this.y, currentRadius);
            }
        });
        return needsReposition;
    }
    private YinYangBallEffect() {
        const centerX = this.x;
        const centerY = this.y;
        const radius = this.size / 2;

        // Apply forces to each particle
        for (const particle of this.particles) {
            const dx = particle.position.x - centerX;
            const dy = particle.position.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 1. Basic rotation force - always active
            const angle = Math.atan2(dy, dx);
            const normalizedAngle = angle < 0 ? angle + Math.PI * 2 : angle;
            const rotationDirection = particle.color === 'white' ? 1 : -1;
            
            // 根据是否在流动状态调整力的强度
            const stateMultiplier = particle.isFlowing ? 0.5 : 1.0;
            const baseRotationStrength = 0.15 * stateMultiplier;
            const rotationStrength = baseRotationStrength * (1 - Math.pow(distance / radius, 2));
            
            particle.vx += -dy * rotationStrength * rotationDirection;
            particle.vy += dx * rotationStrength * rotationDirection;

            // 2. Push particles to their color's side
            const targetAngle = particle.color === 'white' ? 0 : Math.PI; // white: right, black: left
            let angleDiff = normalizedAngle - targetAngle;
            if (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            if (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            const separationStrength = 0.1 * stateMultiplier;
            const targetX = centerX + Math.cos(targetAngle) * distance;
            const targetY = centerY + Math.sin(targetAngle) * distance;
            
            particle.vx += (targetX - particle.position.x) * separationStrength;
            particle.vy += (targetY - particle.position.y) * separationStrength;

            // 3. Boundary constraint
            const boundaryThreshold = radius * 0.95;
            if (distance > boundaryThreshold) {
                const boundaryForce = 0.2 * ((distance - boundaryThreshold) / radius);
                particle.vx -= (dx / distance) * boundaryForce;
                particle.vy -= (dy / distance) * boundaryForce;
            }
        }
    }
    public resetParticleOffsets() {
        for (const particle of this.particles) {
            particle.resetOffset(this.x, this.y);
        }
    }
    victoryAnimationReleaseParticles() {
        this.isVictoryAnimating = true;
        this.victoryAnimationPhase = 'gathering';
        
        // Reset offset of all particles to the current ball center
        this.particles.forEach(particle => {
            particle.resetOffset(this.x, this.y);
        });
    
        // Switch to release phase after a while
        setTimeout(() => {
            this.victoryAnimationPhase = 'releasing';
            
            // Calculate release direction
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            // Let particles flow outwards
            this.particles.forEach((particle, index) => {
                const angle = (index / this.particles.length) * Math.PI * 2;
                const targetX = centerX + Math.cos(angle) * 500;  // 500px radius
                const targetY = centerY + Math.sin(angle) * 500;
                particle.flowTowards(targetX, targetY, 0.8);
            });
        }, 2000); 
    }
}
