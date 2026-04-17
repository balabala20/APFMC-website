import React, { useState } from 'react';

export default function Login({ onLogin }){
  const [email,setEmail]=useState('admin@example.com');
  const [password,setPassword]=useState('password');
  async function submit(e){
    e.preventDefault();
    const res = await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const j = await res.json();
    if(j.token){
      localStorage.setItem('token', j.token);
      onLogin(j.token);
    } else alert('Login failed');
  }
  return (
    <div className="auth-center">
      <form className="card auth-card" onSubmit={submit}>
        <h2>Smart PF Login</h2>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input value={password} onChange={e=>setPassword(e.target.value)} type="password" placeholder="Password" />
        <button type="submit" className="btn">Login</button>
      </form>
    </div>
  );
}
