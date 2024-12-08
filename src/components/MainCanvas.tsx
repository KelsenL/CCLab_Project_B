import { ReactP5Wrapper, Sketch } from "@p5-wrapper/react";
import PlayerBall from "./classes/PlayerBall";
import Ball from "./classes/Ball";
import FlickeringGrid from "../utils/FlickeringGrid";
import p5 from 'p5';
import { useState, useEffect, useRef, useCallback } from "react";
import useLocalStorage from "../hooks/useLocalStorage";
import { ParticlePool } from "./classes/ParticlePool";
import Particle from "./classes/Particle";
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

    const handleSplit = useCallback(
        (p5: p5, player: PlayerBall) => {
            const now = Date.now();
            if (splitTimeRef.current && now - splitTimeRef.current < 100) {
                return;
            }
            splitTimeRef.current = now;

            const newBall = player.split(p5);
            if (newBall) {
                setGameState((prev) => ({
                    ...prev,
                    balls: [...prev.balls, newBall],
                }));
            }
        },
        [setGameState]
    );

    const splitTimeRef = useRef<number>(0);

    const [victoryParticles, setVictoryParticles] = useState<Particle[]>([]);

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
                300,
                () => handleSplit(p5, gameStateRef.current.player1!)
            );

                const player2 = new PlayerBall(
                    p5, 
                    p5.random(100, p5.windowWidth - 100), 
                    p5.random(100, p5.windowHeight - 100), 
                    "black",
                    "player2", 
                    300,
                    () => handleSplit(p5, gameStateRef.current.player2!)
                );

            setGameState({
                player1,
                player2,
                balls: [],
                flickeringGrid
            });
        };

        p5.setup = () => {
            const parentElement = document.querySelector('.main-canvas-container');
            if (!parentElement) return;
            
            p5.createCanvas(
                parentElement.clientWidth,
                p5.windowHeight - 56
            );
            
            initializeGame();
        };

        p5.draw = () => {
            if (!isGameActive) return;

            const state = gameStateRef.current;
            if (!state.flickeringGrid || !state.player1 || !state.player2) {
                return;
            }

            p5.background(220);
            
            state.flickeringGrid.display();
            
            state.player1.update();
            state.player1.display();
            state.player2.update();
            state.player2.display();
            state.balls.forEach(ball => {
                ball.update(ball.targetX, ball.targetY);
                ball.display();
            });

            let collisionResult = { gameOver: false, victory: false };
            
            const ballsToRemove: Ball[] = [];

            for (const ball of state.balls) {
                const result1 = state.player1?.collide(ball);
                const result2 = state.player2?.collide(ball);
                
                if (!(ball instanceof PlayerBall) && (
                    ball.particles.length <= 0 || 
                    (state.player1 && ball.particles.length < state.player1.particles.length * 0.05) ||
                    (state.player2 && ball.particles.length < state.player2.particles.length * 0.05)
                )) {
                    ballsToRemove.push(ball);
                }
                
                if (result1?.gameOver) {
                    collisionResult = result1;
                    break;
                }
                if (result2?.gameOver) {
                    collisionResult = result2;
                    break;
                }
            }

            if (ballsToRemove.length > 0) {
                state.balls = state.balls.filter(ball => !ballsToRemove.includes(ball));
            }

            if (!collisionResult.gameOver) {
                const playerCollision = state.player1?.collide(state.player2!);
                if (playerCollision?.gameOver) {
                    collisionResult = playerCollision;
                }
            }

            if (collisionResult.gameOver) {
                if (collisionResult.victory) {
                    state.player1?.victoryAnimationReleaseParticles();
                    state.player2?.victoryAnimationReleaseParticles();
                    state.balls.forEach(ball => ball.victoryAnimationReleaseParticles());
                    const centerX = p5.width / 2;
                    const centerY = p5.height / 2;
                    const radius = Math.min(p5.width, p5.height) / 4;

                    if (victoryParticles.length === 0) {
                        const pool = ParticlePool.getInstance();

                        const newParticles = [];

                        for (let i = 0; i < 360; i += 5) {
                            const angle = p5.radians(i);
                            const x = centerX + radius * Math.cos(angle);
                            const y = centerY + radius * Math.sin(angle);
                            const color = i < 180 ? "white" : "black";

                            const particle = pool.acquire(p5, x, y, color);
                            particle.vx = p5.random(-2, 2);
                            particle.vy = p5.random(-2, 2);
                            newParticles.push(particle);
                        }
                        setVictoryParticles(newParticles);
                        setIsGameActive(false);
                        onGameOverRef.current?.();
                        setGameResultsRef.current(prev => [...prev, {
                            victory: true,
                            timestamp: new Date().toISOString()
                        }]);
                    }

                    victoryParticles.forEach(particle => {
                        const dx = particle.position.x - centerX;
                        const dy = particle.position.y - centerY;
                        // const angle = Math.atan2(dy, dx);
                        const speed = 2;
                        
                        particle.vx += -dy / Math.sqrt(dx * dx + dy * dy) * speed;
                        particle.vy += dx / Math.sqrt(dx * dx + dy * dy) * speed;
                        
                        particle.update(centerX, centerY, radius);
                        particle.display();
                    });
                } else {
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
    }, [handleSplit, victoryParticles, isGameActive]);

    useEffect(() => {
        return () => {
            victoryParticles.forEach(particle => {
                ParticlePool.getInstance().release(particle);
            });
        };
    }, [victoryParticles]);

    return (
        <div className={className}>
            <ReactP5Wrapper sketch={sketch} />
        </div>
    );
}
