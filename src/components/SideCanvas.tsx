import { ReactP5Wrapper, Sketch } from "@p5-wrapper/react";
import useLocalStorage from "../hooks/useLocalStorage";

import FlickeringGrid from "../utils/FlickeringGrid";
import { GameResult } from "@/lib/GameResult";
import { analyzeVictoryGaps } from "@/lib/analyzeVictoryGaps";

interface SideCanvasProps {
    className?: string;
}

export default function SideCanvas({ className }: SideCanvasProps) {
    let flickeringGrid: FlickeringGrid;
    const [gameResults] = useLocalStorage<GameResult[]>('gameResults', []);

    const sketch: Sketch = (p5) => {


        p5.setup = () => {
            const canvas = p5.createCanvas(p5.windowWidth, p5.windowHeight / 3);
            canvas.parent(canvas.elt.parentElement);
            flickeringGrid = new FlickeringGrid(p5, 4, 6, 0.1, 0.3);
        };

        p5.windowResized = () => {
            p5.resizeCanvas(p5.windowWidth, p5.windowHeight / 3);
        };

        p5.draw = () => {
            flickeringGrid.display();

            const gaps = analyzeVictoryGaps(gameResults);

            if (gaps.length > 0) {
                p5.push();
                p5.noFill();
                const gradient = p5.drawingContext.createLinearGradient(0, 0, p5.width, 0);
                gradient.addColorStop(0, "black");
                gradient.addColorStop(0.5, "white");
                gradient.addColorStop(1, "grey");
                (p5.drawingContext as CanvasRenderingContext2D).strokeStyle = gradient;

                p5.strokeWeight(3);
                p5.beginShape();
                gaps.forEach((gap, index) => {
                    const x = p5.map(index, 0, gaps.length - 1, 50, p5.width - 50);
                    const y = p5.map(
                        gap.failureCount,
                        0,
                        Math.max(...gaps.map(g => g.failureCount)),
                        p5.height - 50,
                        50
                    );

                    p5.curveVertex(x, y);
                    if (index === 0) p5.curveVertex(x, y);
                    if (index === gaps.length - 1) p5.curveVertex(x, y);
                });
                p5.endShape();

                gaps.forEach((gap, index) => {
                    const x = p5.map(index, 0, gaps.length - 1, 50, p5.width - 50);
                    const y = p5.map(
                        gap.failureCount,
                        0,
                        Math.max(...gaps.map(g => g.failureCount)),
                        p5.height - 50,
                        50
                    );

                    p5.push();
                    p5.fill(255, 0, 0, 150 + p5.sin(p5.frameCount * 0.1) * 100);
                    p5.stroke(255);
                    p5.strokeWeight(2);
                    p5.circle(x, y, 12 + p5.sin(p5.frameCount * 0.2) * 4);
                    p5.pop();
                });
                p5.pop();
            }
        };
    };

    return <ReactP5Wrapper sketch={sketch} className={className} />;
}
