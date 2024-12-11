import { useState, useCallback } from "react";

import Header from "./components/Header";
import MainCanvas from "./components/MainCanvas";
import About from "./components/About";

function App() {
  const [isAboutVisible, setIsAboutVisible] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);

  const handleGameOver = useCallback(() => {
    if (!isGameOver) {
      setIsGameOver(true);
      setIsAboutVisible(true);
    }
  }, [isGameOver]);

  return (
    <div className="relative min-h-screen">
      <Header className="fixed top-0 left-0 w-full z-10"/>
      <div className="w-full h-[calc(100vh-64px)] mt-14">
        <MainCanvas 
          className={`main-canvas-container ${isAboutVisible ? 'invisible' : 'visible'}`} 
          onGameOver={handleGameOver}
        />
      </div>
      <About 
        className={`fixeed top-0 left-0 z-20 transition-transform duration-1000 ${
          isAboutVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onTypingComplete={() => {
          setTimeout(() => {
            setIsAboutVisible(false);
          }, 2000);
        }}
        onGameOver={isGameOver}
      />
    </div>
  )
}

export default App
