"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  FileText, 
  X, 
  Search, 
  Filter, 
  ExternalLink,
  MessageSquare,
  Plus,
  TrendingUp,
  Mail,
  Phone,
  Briefcase,
  ChevronRight,
  ClipboardList
} from "lucide-react";

interface RecruiterNote {
  id: string;
  text: string;
  createdAt: string;
}

interface Applicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  positionId: string;
  positionTitle: string;
  experience: string;
  linkedin?: string;
  portfolio?: string;
  resumeUrl?: string;
  coverLetter: string;
  noticePeriod: string;
  status: "applied" | "interviewing" | "offered" | "rejected" | "hired";
  notes: RecruiterNote[];
  appliedAt: string;
}

export default function AdminDashboard() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  // Fetch applicants from API
  const fetchApplicants = async () => {
    try {
      const response = await fetch("/api/applicants");
      if (response.ok) {
        const data = await response.json();
        setApplicants(data.applicants || []);
      }
    } catch (error) {
      console.error("Failed to load applicants:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: Applicant["status"]) => {
    setSavingStatus(true);
    try {
      const response = await fetch("/api/applicants", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setApplicants(prev => 
          prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
        );
        if (selectedApplicant && selectedApplicant.id === id) {
          setSelectedApplicant(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !selectedApplicant) return;

    setSavingNote(true);
    try {
      const response = await fetch("/api/applicants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: selectedApplicant.id, note: noteText }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local applicants list note
        setApplicants(prev => 
          prev.map(app => {
            if (app.id === selectedApplicant.id) {
              return { ...app, notes: [...app.notes, data.note] };
            }
            return app;
          })
        );
        // Update selected applicant
        setSelectedApplicant(prev => 
          prev ? { ...prev, notes: [...prev.notes, data.note] } : null
        );
        setNoteText("");
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setSavingNote(false);
    }
  };

  // Status mapping colors
  const statusColors: Record<Applicant["status"], string> = {
    applied: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    interviewing: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    offered: "bg-gold-500/10 text-gold-400 border border-gold-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    hired: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };

  // Metrics calculation
  const totalCount = applicants.length;
  const interviewingCount = applicants.filter(a => a.status === "interviewing").length;
  const offeredCount = applicants.filter(a => a.status === "offered").length;
  const hiredCount = applicants.filter(a => a.status === "hired").length;

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.positionTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 flex flex-col font-sans">
      
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070b15]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a href="/" className="h-10 w-10 rounded-xl bg-gradient-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <ClipboardList className="h-5 w-5 text-white" />
            </a>
            <div>
              <span className="text-sm font-semibold text-slate-400 tracking-wider uppercase block leading-none">Internal ATS</span>
              <span className="text-lg font-bold text-white mt-1">Recruiter Dashboard</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a 
              href="/"
              className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium transition-colors"
            >
              Candidate View
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total */}
          <div className="glass-card rounded-2xl p-5 flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Total Applications</span>
              <span className="text-2xl font-extrabold text-white mt-0.5">{totalCount}</span>
            </div>
          </div>
          
          {/* Card 2: Interviewing */}
          <div className="glass-card rounded-2xl p-5 flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Interviewing</span>
              <span className="text-2xl font-extrabold text-white mt-0.5">{interviewingCount}</span>
            </div>
          </div>

          {/* Card 3: Offered */}
          <div className="glass-card rounded-2xl p-5 flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Offered Status</span>
              <span className="text-2xl font-extrabold text-white mt-0.5">{offeredCount}</span>
            </div>
          </div>

          {/* Card 4: Hired */}
          <div className="glass-card rounded-2xl p-5 flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 block">Successfully Hired</span>
              <span className="text-2xl font-extrabold text-white mt-0.5 text-emerald-400">{hiredCount}</span>
            </div>
          </div>
        </section>

        {/* Filter and Table Control Block */}
        <section className="glass-card rounded-2xl p-6 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            {/* Search inputs */}
            <div className="relative w-full md:max-w-md flex-1">
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search candidates by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500"
              />
            </div>

            {/* Status tabs */}
            <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl">
              {["all", "applied", "interviewing", "offered", "hired", "rejected"].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                    statusFilter === status 
                      ? "bg-gold-600 text-white shadow-sm" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20">
            {loading ? (
              <div className="text-center py-12 text-slate-500">Loading applicant records...</div>
            ) : filteredApplicants.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Applicant Name</th>
                    <th className="py-4 px-6">Position</th>
                    <th className="py-4 px-6">Applied Date</th>
                    <th className="py-4 px-6">Exp. Level</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {filteredApplicants.map((app) => (
                    <tr 
                      key={app.id} 
                      className="hover:bg-slate-900/35 transition-colors cursor-pointer group"
                      onClick={() => setSelectedApplicant(app)}
                    >
                      <td className="py-4.5 px-6">
                        <div className="font-semibold text-slate-100 group-hover:text-gold-400 transition-colors">
                          {app.name}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{app.email}</div>
                      </td>
                      <td className="py-4.5 px-6">
                        <div className="text-slate-200 font-medium">{app.positionTitle}</div>
                      </td>
                      <td className="py-4.5 px-6 text-slate-400 text-xs">
                        {new Date(app.appliedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </td>
                      <td className="py-4.5 px-6 text-slate-400 text-xs">
                        {app.experience}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[app.status]}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedApplicant(app)}
                          className="inline-flex items-center space-x-1 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                        >
                          <span>Review</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16 text-slate-500">
                <FileText className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <h3 className="text-slate-300 font-medium">No applications found</h3>
                <p className="text-xs text-slate-600 mt-0.5">Try widening your search terms or filters.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Recruiter Review Drawer (Fly-over) */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-[#090d18] border-l border-slate-800 shadow-2xl h-full flex flex-col relative animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <span className="text-xs font-semibold text-gold-400 tracking-widest uppercase">Candidate Review</span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedApplicant.name}</h3>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Pipeline Status update bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Hiring Pipeline Stage</span>
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize mt-1 ${statusColors[selectedApplicant.status]}`}>
                    {selectedApplicant.status}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    disabled={savingStatus}
                    value={selectedApplicant.status}
                    onChange={(e) => handleUpdateStatus(selectedApplicant.id, e.target.value as Applicant["status"])}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-gold-500"
                  >
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="offered">Offered</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Personal Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                  Contact & Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 text-sm text-slate-300">
                    <Mail className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                    <a href={`mailto:${selectedApplicant.email}`} className="hover:text-gold-400 transition-colors truncate">
                      {selectedApplicant.email}
                    </a>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-300">
                    <Phone className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                    <span>{selectedApplicant.phone}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-300">
                    <Briefcase className="h-4.5 w-4.5 text-slate-500 shrink-0" />
                    <span>Applying for: <strong>{selectedApplicant.positionTitle}</strong></span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-300">
                    <span className="text-slate-500 text-xs font-bold shrink-0 uppercase w-4.5">EXP</span>
                    <span>Experience: {selectedApplicant.experience}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm text-slate-300">
                    <span className="text-slate-500 text-xs font-bold shrink-0 uppercase w-4.5">Ntc</span>
                    <span>Notice Period: {selectedApplicant.noticePeriod}</span>
                  </div>
                </div>
                
                {/* Social Links */}
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedApplicant.linkedin && (
                    <a 
                      href={selectedApplicant.linkedin} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 text-xs font-semibold hover:bg-gold-500/20 transition-colors"
                    >
                      <span>LinkedIn</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {selectedApplicant.portfolio && (
                    <a 
                      href={selectedApplicant.portfolio} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-850 transition-colors"
                    >
                      <span>Portfolio / Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {selectedApplicant.resumeUrl && (
                    <a 
                      href={selectedApplicant.resumeUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-colors"
                    >
                      <span>Download Resume / CV</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {/* Cover Letter */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                  Cover Letter / Statement
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-900 whitespace-pre-wrap">
                  {selectedApplicant.coverLetter}
                </p>
              </div>

              {/* Recruiter Notes Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                  Recruiter Notes
                </h4>
                
                {/* Notes List */}
                {selectedApplicant.notes && selectedApplicant.notes.length > 0 ? (
                  <div className="space-y-3">
                    {selectedApplicant.notes.map((note) => (
                      <div key={note.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-850 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="font-semibold text-slate-400">Recruiter Log</span>
                          <span>{new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{note.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-slate-900 text-slate-650 text-xs">
                    No notes recorded for this candidate yet.
                  </div>
                )}

                {/* Add Note Form */}
                <form onSubmit={handleAddNote} className="space-y-3 pt-2">
                  <textarea
                    rows={3}
                    required
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add interview assessment feedback, resume notes, or call logs here..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={savingNote}
                      className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>{savingNote ? "Saving..." : "Add Note"}</span>
                    </button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500">
          <span>&copy; 2026 Golden Dragon Careers Internal Application Tracking System.</span>
        </div>
      </footer>
    </div>
  );
}
