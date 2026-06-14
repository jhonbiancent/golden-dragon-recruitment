"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  UserCheck, 
  FileText, 
  X, 
  Search, 
  ExternalLink,
  Plus,
  TrendingUp,
  Mail,
  Phone,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Layers,
  MapPin,
  Clock,
  DollarSign,
  Trash2,
  Edit2,
  AlertTriangle,
  Download,
  UserCog
} from "lucide-react";
import AccountsTab from "@/components/admin/AccountsTab";

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
  passType: string;
  linkedin?: string;
  portfolio?: string;
  resumeUrl?: string;
  coverLetter: string;
  noticePeriod: string;
  status: "applied" | "interviewing" | "rejected" | "hired";
  notes: RecruiterNote[];
  appliedAt: string;
}

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  salaryRange?: string;
  status: "active" | "closed";
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'applicants' | 'jobs' | 'accounts'>('applicants');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosition | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{type: 'job' | 'applicant', id: string} | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ field: 'name' | 'positionTitle' | 'appliedAt', direction: 'asc' | 'desc' }>({ field: 'appliedAt', direction: 'desc' });

  const [jobFormData, setJobFormData] = useState({
    title: "",
    department: "",
    location: "",
    description: "",
    salaryRange: "",
  });

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = `/api/jobs`;
      const method = editingJob ? 'PATCH' : 'POST';
      const body = editingJob ? { id: editingJob.id, ...jobFormData } : jobFormData;

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setIsJobModalOpen(false);
        setEditingJob(null);
        setShowSuccessModal(true);
        setJobFormData({
          title: "",
          department: "",
          location: "",
          description: "",
          salaryRange: "",
        });
        await fetchData();
        alert("Success: Data refreshed from server."); 
      } else {
        const errorData = await response.json();
        alert(`Failed to save job: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error saving job:", error);
    }
  };

  const deleteJob = async (id: string) => {
    try {
      const response = await fetch("/api/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setDeleteConfirmation(null);
        await fetchData();
        alert("Success: Job deleted and data refreshed.");
      }
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  }

  const deleteApplicant = async (id: string) => {
    try {
      const response = await fetch("/api/applicants", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (response.ok) {
        setDeleteConfirmation(null);
        setSelectedApplicant(null);
        await fetchData();
        alert("Success: Applicant deleted and data refreshed.");
      }
    } catch (error) {
      console.error("Error deleting applicant:", error);
    }
  }

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    if (deleteConfirmation.type === 'job') await deleteJob(deleteConfirmation.id);
    else await deleteApplicant(deleteConfirmation.id);
  }

  const editJob = (job: JobPosition) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title,
      department: job.department,
      location: job.location,
      description: job.description,
      salaryRange: job.salaryRange || "",
    });
    setIsJobModalOpen(true);
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, jobsRes, meRes] = await Promise.all([
        fetch("/api/applicants"),
        fetch("/api/jobs?t=" + Date.now()),
        fetch("/api/me")
      ]);
      const appData = await appRes.json();
      const jobsData = await jobsRes.json();
      const meData = await meRes.json();
      setApplicants(appData.applicants || []);
      setJobs(jobsData.jobs || []);
      setUserRole(meData.role || null);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        setApplicants(prev => 
          prev.map(app => {
            if (app.id === selectedApplicant.id) {
              return { ...app, notes: [...app.notes, data.note] };
            }
            return app;
          })
        );
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

  const downloadCSV = () => {
    const headers = ["Name", "Email", "Phone", "Position", "Pass Type", "Status", "Applied At"];
    const rows = applicants.map(app => [
        `"${app.name}"`,
        `"${app.email}"`,
        `"${app.phone}"`,
        `"${app.positionTitle}"`,
        `"${app.passType}"`,
        `"${app.status}"`,
        `"${app.appliedAt}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `applicants_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const statusColors: Record<Applicant["status"], string> = {
    applied: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    interviewing: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    hired: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };

  const totalCount = applicants.length;
  const interviewingCount = applicants.filter(a => a.status === "interviewing").length;
  const hiredCount = applicants.filter(a => a.status === "hired").length;

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.positionTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesPosition = positionFilter === "all" || app.positionId === positionFilter;
    return matchesSearch && matchesStatus && matchesPosition;
  });

  const sortedApplicants = [...filteredApplicants].sort((a, b) => {
    let aValue: any = a[sortConfig.field];
    let bValue: any = b[sortConfig.field];

    if (sortConfig.field === 'appliedAt') {
      return sortConfig.direction === 'asc' 
        ? new Date(aValue).getTime() - new Date(bValue).getTime()
        : new Date(bValue).getTime() - new Date(aValue).getTime();
    }
    
    if (sortConfig.field === 'positionTitle') {
        aValue = a.positionTitle.toLowerCase();
        bValue = b.positionTitle.toLowerCase();
    } else {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil((activeTab === 'applicants' ? sortedApplicants.length : jobs.length) / ITEMS_PER_PAGE);
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentItems = activeTab === 'applicants' 
    ? sortedApplicants.slice(indexOfFirst, indexOfLast)
    : jobs.slice(indexOfFirst, indexOfLast);

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 flex flex-col font-sans">
      
      {/* Admin Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070b15]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a href="/" className="h-10 w-10 rounded-xl bg-linear-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <ClipboardList className="h-5 w-5 text-white" />
            </a>
            <div>
              <span className="text-sm font-semibold text-slate-400 tracking-wider uppercase block leading-none">Internal ATS</span>
              <span className="text-lg font-bold text-white mt-1">Recruiter Dashboard</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/" className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium transition-colors">
              Candidate View
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="grow max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Tabs */}
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => { setActiveTab('applicants'); setCurrentPage(1); }}
            className={`pb-3 px-6 text-sm font-bold border-r border-slate-800 ${activeTab === 'applicants' ? 'text-gold-400 border-b-2 border-b-gold-400' : 'text-slate-500'}`}
          >
            Applicants
          </button>
          <button 
            onClick={() => { setActiveTab('jobs'); setCurrentPage(1); }}
            className={`pb-3 px-6 text-sm font-bold border-r border-slate-800 ${activeTab === 'jobs' ? 'text-gold-400 border-b-2 border-b-gold-400' : 'text-slate-500'}`}
          >
            Jobs
          </button>
          {userRole === 'admin' && (
            <button 
                onClick={() => { setActiveTab('accounts'); setCurrentPage(1); }}
                className={`pb-3 px-6 text-sm font-bold ${activeTab === 'accounts' ? 'text-gold-400 border-b-2 border-b-gold-400' : 'text-slate-500'}`}
            >
                Accounts
            </button>
          )}
        </div>

        {activeTab === 'applicants' && (
          <>
            {/* Stats Grid - Now responsive row */}
            <section className="flex flex-row flex-wrap gap-5">
              <div className="glass-card rounded-2xl p-5 flex items-center space-x-4 flex-1 min-w-50">
                <div className="h-12 w-12 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Total Applications</span>
                  <span className="text-2xl font-extrabold text-white mt-0.5">{totalCount}</span>
                </div>
              </div>
              <div className="glass-card rounded-2xl p-5 flex items-center space-x-4 flex-1 min-w-50">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Interviewing</span>
                  <span className="text-2xl font-extrabold text-white mt-0.5">{interviewingCount}</span>
                </div>
              </div>
              
              <div className="glass-card rounded-2xl p-5 flex items-center space-x-4 flex-1 min-w-50">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 block">Successfully Hired</span>
                  <span className="text-2xl font-extrabold text-emerald-400 mt-0.5">{hiredCount}</span>
                </div>
              </div>
            </section>

            {/* Filter */}
            <section className="glass-card rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
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

                <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto p-2 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                  {/* Position Filter */}
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-400"
                  >
                    <option value="all">All Positions</option>
                    {jobs.map(job => (
                        <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-400 capitalize"
                  >
                    <option value="all">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  {/* Sorting Controls */}
                  <select 
                    onChange={(e) => {
                        const [field, direction] = e.target.value.split('-');
                        setSortConfig({ field: field as any, direction: direction as any });
                    }}
                    value={`${sortConfig.field}-${sortConfig.direction}`}
                    className="bg-slate-900 border border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-400"
                  >
                    <option value="appliedAt-desc">Date (Newest)</option>
                    <option value="appliedAt-asc">Date (Oldest)</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="positionTitle-asc">Position (A-Z)</option>
                    <option value="positionTitle-desc">Position (Z-A)</option>
                  </select>

                  <button 
                    onClick={downloadCSV}
                    className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-700 hover:cursor-pointer text-white text-xs font-semibold flex items-center space-x-1"
                  >
                    <Download className="h-3 w-3" />
                    <span>Export</span>
                  </button>
                </div>
              </div>

              {/* Applicant Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20">
                {loading ? (
                  <div className="text-center py-12 text-slate-500">Loading applicant records...</div>
                ) : sortedApplicants.length > 0 ? (
                  <>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-4 px-6">#</th>
                          <th className="py-4 px-6">Applicant Name</th>
                          <th className="py-4 px-6">Position</th>
                          <th className="py-4 px-6">Applied Date</th>
                          <th className="py-4 px-6">Pass Type</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-sm">
                        {currentItems.map((app: any, index: number) => (
                          <tr 
                            key={app.id} 
                            className="hover:bg-slate-900/35 transition-colors cursor-pointer group"
                            onClick={() => setSelectedApplicant(app)}
                          >
                            <td className="py-4.5 px-6 text-slate-500">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
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
                            <td className="py-4.5 px-6 text-slate-400 text-xs capitalize">
                              {app.passType}
                            </td>
                            <td className="py-4.5 px-6">
                              <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColors[app.status as Applicant['status']]}`}>
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
                  </>
                ) : (
                  <div className="text-center py-16 text-slate-500">
                    <FileText className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                    <h3 className="text-slate-300 font-medium">No applications found</h3>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'jobs' && (
          <section className="glass-card rounded-2xl p-6 shadow-xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-white">Available Jobs</h3>
                <button 
                  onClick={() => { setIsJobModalOpen(true); setEditingJob(null); setJobFormData({ title: "", department: "", location: "", description: "", salaryRange: "" }); }}
                  className="px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 hover:cursor-pointer text-white font-semibold text-sm transition-all flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Job</span>
                </button>
             </div>
             
             <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-4 px-6">Job Title</th>
                      <th className="py-4 px-6">Department</th>
                      <th className="py-4 px-6">Location</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm">
                    {currentItems.map((job: any) => (
                      <tr key={job.id} className="hover:bg-slate-900/35 transition-colors">
                        <td className="py-4.5 px-6 font-semibold text-slate-100">{job.title}</td>
                        <td className="py-4.5 px-6 text-slate-300">{job.department}</td>
                        <td className="py-4.5 px-6 text-slate-300">{job.location}</td>
                        <td className="py-4.5 px-6 text-right">
                          <button onClick={() => editJob(job)} className="p-1.5 hover:text-gold-400 hover:cursor-pointer"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteConfirmation({type: 'job', id: job.id})} className="p-1.5 hover:text-rose-400 hover:cursor-pointer"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </section>
        )}
        
        {activeTab === 'accounts' && userRole === 'admin' && <AccountsTab />}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 py-4 border-t border-slate-800">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-50 text-sm font-medium hover:border-slate-600 transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-50 text-sm font-medium hover:border-slate-600 transition-colors flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      {/* Modals */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-slate-800 ">
            <h3 className="text-lg font-bold text-white mb-4">{editingJob ? 'Edit Job' : 'Create New Job'}</h3>
            <form onSubmit={handleJobSubmit} className="space-y-4">
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Job Title" required value={jobFormData.title} onChange={(e) => setJobFormData({...jobFormData, title: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200" />
              </div>
              <div className="relative">
                <Layers className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Department" required value={jobFormData.department} onChange={(e) => setJobFormData({...jobFormData, department: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200" />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Location" required value={jobFormData.location} onChange={(e) => setJobFormData({...jobFormData, location: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200" />
              </div>
              <textarea placeholder="Description" required value={jobFormData.description} onChange={(e) => setJobFormData({...jobFormData, description: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 resize-none" rows={3} />
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Salary Range (Optional)" value={jobFormData.salaryRange} onChange={(e) => setJobFormData({...jobFormData, salaryRange: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200" />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsJobModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-white text-sm font-semibold">{editingJob ? 'Save Changes' : 'Create Job'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 z-100 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-slate-800 text-center">
            <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Delete {deleteConfirmation.type === 'job' ? 'Job' : 'Applicant'}?</h3>
            <p className="text-sm text-slate-400 mb-6">Are you sure you want to delete this {deleteConfirmation.type}? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmation(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-slate-800 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
              <UserCheck className="h-6 w-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Job {editingJob ? 'Updated' : 'Created'}</h3>
            <p className="text-sm text-slate-400 mb-6">The job position has been {editingJob ? 'updated' : 'added'} successfully.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-white text-sm font-semibold">Close</button>
          </div>
        </div>
      )}

      {/* Applicant Drawer */}
      {selectedApplicant && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-[#090d18] border-l border-slate-800 shadow-2xl h-full flex flex-col relative animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div>
                  <span className="text-xs font-semibold text-gold-400 tracking-widest uppercase">Candidate Review</span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{selectedApplicant.name}</h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
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
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
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
                    <span className="text-slate-500 text-xs font-bold shrink-0 uppercase w-4.5">PSS</span>
                    <span>Pass Type: {selectedApplicant.passType}</span>
                  </div>
               
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedApplicant.linkedin && (
                    <a href={selectedApplicant.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 text-xs font-semibold hover:bg-gold-500/20 transition-colors">
                      <span>LinkedIn</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {selectedApplicant.portfolio && (
                    <a href={selectedApplicant.portfolio} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-850 transition-colors">
                      <span>Portfolio / Website</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {selectedApplicant.resumeUrl && (
                    <a href={selectedApplicant.resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-colors">
                      <span>Download Resume / CV</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                  Recruiter Notes
                </h4>
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
                <form onSubmit={handleAddNote} className="space-y-3 pt-2">
                  <textarea
                    rows={3}
                    required
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add interview assessment feedback, resume notes, or call logs here..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmation({type: 'applicant', id: selectedApplicant.id})}
                      className="px-4 py-2 rounded-xl bg-rose-900/20 hover:bg-rose-900/30 text-rose-400 font-semibold text-xs transition-colors flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Applicant</span>
                    </button>
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
      
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500">
          <span>&copy; 2026 Golden Dragon Careers Internal Application Tracking System.</span>
        </div>
      </footer>
    </div>
  );
}
