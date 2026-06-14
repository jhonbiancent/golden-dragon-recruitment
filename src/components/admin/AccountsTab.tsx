"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, UserCheck, X, AlertTriangle } from "lucide-react";

export default function AccountsTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({ email: "", password: "", name: "", role: "staff" });
  const [mfaData, setMfaData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{type: 'account', id: string} | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/accounts");
    const data = await res.json();
    setUsers(data.users || []);
    setLoading(false);
  };

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });
      
      if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to create account");
      }

      const data = await res.json();
      if (data.enrollmentId) {
        setMfaData({ ...data, email: formData.email, password: formData.password });
      }
    } catch (error: any) {
      console.error("Account creation failed:", error);
      alert(error.message);
    }
  };

  const deleteAccount = async () => {
    if (!deleteConfirmation) return;
    try {
      const res = await fetch("/api/accounts", {
        method: "DELETE",
        body: JSON.stringify({ id: deleteConfirmation.id }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setDeleteConfirmation(null);
        fetchUsers();
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }

  const verifyMFA = async () => {
    setVerificationError(null);
    setVerifying(true);
    const res = await fetch("/api/accounts/verify-mfa", {
      method: "POST",
      body: JSON.stringify({ 
        email: mfaData.email, 
        password: mfaData.password, 
        enrollmentId: mfaData.enrollmentId,
        code: verificationCode 
      }),
      headers: { "Content-Type": "application/json" }
    });
    
    setVerifying(false);

    if (res.ok) {
      setVerificationSuccess(true);
      setTimeout(() => {
        setMfaData(null);
        setShowModal(false);
        setVerificationSuccess(false);
        fetchUsers();
      }, 2000);
    } else {
      setVerificationError("Invalid code. Please try again.");
    }
  };

  return (
    <section className="glass-card rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white">Staff Accounts</h3>
        <button onClick={() => setShowModal(true)} className="px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-white font-semibold text-sm">
          <Plus className="h-4 w-4 inline mr-2" />
          Create Staff Account
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-4 px-6">Name</th>
              <th className="py-4 px-6">Email</th>
              <th className="py-4 px-6">Role</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm">
            {loading ? (
                [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                        <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-8 ml-auto"></div></td>
                    </tr>
                ))
            ) : (
                users.map((user: any) => (
                <tr key={user.id} className="hover:bg-slate-900/35 transition-colors">
                    <td className="py-4.5 px-6 font-semibold text-slate-100">{user.user_metadata?.name || 'N/A'}</td>
                    <td className="py-4.5 px-6 text-slate-300">{user.email}</td>
                    <td className="py-4.5 px-6 text-slate-300 capitalize">{user.app_metadata.role}</td>
                    <td className="py-4.5 px-6 text-right">
                        <button onClick={() => setDeleteConfirmation({type: 'account', id: user.id})} className="p-1.5 hover:text-rose-400"><Trash2 className="h-4 w-4" /></button>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 h-full w-full">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-slate-800">
            {!mfaData ? (
                <form onSubmit={createAccount} className="space-y-4">
                    <h3 className="text-lg font-bold text-white">Create Staff Account</h3>
                    <input type="text" placeholder="Name" required onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200" />
                    <input type="email" placeholder="Email" required onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200" />
                    <input type="password" placeholder="Password" required onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200" />
                    <select onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200">
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                    </select>
                    <div className="flex justify-end gap-3">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-slate-400">Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-xl bg-gold-600 text-white font-semibold">Next</button>
                    </div>
                </form>
            ) : (
                <div className="space-y-4 text-center">
                    <h3 className="text-lg font-bold text-white">Scan MFA QR Code</h3>
                    <div 
                        className="mx-auto w-64 h-64 bg-white p-2 [&>svg]:w-full [&>svg]:h-full"
                        dangerouslySetInnerHTML={{ __html: mfaData.qrCode.replace('data:image/svg+xml;utf-8,', '') }} 
                    />
                    
                    {verificationError && <p className="text-rose-400 text-sm">{verificationError}</p>}
                    {verificationSuccess && <p className="text-emerald-400 text-sm">Successfully authenticated!</p>}
                    
                    <input type="text" placeholder="6-digit Code" onChange={(e) => { setVerificationCode(e.target.value); setVerificationError(null); }} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm text-slate-200 text-center" />
                    
                    <button 
                      onClick={verifyMFA} 
                      disabled={verifying}
                      className={`w-full py-3 rounded-xl bg-gold-600 text-white font-semibold ${verifying ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {verifying ? "Verifying..." : "Verify & Finish"}
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
      
      {deleteConfirmation && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 h-full w-full">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-slate-800 text-center">
            <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Delete Account?</h3>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to delete this staff account? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmation(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold">Cancel</button>
              <button onClick={deleteAccount} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}
      
      {showSuccessModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 h-full w-full">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-slate-800 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <UserCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Success</h3>
            <p className="text-sm text-slate-400 mb-6">The category has been created successfully.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-white text-sm font-semibold">Close</button>
          </div>
        </div>
      )}
    </section>
  );
}
