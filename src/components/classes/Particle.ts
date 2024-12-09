import p5 from "p5";

export default class Particle {
    vx: number;
    vy: number;
    lastBallX: number;
    lastBallY: number;
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
        this.lastBallX = x;
        this.lastBallY = y;
        this.lifetime = p5.random(200, 400);
    }

    update(ballX: number, ballY: number, radius: number) {
        const dx = this.x - ballX;
        const dy = this.y - ballY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > radius) {
            const angle = this.getPreferredAngle(ballX, ballY);
            const randomRadius = this.p5.random(radius * 0.3, radius * 0.9);
            this.x = ballX + randomRadius * Math.cos(angle);
            this.y = ballY + randomRadius * Math.sin(angle);
            this.vx = 0;
            this.vy = 0;
        } else {
            this.x += this.vx;
            this.y += this.vy;

            const currentAngle = Math.atan2(dy, dx);
            const targetAngle = this.getPreferredAngle(ballX, ballY);
            const angleDiff = this.normalizeAngle(targetAngle - currentAngle);
            
            const rotationForce = 0.1;
            this.vx += -dy / distance * rotationForce * Math.sign(angleDiff);
            this.vy += dx / distance * rotationForce * Math.sign(angleDiff);

            this.vx *= 0.98;
            this.vy *= 0.98;

            const maxSpeed = 3.0;
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (speed > maxSpeed) {
                this.vx = (this.vx / speed) * maxSpeed;
                this.vy = (this.vy / speed) * maxSpeed;
            }

            if (distance > radius * 0.8) {
                const pullStrength = 0.2 * (distance / radius);
                this.vx -= (dx / distance) * pullStrength;
                this.vy -= (dy / distance) * pullStrength;
            }
        }

        this.age++;
        if (this.age >= this.lifetime) {
            this.isDead = true;
        }

        this.lastBallX = ballX;
        this.lastBallY = ballY;
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
            this.vx += (dx / distance) * strength;
            this.vy += (dy / distance) * strength;
            
            const damping = 0.95;
            this.vx *= damping;
            this.vy *= damping;

            const turbulence = 0.1;
            this.vx += this.p5.random(-turbulence, turbulence);
            this.vy += this.p5.random(-turbulence, turbulence);
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
            const newRadius = this.p5.random(maxRadius * 0.3, maxRadius * 0.9);
            this.x = centerX + newRadius * Math.cos(angle);
            this.y = centerY + newRadius * Math.sin(angle);
        }
    }
    reset(x: number, y: number, color: "white" | "black") {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.age = 0;
        this.isDead = false;
    }
}
