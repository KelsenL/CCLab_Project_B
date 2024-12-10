import p5 from "p5";

export default class Particle {
    vx: number;
    vy: number;
    lastBallX: number;
    lastBallY: number;
    size: number
    private lifetime: number;
    private age: number = 0;
    isDead: boolean = false;
    
    constructor(
        private p5: p5,
        private x: number,
        private y: number,
        public color: "white" | "black",
    ) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.p5 = p5;
        this.vx = p5.random(-1, 1);
        this.vy = p5.random(-1, 1);
        this.size = 6
        this.lastBallX = x;//help particles calculate moving direction
        this.lastBallY = y;
        this.lifetime = p5.random(200, 400);
    }

    update(ballX: number, ballY: number, radius: number) {
        const dx = this.x - ballX;
        const dy = this.y - ballY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Preferred angle and current position relative to ball center
        const currentAngle = Math.atan2(dy, dx);
        const targetAngle = this.getPreferredAngle(ballX, ballY);
        const angleDiff = this.normalizeAngle(targetAngle - currentAngle);
    
        // // Soft movement damping
        // const movementDampingFactor = 0.95;
        // this.vx *= movementDampingFactor;
        // this.vy *= movementDampingFactor;
        
        // Ideal distribution parameters
        const idealRadius = radius * 0.8;
        const maxDistributionForce = 0.3;
    
        // Comprehensive force calculation
        if (distance > radius) {
            // Strong pull back when outside radius
            const pullStrength = 0.5;
            this.vx -= (dx / distance) * pullStrength;
            this.vy -= (dy / distance) * pullStrength;
        } else {
            // Rotational and radial forces for even distribution
            const rotationForce = 0.05;
            
            // Rotational movement to prevent clustering
            this.vx += -dy / distance * rotationForce * Math.sign(angleDiff);
            this.vy += dx / distance * rotationForce * Math.sign(angleDiff);
    
            // Radial force to maintain ideal radius distribution
            const radialForce = maxDistributionForce * (distance - idealRadius) / radius;
            this.vx -= (dx / distance) * radialForce;
            this.vy -= (dy / distance) * radialForce;
        }
    
        // Speed limit and position update
        // const maxSpeed = 2.0;
        // const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        // if (speed > maxSpeed) {
        //     this.vx = (this.vx / speed) * maxSpeed;
        //     this.vy = (this.vy / speed) * maxSpeed;
        // }
    
        // Update position
        this.x += this.vx;
        this.y += this.vy;
    
        // Lifetime management
        this.age++;
        if (this.age >= this.lifetime) {
            this.isDead = true;
        }
    }

    getPreferredAngle(ballX: number, ballY: number): number {
        const ballMovementAngle = Math.atan2(ballY - this.lastBallY, ballX - this.lastBallX);
        const colorOffset = this.color === "white" ? -Math.PI/2 : Math.PI/2;
        const baseAngle = ballMovementAngle + colorOffset;
        const spread = Math.PI * 0.4;
        return baseAngle + (this.p5.random(-spread, spread));
    }

    normalizeAngle(angle: number): number {
        while (angle > Math.PI) angle -= 2 * Math.PI;
        while (angle < -Math.PI) angle += 2 * Math.PI;
        return angle;
    }

    display() {
        this.p5.noStroke();
        this.p5.fill(this.color === 'white' ? 255 : 0);
        this.p5.ellipse(this.x, this.y, this.p5.random(3, 6), this.p5.random(3, 6));
    }

    flowTowards(targetX: number, targetY: number, strength: number = 0.5) {
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const distanceStrength = Math.min(1.0, distance / 100);
            const adjustedStrength = strength * distanceStrength;

            const maxSpeed = 15;
            this.vx += (dx / distance) * adjustedStrength;
            this.vy += (dy / distance) * adjustedStrength;
            
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > maxSpeed) {
                const scale = maxSpeed / currentSpeed;
                this.vx *= scale;
                this.vy *= scale;
            }
            
            const damping = distance < 10 ? 0.8 : 0.95;
            this.vx *= damping;
            this.vy *= damping;

            const turbulence = Math.min(0.1, distance / 200);
            this.vx += this.p5.random(-turbulence, turbulence);
            this.vy += this.p5.random(-turbulence, turbulence);
        } else {
            this.vx *= 0.9;
            this.vy *= 0.9;
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
            // Consistent repositioning strategy
            const newRadius = maxRadius * (0.7 + this.p5.random(0, 0.1));
            
            // Soft repositioning with preservation of angular position
            this.x = centerX + newRadius * Math.cos(angle);
            this.y = centerY + newRadius * Math.sin(angle);
            
            // Reset velocity to prevent sudden movements
            this.vx = 0;
            this.vy = 0;
        }
    }

    cleanup() {
        this.vx = 0;
        this.vy = 0;
        this.age = 0;
        this.isDead = false;
        this.lastBallX = 0;
        this.lastBallY = 0;
    }

    reset(x: number, y: number, color: "white" | "black") {
        this.cleanup();
        this.x = x;
        this.y = y;
        this.color = color;
    }
}
