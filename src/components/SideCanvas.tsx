import { ReactP5Wrapper, Sketch } from "@p5-wrapper/react";
// import useLocalStorage from "../hooks/useLocalStorage";

import FlickeringGrid from "../utils/FlickeringGrid";
interface SideCanvasProps {
    className?: string;
}

export default function SideCanvas({ className }: SideCanvasProps) {
    let flickeringGrid: FlickeringGrid;
    // const [gameResults] = useLocalStorage<Array<{result: string, timestamp: string}>>('gameResults', []);

    const sketch: Sketch = (p5) => {


        p5.setup = () => {
            const canvas = p5.createCanvas(p5.windowWidth * 0.25, p5.windowHeight - 56);
            canvas.parent(canvas.elt.parentElement);
            flickeringGrid = new FlickeringGrid(p5, 4, 6, 0.1, 0.3);
        }

        p5.windowResized = () => {
            p5.resizeCanvas(p5.windowWidth * 0.25, p5.windowHeight - 56);
        }

        p5.draw = () => {
            p5.background(220);
            flickeringGrid.display();

        }
    }
    return <ReactP5Wrapper sketch={sketch} className={className} />;
}
