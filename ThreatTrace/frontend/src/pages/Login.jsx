import React from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
    const navigate = useNavigate()
    function handleLogin(e){
        e.preventDefault()
        navigate('/dashboard')
    }
    return (
        <div style={{maxWidth:400, margin:'80px auto'}}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
                <div><label>Email</label><input type="email" required/></div>
                <div><label>Password</label><input type="password" required/></div>
                <button type="submit">Login</button>
            </form>
        </div>
    )
}
