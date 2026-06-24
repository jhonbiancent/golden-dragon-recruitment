"use client";

import { useActionState, useState } from 'react';
import { loginAction } from './actions';
import Turnstile from 'react-turnstile';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [state, action, isPending] = useActionState(
    loginAction, 
    { error: null as string | null }
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b15] p-6">
      <form action={action} className="glass-card w-full max-w-sm rounded-2xl p-8 border border-slate-800 space-y-6">
        <h1 className="text-2xl font-bold text-white text-center">Admin Login</h1>
        {state?.error && <p className="text-rose-400 text-sm text-center">{state.error}</p>}
        
        <input
          name="email"
          type="email"
          placeholder="Email"
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200"
          required
        />
        
        <div className="relative">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Turnstile Widget */}
        <Turnstile sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} onVerify={setToken} />
        
        <button 
            type="submit" 
            disabled={isPending || !token} 
            className="w-full py-3 rounded-xl bg-gold-600 hover:bg-gold-500 hover:cursor-pointer text-white font-semibold text-sm disabled:opacity-50"
        >
          {isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
