import { useState, useCallback } from "react";

import Header from "./components/Header";
import SideCanvas from "./components/SideCanvas";
import MainCanvas from "./components/MainCanvas";
import About from "./components/About";

function App() {
  const [isAboutVisible, setIsAboutVisible] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);

  const handleGameOver = useCallback(() => {
    if (!isGameOver) {
      setIsGameOver(true);
    }
  }, [isGameOver]);

  return (
    <div className="relative">
      <Header className="fixed top-0 left-0 w-full z-10"/>
      <div className="flex w-full h-[calc(100vh-64px)] mt-14">
        <MainCanvas 
          className={`main-canvas-container ${isGameOver ? 'flex-[3]' : 'w-full'}`} 
          onGameOver={handleGameOver}
        />
        {isGameOver && <SideCanvas className={`flex-[1] transition-transform duration-5000 ${
          isGameOver ? 'translate-x-0' : 'translate-x-full'
        }`}/>}
      </div>
      <About 
        className={`absolute top-0 left-0 z-20 transition-transform duration-1000 ${
          isAboutVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        onTypingComplete={() => {
          setTimeout(() => {
            setIsAboutVisible(false);
          }, 2000);
        }}
      />
    </div>
  )
}

export default App
