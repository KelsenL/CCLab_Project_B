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

        // 计算粒子数量
        const particleCount = Math.floor(Math.PI * Math.pow(size / 2, 2) * Ball.BASE_PARTICLE_DENSITY);
        
        // 在球体范围内随机分布粒子
        this.particles = Array.from({ length: particleCount }, () => {
            const radius = this.size / 2;
            const angle = p5.random(0, Math.PI * 2);
            const r = p5.random(0, radius);
            const particleX = this.x + r * Math.cos(angle);
            const particleY = this.y + r * Math.sin(angle);
            // 创建粒子时使用当前位置作为目标位置
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
                // 加强聚集力，形成完美太极
                this.particles.forEach(particle => {
                    const dx = particle.position.x - this.x;
                    const dy = particle.position.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance > this.size * 0.4) {  // 如果粒子距离太远
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
    public transferParticlesTo(targetBall: Ball, ParticleTransferCount: number) { 
        const particlesToTransfer = [];
        for (let i = 0; i < ParticleTransferCount && this.particles.length > 0; i++) {
            const particle = this.particles.pop()!;
            
            // // 计算从源球到目标球的方向
            const dx = targetBall.x - this.x;
            const dy = targetBall.y - this.y;
            // const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 在目标球内设置随机位置
            const targetRadius = targetBall.size / 2;
            const spreadAngle = Math.PI / 4; // 使用更大的扇形范围
            const baseAngle = Math.atan2(dy, dx);
            const randomAngle = baseAngle + (Math.random() - 0.5) * spreadAngle;
            
            // 在目标球内部随机分布（从中心到边缘）
            const distributionRadius = targetRadius * Math.sqrt(Math.random()); // 使用平方根使分布更均匀
            particle.position.x = targetBall.x + distributionRadius * Math.cos(randomAngle);
            particle.position.y = targetBall.y + distributionRadius * Math.sin(randomAngle);
            
            // 给予较小的随机初始速度
            const initialSpeed = 0.5;
            particle.vx = (Math.random() - 0.5) * initialSpeed;
            particle.vy = (Math.random() - 0.5) * initialSpeed;
            
            // 重置偏移量和目标位置
            particle.resetOffset(targetBall.x, targetBall.y);
            
            particlesToTransfer.push(particle);
        }
        
        // 更新两个球的大小
        targetBall.particles.push(...particlesToTransfer);
        this.updateSize();
        targetBall.updateSize();
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
    
        // Calculate the center points of white and black particles
        const centers = {
            white: { x: 0, y: 0, count: 0 },
            black: { x: 0, y: 0, count: 0 }
        };
    
        // Calculate the center points of each color
        for (const particle of this.particles) {
            centers[particle.color].x += particle.position.x;
            centers[particle.color].y += particle.position.y;
            centers[particle.color].count++;
        }
    
        // Calculate the average center points
        for (const color of ['white', 'black'] as const) {
            if (centers[color].count > 0) {
                centers[color].x /= centers[color].count;
                centers[color].y /= centers[color].count;
            }
        }
    
        // Apply forces to each particle
        for (const particle of this.particles) {
            const dx = particle.position.x - centerX;
            const dy = particle.position.y - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 1. 基础太极旋转 - 始终保持
            const rotationDirection = particle.color === 'white' ? 1 : -1;
            const baseRotationStrength = 0.08;
            const rotationStrength = baseRotationStrength * (1 - distance / radius * 0.3);
            
            particle.vx += -dy * rotationStrength * rotationDirection;
            particle.vy += dx * rotationStrength * rotationDirection;
    
            // 2. 同色聚集 - 仅在非flowing状态下
            if (!particle.isFlowing) {
                const colorCenter = centers[particle.color];
                if (colorCenter.count > 0) {
                    const dxColor = particle.position.x - colorCenter.x;
                    const dyColor = particle.position.y - colorCenter.y;
                    const colorDistance = Math.sqrt(dxColor * dxColor + dyColor * dyColor);
                    
                    if (colorDistance > 0) {
                        // 聚集力
                        const attractionStrength = 0.2;
                        particle.vx -= (dxColor / colorDistance) * attractionStrength;
                        particle.vy -= (dyColor / colorDistance) * attractionStrength;
                        
                        // 添加分散力，防止过度聚集
                        const minDistance = radius * 0.15; // 最小期望距离
                        if (colorDistance < minDistance) {
                            // 当距离小于最小期望距离时，添加排斥力
                            const repelStrength = 0.1 * (1 - colorDistance / minDistance);
                            particle.vx += (dxColor / colorDistance) * repelStrength;
                            particle.vy += (dyColor / colorDistance) * repelStrength;
                        }
                    }
                }
            }
    
            // 3. 柔和的边界约束
            const boundaryThreshold = radius * 0.95;
            if (distance > boundaryThreshold) {
                const boundaryForce = 0.1 * ((distance - boundaryThreshold) / radius);
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
        
        // 重置所有粒子的偏移，使其相对于当前球心
        this.particles.forEach(particle => {
            particle.resetOffset(this.x, this.y);
        });
    
        // 在一段时间后切换到释放阶段
        setTimeout(() => {
            this.victoryAnimationPhase = 'releasing';
            
            // 计算释放方向
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            // 让粒子向四周流动
            this.particles.forEach((particle, index) => {
                const angle = (index / this.particles.length) * Math.PI * 2;
                const targetX = centerX + Math.cos(angle) * 500;  // 500px 半径
                const targetY = centerY + Math.sin(angle) * 500;
                particle.flowTowards(targetX, targetY, 0.8);
            });
        }, 2000); 
    }
}
