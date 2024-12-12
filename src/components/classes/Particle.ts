import p5 from "p5";

export default class Particle {
    vx: number;
    vy: number;
    size: number
    initialOffsetX: number;
    initialOffsetY: number;
    public isFlowing: boolean = false;

    constructor(
        private p5: p5,
        private x: number,
        private y: number,
        public color: "white" | "black",
        private targetX: number,
        private targetY: number
    ) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.p5 = p5;
        this.vx = p5.random(-1, 1);
        this.vy = p5.random(-1, 1);
        this.size = 6
        this.targetX = x;
        this.targetY = y;
        this.initialOffsetX = x - targetX;
        this.initialOffsetY = y - targetY;
    }

    public update(ballX: number, ballY: number, radius: number) {
        // update target location
        this.targetX = ballX + this.initialOffsetX;
        this.targetY = ballY + this.initialOffsetY;

        // follow the target
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        // Check if it should exit the flowing state
        if (this.isFlowing) {
            const toCenterX = this.x - ballX;
            const toCenterY = this.y - ballY;
            const centerDistance = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY);
            
            if (centerDistance < radius * 0.9) {
                this.isFlowing = false;
            }
        } else {
            // If not in flowing state but distance to target is too far, it means it needs to flow again
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > radius * 1.5) {
                this.isFlowing = true;
            }
        }
        
        // Adjust the following force
        const followStrength = this.isFlowing ? 0.08 : 0.12;
        this.vx += dx * followStrength;
        this.vy += dy * followStrength;

        // add gentle noise
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;

        // apply stronger damping
        this.vx *= 0.92;
        this.vy *= 0.92;

        // update position
        this.x += this.vx;
        this.y += this.vy;
        
        // 5. position correction
        const ballDx = this.x - ballX;
        const ballDy = this.y - ballY;
        const ballDistance = Math.sqrt(ballDx * ballDx + ballDy * ballDy);
        
        if (ballDistance > radius) {
            const scale = radius / ballDistance * 0.9;
            this.x = ballX + ballDx * scale;
            this.y = ballY + ballDy * scale;
            this.vx *= 0.5;
            this.vy *= 0.5;
        }
    }

    public display() {
        this.p5.noStroke();
        this.p5.fill(this.color === 'white' ? 255 : 0);
        this.p5.ellipse(this.x, this.y, this.p5.random(5, 10), this.p5.random(5, 10));
    }

    flowTowards(targetX: number, targetY: number, strength: number = 0.5) {
        this.isFlowing = true;
        
        // Calculate direction and distance
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Adjust strength based on distance
            const distanceStrength = Math.min(1.5, distance / 50);
            const adjustedStrength = strength * distanceStrength;
            
            // Add basic attraction force
            this.vx += (dx / distance) * adjustedStrength;
            this.vy += (dy / distance) * adjustedStrength;
            
            // Limit speed
            const maxSpeed = 8;
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > maxSpeed) {
                const scale = maxSpeed / currentSpeed;
                this.vx *= scale;
                this.vy *= scale;
            }
        }
    }

    get position() {
        return { x: this.x, y: this.y };
    }

    reposition(centerX: number, centerY: number, maxRadius: number) {
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > maxRadius) {
            const angle = Math.atan2(dy, dx);
            const newRadius = maxRadius * 0.85;
            const targetX = centerX + newRadius * Math.cos(angle);
            const targetY = centerY + newRadius * Math.sin(angle);
        
            const transitionSpeed = 0.15;
            this.x = this.x + (targetX - this.x) * transitionSpeed;
            this.y = this.y + (targetY - this.y) * transitionSpeed;
            
            const speedDamping = 0.85;
            this.vx *= speedDamping;
            this.vy *= speedDamping;
            
            const centeringForce = 0.15;
            this.vx -= (dx / distance) * centeringForce;
            this.vy -= (dy / distance) * centeringForce;
        }
    }

    public resetOffset(ballX: number, ballY: number) {
        // Determine the initial position of the particle based on its color
        const angle = this.color === 'white' ? 
            Math.random() * Math.PI - Math.PI/2 :  // White: -π/2 to π/2
            Math.random() * Math.PI + Math.PI/2;   // Black: π/2 to 3π/2
        const distance = Math.random() * 0.7 + 0.2; // 0.2 to 0.9 distance, to avoid too close to center or edge
        this.initialOffsetX = Math.cos(angle) * distance * 30;
        this.initialOffsetY = Math.sin(angle) * distance * 30;
        this.targetX = ballX;
        this.targetY = ballY;
    }
}
