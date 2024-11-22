interface AboutProps {
    className?: string;
}
    
export default function About({ className }: AboutProps) {
    return (
        <div className={`${className} w-full h-full bg-black text-white font-mono text-sm`}>
            <p>Here, we would first introduce the game and the concept of the project. Then, this component would be a place to show the result of each game round would slide down and the canvas would show up</p>
        </div>
    );
}
