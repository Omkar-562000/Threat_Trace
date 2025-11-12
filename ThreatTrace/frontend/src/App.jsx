import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import GlobeView from './pages/GlobeView'

export default function App(){
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Login/>} />
                <Route element={<MainLayout/>}>
                    <Route path='/dashboard' element={<Dashboard/>} />
                    <Route path='/globe' element={<GlobeView/>} />
                </Route>
            </Routes>
        </BrowserRouter>
    )
}
