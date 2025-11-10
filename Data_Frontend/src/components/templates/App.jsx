import React from 'react'
import MainHeader from '../organisms/MainHeader'
import { Outlet } from 'react-router-dom'
import './App.css'
import ScrollToTop from '../utils/ScrollToTop'

const App = () => {
  return (
    <div>
      <ScrollToTop />
      <MainHeader />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  )
}

export default App
