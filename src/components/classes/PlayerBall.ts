import p5 from "p5";
import Ball from "./Ball";

export default class PlayerBall extends Ball {
    private static readonly MOVEMENT_SPEED = 5;

    private keys: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
        q: boolean;
        '/': boolean;
    };

    private playerType: 'player1' | 'player2';

    private onEvent?: (event: { type: 'split' }) => void;

    private handleKeyDown: (e: KeyboardEvent) => void;
    private handleKeyUp: (e: KeyboardEvent) => void;

    constructor(p5: p5, x: number, y: number, color: "white" | "black", playerType: 'player1' | 'player2', size: number, onEvent?: (event: { type: 'split' }) => void) {
        super(p5, x, y, color, size);
        this.playerType = playerType;
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            q: false,
            '/': false
        };
        
        this.handleKeyDown = this.handleKeyPress.bind(this, true);
        this.handleKeyUp = this.handleKeyPress.bind(this, false);
        
        this.setupKeyboardControls();
        
        if (onEvent) {
            this.onEvent = onEvent;
        }

        this.targetX = x;
        this.targetY = y;
    }

    private setupKeyboardControls() {
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
    }

    private handleKeyPress(isDown: boolean, e: KeyboardEvent) {
        // Prevent key events from affecting page scroll
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 's', 'a', 'd'].includes(e.key)) {
            e.preventDefault();
        }

        if (this.playerType === 'player1') {
            switch (e.key.toLowerCase()) {
                case 'w':
                    this.keys.up = isDown;
                    break;
                case 's':
                    this.keys.down = isDown;
                    break;
                case 'a':
                    this.keys.left = isDown;
                    break;
                case 'd':
                    this.keys.right = isDown;
                    break;
            }
        } else if (this.playerType === 'player2') {
            switch (e.key) {
                case 'ArrowUp':
                    this.keys.up = isDown;
                    break;
                case 'ArrowDown':
                    this.keys.down = isDown;
                    break;
                case 'ArrowLeft':
                    this.keys.left = isDown;
                    break;
                case 'ArrowRight':
                    this.keys.right = isDown;
                    break;
            }
        }
        const splitKey = this.playerType === 'player1' ? 'q' : '/';
        if (e.key.toLowerCase() === splitKey && isDown && !this.keys[splitKey] && this.onEvent) {
            this.keys[splitKey] = true;
            this.onEvent({ type: 'split' });
        }
        if (e.key.toLowerCase() === splitKey && !isDown) {
            this.keys[splitKey] = false;
        }
    }

    display() {
        super.display();
    }

    update() {
        const CANVAS_WIDTH = window.innerWidth;
        const CANVAS_HEIGHT = window.innerHeight - 56; // Subtract header/footer height
        const MARGIN = this.size; // Use ball size as margin

        if (this.keys.up) { 
            this.targetY = Math.max(MARGIN, this.targetY - PlayerBall.MOVEMENT_SPEED); 
        }
        if (this.keys.down) { 
            this.targetY = Math.min(CANVAS_HEIGHT - MARGIN, this.targetY + PlayerBall.MOVEMENT_SPEED); 
        }
        if (this.keys.left) { 
            this.targetX = Math.max(MARGIN, this.targetX - PlayerBall.MOVEMENT_SPEED); 
        }
        if (this.keys.right) { 
            this.targetX = Math.min(CANVAS_WIDTH - MARGIN, this.targetX + PlayerBall.MOVEMENT_SPEED); 
        }

        super.update(this.targetX, this.targetY);
    }

    public collide(other: Ball): { gameOver: boolean; victory: boolean } {
        this.updateSize(this.particleCount);
        other.updateSize(other.particleCount);
        
        if (this.checkCollision(other).isColliding) {
            // Calculate collision energy before handling collision
            const collision = this.checkCollision(other);
            const nx = collision.dx / collision.distance;
            const ny = collision.dy / collision.distance;
            const dvx = other.vx - this.vx;
            const dvy = other.vy - this.vy;
            const velocityAlongNormal = dvx * nx + dvy * ny;
            const relativeSpeed = Math.abs(velocityAlongNormal);
            const collisionEnergy = relativeSpeed * Ball.PARTICLE_ELASTICITY;

            this.handleCollision(other);
            
            if (other instanceof PlayerBall && this instanceof PlayerBall) {
                const MINIMUM_PARTICLES = 10;
                if (other.particles.length <= MINIMUM_PARTICLES || 
                    this.particles.length <= MINIMUM_PARTICLES) {
                    return {
                        gameOver: true,
                        victory: false
                    };
                }

                const thisWhiteRatio = this.countParticlesByColor("white") / this.particles.length;
                const otherWhiteRatio = other.countParticlesByColor("white") / other.particles.length;
                
                const sizeRatio = Math.min(this.particles.length, other.particles.length) / 
                                 Math.max(this.particles.length, other.particles.length);
                
                // Victory condition - balanced particles
                if (Math.abs(thisWhiteRatio - 0.5) < 0.1 && 
                    Math.abs(otherWhiteRatio - 0.5) < 0.1 && 
                    sizeRatio > 0.8) { 
                    return {
                        gameOver: true,
                        victory: true 
                    };
                }

                // Dynamic particle transfer based on collision energy
                const energyFactor = Math.min(collisionEnergy * 2, 1.0); // Scale collision energy
                const baseTransferRate = 0.05; // Base transfer rate 5%
                const transferRate = baseTransferRate + (baseTransferRate * energyFactor);
                
                if (this.particles.length > other.particles.length) {
                    const transferCount = Math.floor(other.particles.length * transferRate);
                    other.transferParticlesTo(this, transferCount);
                } else {
                    const transferCount = Math.floor(this.particles.length * transferRate);
                    this.transferParticlesTo(other, transferCount);
                }
            } else {
                // Non-player ball collision
                const MINIMUM_PARTICLES = 10;
                if (this.particles.length <= MINIMUM_PARTICLES) {
                    return {
                        gameOver: true,
                        victory: false
                    };
                }

                // Dynamic absorption based on collision energy
                const energyFactor = Math.min(collisionEnergy * 2, 1.0);
                const baseTransferRate = 0.1;
                const transferRate = baseTransferRate + (baseTransferRate * energyFactor);

                if (this.particles.length > other.particles.length) {
                    const transferCount = Math.floor(other.particles.length * transferRate);
                    other.transferParticlesTo(this, transferCount);
                } else {
                    const transferCount = Math.floor(this.particles.length * transferRate);
                    this.transferParticlesTo(other, transferCount);
                }
            }
        }
        
        return {
            gameOver: false,
            victory: false
        };
    }

    public split(p5: p5): Ball | undefined {
        if (this.particles.length < 20) return undefined; // 确保有足够的粒子才能分裂

        const particlesToSeparate = Math.floor(this.particles.length * 0.2);
        if (particlesToSeparate <= 0) return undefined;

        // 计算新球的位置，确保在合理范围内
        const offsetX = Math.sign(this.p5.random(-1, 1)) * Math.max(100, Math.abs(this.p5.random(-150, 150)));
        const offsetY = Math.sign(this.p5.random(-1, 1)) * Math.max(100, Math.abs(this.p5.random(-150, 150)));

        const newX = Math.max(this.size, Math.min(this.x + offsetX, p5.width - this.size));
        const newY = Math.max(this.size, Math.min(this.y + offsetY, p5.height - this.size));

        // 创建新球时给予合适的初始大小
        const newBall = new Ball(p5, newX, newY, this.color, this.size * 0.2);

        // 转移粒子并更新计数
        const particlesToTransfer = this.particles.splice(-particlesToSeparate, particlesToSeparate);
        newBall.particles = particlesToTransfer;
        this.particleCount -= particlesToSeparate;
        newBall.particleCount = particlesToSeparate;

        // 更新两个球的大小
        this.updateSize(this.particleCount);
        newBall.updateSize(newBall.particleCount);

        // 增加分裂速度和添加随机性
        const splitSpeed = 8;
        const angle = Math.atan2(offsetY, offsetX);
        const randomAngleOffset = this.p5.random(-0.2, 0.2); // 添加一些随机角度偏移

        // 设置新球的速度
        newBall.vx = Math.cos(angle + randomAngleOffset) * splitSpeed;
        newBall.vy = Math.sin(angle + randomAngleOffset) * splitSpeed;

        // 设置原球的反向速度（较小）
        this.vx = -Math.cos(angle) * splitSpeed * 0.3;
        this.vy = -Math.sin(angle) * splitSpeed * 0.3;

        // 确保新球的粒子立即开始移动
        newBall.particles.forEach(particle => {
            particle.vx = newBall.vx * 0.5 + this.p5.random(-1, 1);
            particle.vy = newBall.vy * 0.5 + this.p5.random(-1, 1);
        });

        return newBall;
    }
}
