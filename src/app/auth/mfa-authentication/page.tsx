"use client";

import { useActionState } from 'react';
import { verifyMfaAction } from './actions';

export default function MFAChallengePage() {
  const [state, action, isPending] = useActionState(
    verifyMfaAction, 
    { error: null as string | null }
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070b15] p-6">
      <form action={action} className="glass-card w-full max-w-sm rounded-2xl p-8 border border-slate-800 space-y-6">
        <h1 className="text-2xl font-bold text-white text-center">Multifactor Authentication (MFA) Verification</h1>
        {state?.error && <p className="text-rose-400 text-sm text-center">{state.error}</p>}
        
        <input
          name="code"
          type="text"
          placeholder="6-digit code"
          maxLength={6}
          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 text-center"
          required
        />
        
        <button 
            type="submit" 
            disabled={isPending} 
            className="w-full py-3 rounded-xl bg-gold-600 hover:bg-gold-500 hover:cursor-pointer text-white font-semibold text-sm disabled:opacity-50"
        >
          {isPending ? 'Verifying...' : 'Verify'}
        </button>
      </form>
    </div>
  );
}
