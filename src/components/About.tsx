import { TypingAnimation } from "@/utils/TypingAnimation";
interface AboutProps {
    className?: string;
    onTypingComplete?: () => void;
}
    
export default function About({ className, onTypingComplete }: AboutProps) {
    const handleTypingComplete = () => {
        onTypingComplete?.();
    }
    return (
        <div className={`${className} w-full h-full bg-black text-white font-mono text-sm`}>
            <TypingAnimation text="Society progress through consensus" onComplete={handleTypingComplete} />
            <p className="text-center">
                This is a project that I am working on. It is a game that allows people to play together and make decisions together.
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
    );
}
