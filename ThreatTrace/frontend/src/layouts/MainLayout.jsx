import React from 'react'
import { Outlet, Link } from 'react-router-dom'

export default function MainLayout(){
    return (
        <div className="flex min-h-screen">
            <aside style={{width:220, background:'#0b1020', color:'#fff', padding:20}}>
                <h2 style={{fontSize:22}}>ThreatTrace</h2>
                <nav style={{marginTop:20}}>
                    <ul style={{listStyle:'none', padding:0}}>
                        <li><Link to="/dashboard" style={{color:'#fff'}}>Dashboard</Link></li>
                        <li style={{marginTop:8}}><Link to="/globe" style={{color:'#fff'}}>3D Globe</Link></li>
                    </ul>
                </nav>
            </aside>
            <main style={{flex:1, padding:20}}>
                <Outlet />
            </main>
        </div>
    )
}
