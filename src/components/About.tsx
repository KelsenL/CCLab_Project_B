import { TypingAnimation } from "@/utils/TypingAnimation";
import SideCanvas from "./SideCanvas";
interface AboutProps {
    className?: string;
    onTypingComplete?: () => void;
    onGameOver: boolean
}
    
export default function About({className, onTypingComplete, onGameOver}: AboutProps) {
    const handleTypingComplete = () => {
        onTypingComplete?.();
    }
    return (
        <div className={` ${className} w-full h-full bg-black text-white font-mono text-sm fixed inset-0 mt-14`}>
            {!onGameOver && (
                <div className = "relative z-10">
                    <TypingAnimation text="Society progress through consensus" onComplete={handleTypingComplete} />
                    <p className="text-center mx-auto max-w-2xl px-4 my-6">
                        Countless words, count less, than the silent balance, between yin and yang
                    </p>
                    <div>
                        <h2 className="text-center text-xl font-bold mb-4">How to Play</h2>
                        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                            <div className="border border-white rounded px-3 py-1 text-center">W</div>
                            <div className="border border-white rounded px-3 py-1 text-center">↑</div>
                            <div className="border border-white rounded px-3 py-1 text-center">Move Up</div>
                            
                            <div className="border border-white rounded px-3 py-1 text-center">A</div>
                            <div className="border border-white rounded px-3 py-1 text-center">←</div>
                            <div className="border border-white rounded px-3 py-1 text-center">Move Left</div>
                            
                            <div className="border border-white rounded px-3 py-1 text-center">S</div>
                            <div className="border border-white rounded px-3 py-1 text-center">↓</div>
                            <div className="border border-white rounded px-3 py-1 text-center">Move Down</div>
                            
                            <div className="border border-white rounded px-3 py-1 text-center">D</div>
                            <div className="border border-white rounded px-3 py-1 text-center">→</div>
                            <div className="border border-white rounded px-3 py-1 text-center">Move Right</div>

                            <div className="border border-white rounded px-3 py-1 text-center">Q</div>
                            <div className="border border-white rounded px-3 py-1 text-center">/</div>
                            <div className="border border-white rounded px-3 py-1 text-center">Split out</div>
                        </div>
                    </div>
                </div>
            )}
            {onGameOver && (
                <div className = "relative z-10">
                    <TypingAnimation text="You have collaboratively reached consensus" onComplete={handleTypingComplete} />
                    <p className="text-center mx-auto max-w-2xl px-4 my-6">
                        The Tao gives birth to One. One gives birth to yin and yang. Yin and yang give birth to all things... The complete whole is the complete whole. So also is any part the complete whole... But forget about understanding and harmonizing and making all things one. The universe is already a harmonious oneness; just realize it.
                    </p>
                    <div className="fixed bottom-0 left-0 w-full h-1/3 z-50">
                        <SideCanvas/>
                    </div> 
                </div>               
            )}
        </div>
    );
}
