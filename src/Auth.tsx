import React, { useState } from 'react';
import { supabase } from './supabase';

export default function Auth({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage('Erro no login: ' + error.message);
    } else {
      setMessage('Acesso concedido com sucesso!');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage('Erro no cadastro: ' + error.message);
    } else {
      setMessage('Conta criada! Verifique sua caixa de entrada para confirmar o e-mail.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#141923]/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-800 text-3xl font-light leading-none transition-colors">&times;</button>
        
        <h2 className="text-3xl font-black tracking-tight text-[#0F3460] mb-2 text-center uppercase">VisuCheck</h2>
        <p className="text-center text-gray-500 mb-8 text-sm">Acesso à Plataforma</p>
        
        <form className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-[#4CAF8C] rounded-xl px-4 py-3 outline-none transition"
              placeholder="seu@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Senha</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border-2 border-transparent focus:border-[#4CAF8C] rounded-xl px-4 py-3 outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          {message && (
            <div className="text-sm text-center p-3 bg-blue-50 text-blue-700 rounded-xl font-medium border border-blue-100">
              {message}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              onClick={handleLogin}
              disabled={loading}
              className="flex-1 bg-[#0F3460] text-white py-4 rounded-xl font-bold hover:bg-blue-900 transition disabled:opacity-50 shadow-lg uppercase text-xs tracking-widest"
            >
              {loading ? 'Carregando...' : 'Entrar'}
            </button>
            <button 
              onClick={handleSignUp}
              disabled={loading}
              className="flex-1 border-2 border-[#4CAF8C] text-[#4CAF8C] py-4 rounded-xl font-bold hover:bg-teal-50 transition disabled:opacity-50 uppercase text-xs tracking-widest"
            >
              Criar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}