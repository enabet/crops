import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage(){
  const [email,setEmail]=useState('')
  const [password,setPassword]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const {login}=useAuth()
  const navigate=useNavigate()

  async function submit(e:FormEvent){
    e.preventDefault(); setBusy(true); setError('')
    try { await login(email,password); navigate('/farms') }
    catch { setError('Invalid email or password.') }
    finally { setBusy(false) }
  }

  return <div className="auth-shell">
    <div className="auth-visual"><div><h1>CARDI</h1><p>Regional Agricultural Intelligence & Crop Management Platform</p></div></div>
    <form className="auth-card" onSubmit={submit}>
      <div className="brand-mark">CARDI</div>
      <h2>Welcome back</h2>
      <p className="muted">Sign in to manage farms and agricultural records.</p>
      <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
      <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
      {error && <div className="alert error">{error}</div>}
      <button disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
    </form>
  </div>
}
