import { ReactP5Wrapper, Sketch } from "@p5-wrapper/react";

interface MainCanvasProps {
    className?: string;
}

export default function MainCanvas({ className }: MainCanvasProps) {
    const sketch: Sketch = (p5) => {
        p5.setup = () => {
            const canvas = p5.createCanvas(p5.windowWidth * 0.75, p5.windowHeight - 56);
            canvas.parent(p5.canvas.parentElement);
        }

        p5.windowResized = () => {
            p5.resizeCanvas(p5.windowWidth * 0.75, p5.windowHeight - 56);
        }

        p5.draw = () => {
            p5.background(255);
            p5.text("There will be a Game on this main canvas", 10, 10);
        }
    }
    return <ReactP5Wrapper sketch={sketch} className={className} />;
}
