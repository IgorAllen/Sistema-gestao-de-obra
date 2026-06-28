import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { HardHat, LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha o e-mail e a senha.');
      return;
    }

    if (!supabase) {
      setError('Banco de dados (Supabase) não configurado. Verifique as chaves.');
      return;
    }

    setLoading(true);
    setError(null);
    setMsg(null);

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (authError) throw authError;
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (authError) throw authError;
        setMsg('Conta criada com sucesso! Você já pode entrar.');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos.');
      } else if (err.message.includes('already registered')) {
        setError('Este e-mail já está cadastrado.');
      } else {
        setError(err.message || 'Ocorreu um erro.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="logo-icon" style={{ margin: '0 auto 16px', width: 64, height: 64, borderRadius: 20 }}>
            <HardHat size={32} strokeWidth={2} color="#0d0f14" />
          </div>
          <h1 style={{ fontSize: '2rem', marginBottom: 4 }}>ObraControl</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            {isLogin ? 'Faça login para acessar suas obras' : 'Crie sua conta para começar'}
          </p>
        </div>

        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          {error && (
            <div style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              {error}
            </div>
          )}
          
          {msg && (
            <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              {msg}
            </div>
          )}

          <form onSubmit={handleAuth}>
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <input
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Senha</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Aguarde...' : isLogin ? (
                <><LogIn size={18} /> Entrar</>
              ) : (
                <><UserPlus size={18} /> Criar Conta</>
              )}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center' }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMsg(null);
            }}
            style={{ border: 'none' }}
          >
            {isLogin ? 'Não tem uma conta? Crie uma aqui.' : 'Já tem uma conta? Faça login.'}
          </button>
        </div>
      </div>
    </div>
  );
}
