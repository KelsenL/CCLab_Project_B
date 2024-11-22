// import { useState } from 'react'
// import reactLogo from '@/assets/react.svg'
// import viteLogo from './vite.svg'
import Header from "./components/Header";
import SideCanvas from "./components/SideCanvas";
import MainCanvas from "./components/MainCanvas";
import About from "./components/About";

function App() {

  return (
    <>
      <Header className="fixed top-0 left-0 w-full z-10"/>
      <div className="flex w-full h-[calc(100vh-64px)] mt-16">
        <MainCanvas className="flex-[3]"/>
        <SideCanvas className="flex-[1]"/>
      </div>
      <About className="relative z-10 w-full h-full"/>
    </>
  )
}

export default App
