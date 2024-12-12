import p5 from "p5";
import Ball from "./Ball";

export default class PlayerBall extends Ball {
    private static readonly MOVEMENT_SPEED = 20;

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
        this.setupKeyboardControls();
        if (onEvent) {
            this.onEvent = onEvent;
        }
    }

    private setupKeyboardControls() {
        window.addEventListener('keydown', this.handleKeyPress.bind(this, true));
        window.addEventListener('keyup', this.handleKeyPress.bind(this, false));
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
            console.log('Split key pressed:', splitKey);
            this.keys[splitKey] = true;
            this.onEvent({ type: 'split' });
        }
        if (e.key.toLowerCase() === splitKey && !isDown) {
            this.keys[splitKey] = false;
        }
    }

    public display() {
        super.display();
        this.p5.push();
        const baseColor = this.color === 'white' ? 255 : 0;
        // Create oscillating opacity effect
        const opacity = this.p5.map(this.p5.sin(this.p5.frameCount * 0.1), -1, 1, 50, 200);
        this.p5.stroke(baseColor, opacity);
        this.p5.strokeWeight(3);
        this.p5.noFill();
        this.p5.circle(this.x, this.y, this.p5.map(this.p5.noise(this.p5.frameCount * 0.1), 0, 1, this.size, this.size * 1.5));
        this.p5.pop();
    }

    public update() {
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
    //for determing the winning condition
    private countParticlesByColor(color: "white" | "black"): number {
        return this.particles.filter(p => p.color === color).length;
    }
    
    public collide(other: Ball) {
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = (this.size + other.size) / 2;

        if (distance < minDistance) {
            const overlap = minDistance - distance;
            // Normalize the collision vector
            const nx = dx / distance;
            const ny = dy / distance;
            // Separate the balls to remove overlap
            this.x -= nx * overlap / 2;
            this.y -= ny * overlap / 2;
            this.targetX = this.x;//update target
            this.targetY = this.y;
            other.x += nx * overlap / 2;
            other.y += ny * overlap / 2;
            other.targetX = other.x;//update target
            other.targetY = other.y;
            if (other instanceof PlayerBall && this instanceof PlayerBall) {
                // const MINIMUM_PARTICLES = 10;
                if (this.particles.length !== other.particles.length) {
                    const larger = this.particles.length > other.particles.length ? this : other;
                    const smaller = this.particles.length > other.particles.length ? other : this;
                    const transferCount = Math.floor(smaller.particles.length);
                    for (let i = 0; i < transferCount; i++) {
                        smaller.transferParticleTo(larger);
                    }
                    // smaller.transferParticlesTo(larger, transferCount);
                    if(smaller.particles.length <= 0){
                        return {
                            gameOver: true,
                            victory: false
                        };
                    }
                }
                const thisWhiteRatio = this.countParticlesByColor("white") / this.particles.length;
                const otherWhiteRatio = other.countParticlesByColor("white") / other.particles.length;
                const colorRatio = Math.abs(thisWhiteRatio - otherWhiteRatio);
                
                const sizeRatio = Math.min(this.particles.length, other.particles.length) / 
                                 Math.max(this.particles.length, other.particles.length)
                // Victory condition - balanced particles
                if (colorRatio < 0.1 && 
                    sizeRatio > 0.8) { 
                    this.victoryAnimationReleaseParticles()
                    other.victoryAnimationReleaseParticles()
                    return {
                        gameOver: true,
                        victory: true 
                    };
                }
            }else{
                if (this.particles.length > other.particles.length) {
                    const transferCount = Math.floor(other.particles.length);
                    for (let i = 0; i < transferCount; i++) {
                        other.transferParticleTo(this);
                    }
                    // other.transferParticlesTo(this, transferCount);
                } 
            }

        }
        return {
            gameOver: false,
            victory: false
        };
    }

    public split(p5: p5): Ball | undefined {
        console.log('Split called, particles:', this.particles.length);
        const MIN_PARTICLES = 20;
        if (this.particles.length < MIN_PARTICLES) {
            console.log('Not enough particles to split');
            return undefined;
        }
        // Calculate the position of the new ball
        const offsetDistance = this.size * 1.5;
        const angle = Math.random() * Math.PI * 2;
        const offsetX = Math.cos(angle) * offsetDistance;
        const offsetY = Math.sin(angle) * offsetDistance;
        const newX = Math.max(this.size, Math.min(this.x + offsetX, p5.width - this.size));
        const newY = Math.max(this.size, Math.min(this.y + offsetY, p5.height - this.size));

        // Calculate particles to separate (30% of particles)
        const particlesToSeparate = Math.floor(this.particles.length * 0.3);
        
        if (particlesToSeparate < MIN_PARTICLES) {
            console.log('Too few particles to separate');
            return undefined;
        }

        // Calculate initial size based on particle count
        const particleRatio = particlesToSeparate / this.particles.length;
        const newSize = this.size * Math.sqrt(particleRatio); // Use square root for more natural scaling
        
        // Create new ball
        console.log('Creating new ball with size:', newSize);
        const newBall = new Ball(this.p5, newX, newY, this.color, newSize);
        newBall.targetX = newX;
        newBall.targetY = newY;

        // Transfer particles
        for (let i = 0; i < particlesToSeparate; i++) {
            this.transferParticleTo(newBall);
        }
        console.log('Split complete, new ball created with', particlesToSeparate, 'particles');
        
        return newBall;
    }
}
