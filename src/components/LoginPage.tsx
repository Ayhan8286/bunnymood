import React, { useState } from 'react';
import { login, register } from '../lib/auth';
import type { AuthUser } from '../lib/auth';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shaking, setShaking] = useState(false);

  const shake = (msg: string) => {
    setError(msg);
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) return shake('Please fill in both fields 🌸');

    if (mode === 'register') {
      if (password !== confirm) return shake('Passwords don\'t match 🐰');
      if (password.length < 3) return shake('Password needs to be at least 3 characters!');
    }

    setLoading(true);
    const { user, error: err } = mode === 'login'
      ? await login(name, password)
      : await register(name, password);
    setLoading(false);

    if (err || !user) return shake(err ?? 'Something went wrong 🌸');
    onLogin(user);
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    setError('');
    setPassword('');
    setConfirm('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: 'linear-gradient(160deg, #fff0f5 0%, #f8e8ff 50%, #fff8f0 100%)',
      position: 'fixed',
      inset: 0,
      zIndex: 200,
    }}>
      {/* Background blobs */}
      <div style={{ position:'absolute',top:'5%',right:'5%',width:200,height:200,borderRadius:'50%',background:'radial-gradient(circle,#fcd5e150,transparent)',filter:'blur(30px)',pointerEvents:'none' }} />
      <div style={{ position:'absolute',bottom:'8%',left:'3%',width:260,height:260,borderRadius:'50%',background:'radial-gradient(circle,#e8d5f555,transparent)',filter:'blur(40px)',pointerEvents:'none' }} />

      {/* Hero */}
      <div className="animate-float" style={{ fontSize: '5rem', marginBottom: '0.4rem' }}>🐰</div>
      <h1 style={{ fontFamily:'Pacifico,cursive', fontSize:'2.4rem', color:'var(--rose-dark)', textShadow:'0 2px 12px rgba(224,122,154,0.2)', marginBottom:'0.2rem' }}>BunnyMood</h1>
      <p style={{ color:'var(--text-muted)', marginBottom:'2rem', fontSize:'0.9rem' }}>
        {mode === 'login' ? 'welcome back, love 🌸' : 'let\'s make your safe space 🌸'}
      </p>

      {/* Mode toggle pills */}
      <div style={{ display:'flex', background:'rgba(255,255,255,0.7)', borderRadius:50, padding:4, gap:4, marginBottom:'1.5rem', border:'1.5px solid var(--rose-light)' }}>
        {(['login','register'] as const).map(m => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(''); setPassword(''); setConfirm(''); }}
            style={{
              padding:'0.55rem 1.6rem', fontSize:'0.88rem',
              background: mode === m ? 'linear-gradient(135deg,var(--rose),var(--rose-dark))' : 'none',
              boxShadow: mode === m ? 'var(--shadow-pink)' : 'none',
              color: mode === m ? 'white' : 'var(--text-muted)',
            }}
          >
            {m === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      {/* Card */}
      <div
        className="card login-card"
        style={{
          width:'100%', maxWidth:380, margin:0,
          animation: shaking ? 'shake 0.5s ease' : undefined,
        }}
      >
        <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(6px)}}`}</style>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column' }}>
          <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-light)', marginBottom:'0.35rem' }}>✨ Your name</label>
          <input type="text" placeholder="what's your name?" value={name} onChange={e => { setName(e.target.value); setError(''); }} autoComplete="off" />

          <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-light)', marginBottom:'0.35rem' }}>🔑 Password</label>
          <input type="password" placeholder="your little secret…" value={password} onChange={e => { setPassword(e.target.value); setError(''); }} />

          {mode === 'register' && (
            <>
              <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-light)', marginBottom:'0.35rem' }}>🔑 Confirm Password</label>
              <input type="password" placeholder="again, just to be sure 🌸" value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }} />
            </>
          )}

          {error && <p style={{ color:'var(--rose-dark)', fontSize:'0.83rem', textAlign:'center', marginBottom:'0.75rem', fontWeight:600 }}>{error}</p>}

          <button type="submit" disabled={loading} style={{ width:'100%', padding:'1rem', fontSize:'1rem', marginTop:'0.25rem' }}>
            {loading ? '…' : mode === 'login' ? 'Enter my space 🌸' : 'Create my space 🌸'}
          </button>
        </form>
      </div>

      <button onClick={switchMode} style={{ background:'none', boxShadow:'none', color:'var(--text-muted)', fontSize:'0.8rem', marginTop:'1rem', padding:'0.4rem' }}>
        {mode === 'login' ? 'New here? Create an account →' : 'Already have an account? Sign in →'}
      </button>

      <p style={{ color:'var(--text-muted)', fontSize:'0.7rem', marginTop:'1.5rem' }}>made with 💕 just for you</p>
    </div>
  );
};

export default LoginPage;
