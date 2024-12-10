import p5 from "p5";
import Ball from "./Ball";

export default class PlayerBall extends Ball {
    private static readonly MOVEMENT_SPEED = 10;

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
        this.updateSize();
        other.updateSize();
        if (this.checkCollision(other).isColliding) {
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
                
                if (Math.abs(thisWhiteRatio - 0.5) < 0.1 && 
                    Math.abs(otherWhiteRatio - 0.5) < 0.1 && 
                    sizeRatio > 0.8) { 
                    return {
                        gameOver: true,
                        victory: true 
                    };
                }

                const ABSORPTION_THRESHOLD = 0.4;
                
                if (this.particles.length > other.particles.length) {
                    if (other.particles.length < this.particles.length * ABSORPTION_THRESHOLD) {
                        const transferCount = Math.floor(other.particles.length * 0.2);
                        other.transferParticlesTo(this, transferCount);
                    } else {
                        const transferCount = Math.floor(other.particles.length * 0.05);
                        other.transferParticlesTo(this, transferCount);
                    }
                } else {
                    if (this.particles.length < other.particles.length * ABSORPTION_THRESHOLD) {
                        const transferCount = Math.floor(this.particles.length * 0.2);
                        this.transferParticlesTo(other, transferCount);
                    } else {
                        const transferCount = Math.floor(this.particles.length * 0.05);
                        this.transferParticlesTo(other, transferCount);
                    }
                }
            } else {
                const ABSORPTION_THRESHOLD = 0.2;
                
                if (this.particles.length <= 10) {
                    return {
                        gameOver: true,
                        victory: false
                    };
                }
                
                if (this.particles.length > other.particles.length) {
                    if (other.particles.length < this.particles.length * ABSORPTION_THRESHOLD) {
                        const allParticles = other.particles.length;
                        other.transferParticlesTo(this, allParticles);
                    } else {
                        const transferCount = Math.floor(other.particles.length * 0.1);
                        other.transferParticlesTo(this, transferCount);
                    }
                } else {
                    if (this.particles.length < other.particles.length * ABSORPTION_THRESHOLD) {
                        const allParticles = this.particles.length;
                        this.transferParticlesTo(other, allParticles);
                    } else {
                        const transferCount = Math.floor(this.particles.length * 0.1);
                        this.transferParticlesTo(other, transferCount);
                    }
                }
            }
        }
        return {
            gameOver: false,
            victory: false
        };
    }

    public split(p5: p5): Ball | undefined {
        if (this.particles.length === 0) return undefined;

        const particlesToSeparate = Math.floor(this.particles.length * 0.2);
        if (particlesToSeparate <= 0) return undefined;

        const offsetX = Math.sign(this.p5.random(-1, 1)) * Math.max(150, Math.abs(this.p5.random(-200, 200)));
        const offsetY = Math.sign(this.p5.random(-1, 1)) * Math.max(150, Math.abs(this.p5.random(-200, 200)));

        const newX = Math.max(0, Math.min(this.x + offsetX, p5.width));
        const newY = Math.max(0, Math.min(this.y + offsetY, p5.height));

        const newBall = new Ball(p5, newX, newY, this.color, 0);

        const particlesToTransfer = this.particles.splice(-particlesToSeparate, particlesToSeparate);
        newBall.particles = particlesToTransfer;

        this.updateSize();
        newBall.updateSize();

        const splitSpeed = 5;
        const angle = Math.atan2(offsetY, offsetX);
        newBall.vx = Math.cos(angle) * splitSpeed;
        newBall.vy = Math.sin(angle) * splitSpeed;

        this.vx = -Math.cos(angle) * splitSpeed * 0.5;
        this.vy = -Math.sin(angle) * splitSpeed * 0.5;

        return newBall;
    }
}
