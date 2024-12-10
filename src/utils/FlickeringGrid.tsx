import p5 from "p5";

export default class FlickeringGrid {
    private p5: p5;
    private squareSize: number;
    private gridGap: number;
    private flickerChance: number;
    private maxOpacity: number;
    private squares: number[][];
    private cols: number;
    private rows: number;

    constructor(
        p5: p5,
        squareSize: number = 4,
        gridGap: number = 6,
        flickerChance: number = 0.3,
        maxOpacity: number = 0.3
    ) {
        this.p5 = p5;
        this.squareSize = squareSize;
        this.gridGap = gridGap;
        this.flickerChance = flickerChance;
        this.maxOpacity = maxOpacity;
        this.cols = Math.floor(p5.width / (squareSize + gridGap));
        this.rows = Math.floor(p5.height / (squareSize + gridGap));
        this.squares = Array(this.cols).fill(0).map(() =>
            Array(this.rows).fill(0).map(() => Math.random() * maxOpacity)
        );
    }

    display() {
        for (let i = 0; i < this.cols; i++) {
            for (let j = 0; j < this.rows; j++) {
                if (Math.random() < this.flickerChance) {
                    this.squares[i][j] = Math.random() * this.maxOpacity;
                }
                this.p5.fill(0, 0, 0, this.squares[i][j] * 255);
                this.p5.noStroke();
                this.p5.rect(
                    i * (this.squareSize + this.gridGap),
                    j * (this.squareSize + this.gridGap),
                    this.squareSize,
                    this.squareSize
                );
            }
        }
    }
}
