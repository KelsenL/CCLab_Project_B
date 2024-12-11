import p5 from "p5";

export default class Particle {
    vx: number;
    vy: number;
    size: number
    initialOffsetX: number;
    initialOffsetY: number;

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
        // 更新目标位置（跟随球体）
        this.targetX = ballX + this.initialOffsetX;
        this.targetY = ballY + this.initialOffsetY;

        // 1. 计算并应用基础跟随力
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const followStrength = 0.1;
        this.vx += dx * followStrength;
        this.vy += dy * followStrength;

        // 2. 添加少量噪声，使运动更自然
        const time = this.p5.frameCount * 0.01;
        this.vx += (this.p5.noise(this.x * 0.02, this.y * 0.02, time) - 0.5) * 0.02;
        this.vy += (this.p5.noise(this.x * 0.02, this.y * 0.02, time + 1000) - 0.5) * 0.02;

        // 3. 应用阻尼
        this.vx *= 0.98;
        this.vy *= 0.98;

        // 4. 更新位置
        this.x += this.vx;
        this.y += this.vy;
        
        // 5. 确保位置在球内（作为安全检查）
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
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            const distanceStrength = Math.min(1.2, distance / 60);
            const adjustedStrength = strength * distanceStrength;
            
            const attractionForce = 1.0;
            this.vx += (dx / distance) * adjustedStrength * attractionForce;
            this.vy += (dy / distance) * adjustedStrength * attractionForce;
            
            const orbitCorrection = 0.5;
            const targetAngle = Math.atan2(dy, dx);
            const currentAngle = Math.atan2(this.vy, this.vx);
            const angleCorrection = targetAngle - currentAngle;
            this.vx += Math.cos(angleCorrection) * orbitCorrection;
            this.vy += Math.sin(angleCorrection) * orbitCorrection;
            
            const maxSpeed = Math.min(18, distance * 0.4);
            const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (currentSpeed > maxSpeed) {
                const scale = maxSpeed / currentSpeed;
                this.vx *= scale;
                this.vy *= scale;
            }
            
            const baseDamping = 0.96;
            const distanceDamping = Math.max(0.95, Math.min(0.98, distance / 150));
            this.vx *= distance < 30 ? baseDamping : distanceDamping;
            this.vy *= distance < 30 ? baseDamping : distanceDamping;
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
        this.initialOffsetX = this.x - ballX;
        this.initialOffsetY = this.y - ballY;
        // 更新目标位置
        this.targetX = ballX;
        this.targetY = ballY;
    }
}
