import p5 from "p5";
import Ball from "./Ball";

export default class PlayerBall extends Ball {
    private static readonly MOVEMENT_SPEED = 10;

    private keys: {
        up: boolean;
        down: boolean;
        left: boolean;
        right: boolean;
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
            right: false
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
        if (e.key.toLowerCase() === splitKey && isDown && this.onEvent) {
            this.onEvent({ type: 'split' });
        }
    }

    display() {
        super.display();
    }

    update() {
        if (this.keys.up) { 
            this.targetY -= PlayerBall.MOVEMENT_SPEED; 
        }
        if (this.keys.down) { 
            this.targetY += PlayerBall.MOVEMENT_SPEED; 
        }
        if (this.keys.left) { 
            this.targetX -= PlayerBall.MOVEMENT_SPEED; 
        }
        if (this.keys.right) { 
            this.targetX += PlayerBall.MOVEMENT_SPEED; 
        }

        super.update(this.targetX, this.targetY);
    }

    public collide(other: Ball): { gameOver: boolean; victory: boolean } {
        this.updateSize();
        other.updateSize();
        if (this.checkCollision(other).isColliding) {
            this.handleCollision(other);
            if (this.particles.length > other.particles.length) {
                const transferCount = Math.floor(other.particles.length * 0.1);
                other.transferParticlesTo(this, transferCount);

                if(other.particles.length <= 0) {
                    if (other instanceof PlayerBall && this instanceof PlayerBall) {
                        return {
                            gameOver: true,
                            victory: false
                        };
                    }
                }
            } else if (this.particles.length < other.particles.length) {
                const transferCount = Math.floor(this.particles.length * 0.1);
                this.transferParticlesTo(other, transferCount);
                if(this.particles.length <= 0) {
                    if (other instanceof PlayerBall && this instanceof PlayerBall) {
                        return {
                            gameOver: true,
                            victory: false  
                        };
                    }
                }
            } else {
                const totalParticles = this.particles.length + other.particles.length;
                const whiteParticles = this.countParticlesByColor("white") + other.countParticlesByColor("white");

                const ratio = whiteParticles / totalParticles;
                if (Math.abs(ratio - 0.5) < 0.1) { 
                    return {
                        gameOver: true,
                        victory: true 
                    };
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

        const offsetX = this.p5.random(-100, 100);
        const offsetY = this.p5.random(-100, 100);

        const newBall = new Ball(p5, this.x + offsetX, this.y + offsetY, this.color, 0);

        const particlesToTransfer = this.particles.splice(-particlesToSeparate);
        for (const particle of particlesToTransfer) {
            particle.flowTowards(newBall.x, newBall.y, 0.5);
            newBall.particles.push(particle);
        }

        this.updateSize();
        newBall.updateSize();

        return newBall;
    }
}
