import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import Logo from '../components/Logo'

type Mode = 'login' | 'register'

const STATES = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'
]

export default function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return `(${digits}`
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
  }

  async function handleSubmit() {
    setError(''); setSuccess('')
    if (!email || !password) { setError('Preencha e-mail e senha.'); return }
    if (mode === 'register') {
      if (!name) { setError('Preencha seu nome completo.'); return }
      if (!phone) { setError('Preencha seu telefone.'); return }
      if (!city) { setError('Preencha sua cidade.'); return }
      if (!state) { setError('Selecione seu estado.'); return }
      if (password.length < 6) { setError('A senha precisa ter no mínimo 6 caracteres.'); return }
    }

    setLoading(true)

    if (mode === 'register') {
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: name } }
      })
      if (err) { setError(err.message); setLoading(false); return }

      // Salva dados extras no perfil
      if (data.user) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: name,
          phone: phone.replace(/\D/g, ''),
          city,
          state,
        })
      }

      setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.')
      setLoading(false)
      return
    }

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (err) { setError('E-mail ou senha incorretos.'); return }
    if (data.user) navigate('/welcome')
  }

  async function handleGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/welcome` }
    })
  }

  const s = {
    page: {
      minHeight: '100vh', background: 'var(--cream)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px', position: 'relative', overflow: 'hidden',
    } as React.CSSProperties,
    card: {
      background: 'white', borderRadius: '24px', padding: '48px',
      width: '100%', maxWidth: '480px',
      boxShadow: '0 24px 80px rgba(11,45,82,0.12), 0 0 0 1px rgba(11,45,82,0.06)',
      position: 'relative', zIndex: 1,
      animation: 'fadeInUp 0.5s ease both',
    } as React.CSSProperties,
    label: {
      display: 'block', fontSize: '13px', fontWeight: 600,
      color: 'var(--navy)', marginBottom: '6px',
    } as React.CSSProperties,
    input: {
      width: '100%', padding: '12px 16px', borderRadius: '10px',
      border: '1.5px solid var(--border)', fontSize: '14px',
      color: 'var(--navy)', outline: 'none', fontFamily: 'DM Sans, sans-serif',
      transition: 'border-color 0.2s', background: 'white',
    } as React.CSSProperties,
    select: {
      width: '100%', padding: '12px 16px', borderRadius: '10px',
      border: '1.5px solid var(--border)', fontSize: '14px',
      color: 'var(--navy)', outline: 'none', fontFamily: 'DM Sans, sans-serif',
      background: 'white', transition: 'border-color 0.2s',
    } as React.CSSProperties,
    btnGreen: {
      width: '100%', padding: '13px', borderRadius: '10px',
      fontSize: '15px', fontWeight: 600,
      background: 'var(--green)', color: 'var(--navy)',
      border: 'none', cursor: 'pointer',
      boxShadow: '0 2px 16px rgba(46,204,138,0.35)',
      transition: 'all 0.2s',
    } as React.CSSProperties,
    btnGoogle: {
      width: '100%', padding: '12px', borderRadius: '10px',
      fontSize: '14px', fontWeight: 500,
      background: 'white', color: 'var(--navy)',
      border: '1.5px solid var(--border)', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
      transition: 'all 0.2s',
    } as React.CSSProperties,
    row: {
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px',
    } as React.CSSProperties,
    error: {
      padding: '12px 16px', borderRadius: '10px',
      background: '#FDECEA', color: '#C0392B',
      fontSize: '13px', marginBottom: '16px',
    } as React.CSSProperties,
    successBox: {
      padding: '12px 16px', borderRadius: '10px',
      background: '#D4EDDA', color: '#155724',
      fontSize: '13px', marginBottom: '16px',
    } as React.CSSProperties,
  }

  const focusInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'var(--navy)')
  const blurInput = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) =>
    (e.currentTarget.style.borderColor = 'var(--border)')

  return (
    <div style={s.page}>
      <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(46,204,138,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-100px', left: '-100px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(11,45,82,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '32px' }}>
          <Logo size="lg" />
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: 800, color: 'var(--navy)', textAlign: 'center', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          {mode === 'login' ? 'Bem-vindo de volta' : 'Criar sua conta'}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center', marginBottom: '32px' }}>
          {mode === 'login' ? 'Entre para acessar suas vistorias' : 'Comece a automatizar suas vistorias'}
        </p>

        {error && <div style={s.error}>⚠️ {error}</div>}
        {success && <div style={s.successBox}>✅ {success}</div>}

        {/* Google */}
        <button style={s.btnGoogle} onClick={handleGoogle}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--navy)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0', color: 'var(--muted)', fontSize: '13px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          ou
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {mode === 'register' && (
            <>
              <div>
                <label style={s.label}>Nome completo *</label>
                <input style={s.input} placeholder="Seu nome completo" value={name}
                  onChange={e => setName(e.target.value)} onFocus={focusInput} onBlur={blurInput} />
              </div>

              <div>
                <label style={s.label}>Telefone / WhatsApp *</label>
                <input style={s.input} placeholder="(11) 99999-9999" value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  onFocus={focusInput} onBlur={blurInput} />
              </div>

              <div style={s.row}>
                <div>
                  <label style={s.label}>Cidade *</label>
                  <input style={s.input} placeholder="Ex: São Paulo" value={city}
                    onChange={e => setCity(e.target.value)} onFocus={focusInput} onBlur={blurInput} />
                </div>
                <div>
                  <label style={s.label}>Estado *</label>
                  <select style={s.select} value={state}
                    onChange={e => setState(e.target.value)} onFocus={focusInput} onBlur={blurInput}>
                    <option value="">UF</option>
                    {STATES.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label style={s.label}>E-mail *</label>
            <input style={s.input} type="email" placeholder="seu@email.com" value={email}
              onChange={e => setEmail(e.target.value)} onFocus={focusInput} onBlur={blurInput} />
          </div>

          <div>
            <label style={s.label}>Senha *</label>
            <input style={s.input} type="password" placeholder="••••••••" value={password}
              onChange={e => setPassword(e.target.value)} onFocus={focusInput} onBlur={blurInput}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            {mode === 'register' && (
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '4px' }}>
                Mínimo de 6 caracteres
              </p>
            )}
          </div>

          <button style={s.btnGreen} onClick={handleSubmit} disabled={loading}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--muted)', marginTop: '24px' }}>
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setSuccess('') }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--green-dark)', fontWeight: 600, fontSize: '14px', fontFamily: 'DM Sans, sans-serif' }}>
            {mode === 'login' ? 'Criar conta grátis' : 'Fazer login'}
          </button>
        </p>

        <p style={{ textAlign: 'center', marginTop: '12px' }}>
          <button onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: 'var(--muted)', fontFamily: 'DM Sans, sans-serif' }}>
            ← Voltar para o início
          </button>
        </p>
      </div>
    </div>
  )
}