import { ReactP5Wrapper, Sketch } from "@p5-wrapper/react";
import PlayerBall from "./classes/PlayerBall";
import Ball from "./classes/Ball";
import FlickeringGrid from "../utils/FlickeringGrid";
import p5 from 'p5';
import { useState, useEffect, useRef, useCallback } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { GameResult } from "@/lib/GameResult";
interface MainCanvasProps {
    className?: string;
    onGameOver?: () => void;
}
interface GameState {
    player1: PlayerBall | null;
    player2: PlayerBall | null;
    balls: Ball[];
    flickeringGrid: FlickeringGrid | null;
}

export default function MainCanvas({ className, onGameOver }: MainCanvasProps) {
    const [gameState, setGameState] = useState<GameState>({
        player1: null,
        player2: null,
        balls: [],
        flickeringGrid: null
    });
    const [, setGameResults] = useLocalStorage<GameResult[]>('gameResults', []);
    const gameStateRef = useRef<GameState>(gameState);

    const onGameOverRef = useRef(onGameOver);
    useEffect(() => {
        onGameOverRef.current = onGameOver;
    }, [onGameOver]);

    const setGameResultsRef = useRef(setGameResults);
    useEffect(() => {
        setGameResultsRef.current = setGameResults;
    }, [setGameResults]);

    useEffect(() => {
        gameStateRef.current = gameState;
    }, [gameState]);

    const lastSplitTime = useRef(0);

    const handleSplit = useCallback(
        (p5: p5, player: PlayerBall) => {
            const now = Date.now();
            const cooldown = 500; // 500ms cooldown
            
            if (now - lastSplitTime.current < cooldown) {
                return; // 如果冷却时间未到，直接返回
            }
            
            console.log('handleSplit called');
            const newBall = player.split(p5);
            if (newBall) {
                console.log('Adding new ball to state');
                setGameState((prev) => ({
                    ...prev,
                    balls: [...prev.balls, newBall],
                }));
                lastSplitTime.current = now; // 更新最后分裂时间
            }
        },
        [setGameState]
    );

    const [isGameActive, setIsGameActive] = useState(true);

    const sketch: Sketch = useCallback((p5) => {
        const initializeGame = () => {
            const flickeringGrid = new FlickeringGrid(p5, 4, 6, 0.1, 0.3);
            
            const player1 = new PlayerBall(
                p5, 
                p5.random(100, p5.windowWidth - 100), 
                p5.random(100, p5.windowHeight - 100), 
                "white",
                "player1", 
                200,
                () => handleSplit(p5, gameStateRef.current.player1!)
            );

            const player2 = new PlayerBall(
                p5, 
                p5.random(100, p5.windowWidth - 100), 
                p5.random(100, p5.windowHeight - 100), 
                "black",
                "player2", 
                200,
                () => handleSplit(p5, gameStateRef.current.player2!)
            );

            console.log('Initializing player1:', player1);
            console.log('Initializing player2:', player2);

            setGameState({
                player1,
                player2,
                balls: [],
                flickeringGrid
            });
        };

        p5.setup = () => {
            const parentElement = document.querySelector('.main-canvas-container');
            if (!parentElement) {
                console.error('Cannot find .main-canvas-container element');
                return;
            }
            
            p5.createCanvas(
                parentElement.clientWidth,
                p5.windowHeight - 56
            );
            
            console.log('Initializing game...');
            initializeGame();
            console.log('Game initialized');
        };

        p5.draw = () => {
            if (!isGameActive) return;

            const state = gameStateRef.current;
            if (!state.flickeringGrid || !state.player1 || !state.player2) {
                console.error('Game state is incomplete:', state);
                return;
            }

            p5.background(220);
            
            state.flickeringGrid.display();
            
            console.log('Player positions:', {
                player1: { x: state.player1.x, y: state.player1.y },
                player2: { x: state.player2.x, y: state.player2.y }
            });
            
            state.player1.update();
            state.player1.display();
            console.log('Player1 rendered');
            state.player2.update();
            state.player2.display();
            console.log('Player2 rendered');

            console.log('Number of balls:', state.balls.length);
            state.balls.forEach((ball, index) => {
                console.log(`Ball ${index}:`, { x: ball.x, y: ball.y, size: ball.size });
                ball.update(ball.targetX, ball.targetY);
                ball.display();
            });

            let collisionResult = { gameOver: false, victory: false };

            // Handle collisions with non-player balls
            for (const ball of state.balls) {
                const result1 = state.player1.collide(ball);
                const result2 = state.player2.collide(ball);

                if (result1.gameOver) {
                    collisionResult = result1;
                    break;
                }
                if (result2.gameOver) {
                    collisionResult = result2;
                    break;
                }
                if(ball.particles.length === 0) {
                    state.balls.splice(state.balls.indexOf(ball), 1);
                }
                //check victory condition
            }

            // Handle player-to-player collision
            if (!collisionResult.gameOver && state.player1 && state.player2) {
                const playerCollision = state.player1.collide(state.player2);
                if (playerCollision.gameOver) {
                    collisionResult = playerCollision;
                }
            }

            // Handle game over and victory conditions
            if (collisionResult.gameOver){
                if(collisionResult.victory) {
                    setIsGameActive(false);
                    onGameOverRef.current?.();
                    setGameResultsRef.current(prev => [...prev, {
                        victory: true,
                        timestamp: new Date().toISOString()
                    }]);
                } else {
                    onGameOverRef.current?.();
                    setGameResultsRef.current(prev => [...prev, {
                        victory: false,
                        timestamp: new Date().toISOString()
                    }]);
                    initializeGame();
                } 
            }
        };

        p5.windowResized = () => {
            const parentElement = document.querySelector('.main-canvas-container');
            if (!parentElement) return;
            
            p5.resizeCanvas(
                parentElement.clientWidth,
                p5.windowHeight - 56
            );
        };
    }, [handleSplit, isGameActive]);

    return (
        <div className={className}>
            <ReactP5Wrapper sketch={sketch} />
        </div>
    );
}
