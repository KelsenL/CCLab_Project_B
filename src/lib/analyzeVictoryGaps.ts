import { GameResult } from "@/lib/GameResult";

interface VictoryGap {
    startTime: string;
    endTime: string;
    failureCount: number;
}

export function analyzeVictoryGaps(gameResults: GameResult[]):VictoryGap[] {
    const gaps: VictoryGap[] = [];
    let currentGap: VictoryGap | null = null
    const sortedResults = [...gameResults].sort(
        (a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    for (let i = 0; i < sortedResults.length; i++){
        const result = sortedResults[i];
        if(result.victory){
            if(currentGap){
                currentGap.endTime = result.timestamp
                gaps.push(currentGap)
            }
            currentGap = {
                startTime: result.timestamp,
                endTime: result.timestamp,
                failureCount:0
            }
        }else if (currentGap){
            currentGap.failureCount++
        }
    }
    return gaps
} 