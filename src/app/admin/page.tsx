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
  UserCog,
  Loader2
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
  whatsapp_number: string;
  gender: string;
  nationality: string;
  current_location: string;
  positionId?: string;
  positionTitle: string;
  passType: string;
  linkedin?: string;
  portfolio?: string;
  resumeUrl?: string;
  coverLetter: string;
  status: "applied" | "interviewing" | "rejected" | "hired";
  notes: RecruiterNote[];
  appliedAt: string;
}

interface JobCategory {
    id: string;
    name: string;
    description: string;
    location: string;
}

interface JobPosition {
  id: string;
  category_id: string;
  position: string;
  salary_range?: string;
  status: "active" | "closed";
  category?: { id: string; name: string; description: string; location: string };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'applicants' | 'jobs' | 'accounts'>('applicants');
  const [activeJobsTab, setActiveJobsTab] = useState<'positions' | 'categories'>('positions');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [appCategoryFilter, setAppCategoryFilter] = useState("all");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  
  // Modals & Forms
  const [isJobModalOpen, setIsJobModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showCategorySuccessModal, setShowCategorySuccessModal] = useState(false);
  
  // Processing states for modal buttons
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  const [editingJob, setEditingJob] = useState<JobPosition | null>(null);
  const [editingCategory, setEditingCategory] = useState<JobCategory | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{type: 'job' | 'applicant' | 'category', id: string} | null>(null);
  
  const [jobFormData, setJobFormData] = useState({ categoryId: "", position: "", salaryRange: "" });
  const [catFormData, setCatFormData] = useState({ name: "", description: "", location: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

  const [fetchingResume, setFetchingResume] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, jobsRes, meRes, catRes] = await Promise.all([
        fetch("/api/applicants"),
        fetch("/api/jobs?type=positions&t=" + Date.now()),
        fetch("/api/me"),
        fetch("/api/jobs?type=categories&t=" + Date.now())
      ]);
      const appData = await appRes.json();
      const jobsData = await jobsRes.json();
      const meData = await meRes.json();
      const catData = await catRes.json();
      setApplicants(appData.applicants || []);
      setJobs(jobsData.jobs || []);
      setCategories(catData.categories || []);
      setUserRole(meData.role || null);
      setUserId(meData.id || null);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateStatus = async (id: string, newStatus: Applicant["status"]) => {
    setSavingStatus(true);
    try {
      const response = await fetch("/api/applicants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (response.ok) {
        setApplicants(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedApplicant.id, note: noteText }),
      });

      if (response.ok) {
        const data = await response.json();
        setApplicants(prev => prev.map(app => {
            if (app.id === selectedApplicant.id) return { ...app, notes: [...app.notes, data.note] };
            return app;
        }));
        setSelectedApplicant(prev => prev ? { ...prev, notes: [...prev.notes, data.note] } : null);
        setNoteText("");
      }
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setSavingNote(false);
    }
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPosition(true);
    try {
        const url = `/api/jobs`;
        const method = editingJob ? 'PATCH' : 'POST';
        const body = editingJob ? { id: editingJob.id, ...jobFormData } : jobFormData;
        const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (response.ok) {
            setIsJobModalOpen(false); setEditingJob(null); setJobFormData({ categoryId: "", position: "", salaryRange: "" });
            await fetchData(); setShowSuccessModal(true);
        } else alert("Failed to save position.");
    } finally {
        setIsSavingPosition(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSavingCategory(true);
      try {
          const url = `/api/jobs`;
          const method = editingCategory ? 'PATCH' : 'POST';
          const body = editingCategory ? { id: editingCategory.id, ...catFormData, type: 'category' } : {...catFormData, type: 'category'};
          const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          if (response.ok) {
              setIsCategoryModalOpen(false); setEditingCategory(null); setCatFormData({ name: "", description: "", location: "" });
              await fetchData(); setShowCategorySuccessModal(true);
          } else alert("Failed to save category.");
      } finally {
          setIsSavingCategory(false);
      }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    const response = await fetch("/api/jobs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteConfirmation.id, type: deleteConfirmation.type }),
    });
    if (response.ok) {
        setDeleteConfirmation(null);
        await fetchData();
    } else alert("Failed to delete.");
  };

  const editJob = (job: JobPosition) => {
    setEditingJob(job);
    setJobFormData({ position: job.position, categoryId: job.category_id, salaryRange: job.salary_range || "" });
    setIsJobModalOpen(true);
  }

  const editCategory = (cat: JobCategory) => {
      setEditingCategory(cat);
      setCatFormData({ name: cat.name, description: cat.description, location: cat.location });
      setIsCategoryModalOpen(true);
  }

  const downloadCSV = () => {
    const headers = ["Name", "Email", "WhatsApp Number", "Gender", "Nationality", "Location", "Position", "Pass Type", "Status", "Applied At"];
    const rows = applicants.map(app => [
        `"${app.name}"`, `"${app.email}"`, `"${app.whatsapp_number}"`, `"${app.gender}"`, `"${app.nationality}"`, `"${app.current_location}"`, `"${app.positionTitle}"`, `"${app.passType}"`, `"${app.status}"`, `"${app.appliedAt}"`
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `applicants_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleDownloadResume = async (filePath: string) => {
    if (fetchingResume) return;
    setFetchingResume(true);
    try {
      const response = await fetch(`/api/applicants/resume?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      if (response.ok && data.signedUrl) {
        window.open(data.signedUrl, '_blank');
      } else {
        alert(data.error || "Failed to access resume.");
      }
    } catch (error) {
      console.error("Error fetching resume URL:", error);
      alert("Something went wrong while accessing the resume.");
    } finally {
      setFetchingResume(false);
    }
  };

  const statusColors: Record<Applicant["status"], string> = {
    applied: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    interviewing: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    rejected: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
    hired: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  };

  const filteredApplicants = applicants.filter(app => {
    const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          app.positionTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesPosition = positionFilter === "all" || app.positionId === positionFilter;
    
    const job = jobs.find(j => j.id === app.positionId);
    const matchesCategory = appCategoryFilter === "all" || (job && job.category_id === appCategoryFilter);
    
    return matchesSearch && matchesStatus && matchesPosition && matchesCategory;
  });

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || job.category_id === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const paginationSource =
    activeTab === "applicants"
      ? filteredApplicants
      : activeTab === "jobs" && activeJobsTab === "positions"
      ? filteredJobs
      : activeTab === "jobs" && activeJobsTab === "categories"
      ? categories
      : [];

  const totalPages = Math.ceil(paginationSource.length / ITEMS_PER_PAGE);
  const indexOfFirst = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = paginationSource.slice(indexOfFirst, indexOfFirst + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#070b15] text-slate-100 flex flex-col font-sans">
      <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-[#070b15]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a href="/" className="h-10 w-10 rounded-xl bg-linear-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <ClipboardList className="h-5 w-5 text-white" />
            </a>
            <div>
              <span className="text-sm font-semibold text-slate-400 tracking-wider uppercase block leading-none">Applicant Tracking System</span>
              <span className="text-lg font-bold text-white mt-1">Recruiter Dashboard</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <a href="/" className="text-xs px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium transition-colors hover:cursor-pointer">
              Candidate View
            </a>
          </div>
        </div>
      </header>

      <main className="grow max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        <div className="flex border-b border-slate-800">
          <button onClick={() => { setActiveTab('applicants'); setCurrentPage(1); }} className={`pb-3 px-6 text-sm font-bold border-r border-slate-800 hover:cursor-pointer ${activeTab === 'applicants' ? 'text-gold-400 border-b-2 border-b-gold-400' : 'text-slate-500'}`}>Applicants</button>
          <button onClick={() => { setActiveTab('jobs'); setCurrentPage(1); }} className={`pb-3 px-6 text-sm font-bold border-r border-slate-800 hover:cursor-pointer ${activeTab === 'jobs' ? 'text-gold-400 border-b-2 border-b-gold-400' : 'text-slate-500'}`}>Jobs</button>
          {userRole === 'admin' && <button onClick={() => { setActiveTab('accounts'); setCurrentPage(1); }} className={`pb-3 px-6 text-sm font-bold border-r border-slate-800 hover:cursor-pointer ${activeTab === 'accounts' ? 'text-gold-400 border-b-2 border-b-gold-400' : 'text-slate-500'}`}>Accounts</button>}
        </div>

        {activeTab === 'applicants' && (
          <>
            <section className="flex flex-row flex-wrap gap-5">
              <div className="glass-card rounded-2xl p-5 flex items-center space-x-4 flex-1 min-w-50">
                <div className="h-12 w-12 rounded-xl bg-gold-500/10 border border-gold-500/25 flex items-center justify-center text-gold-400"><Users className="h-6 w-6" /></div>
                <div><span className="text-xs font-medium text-slate-500 block">Total Applications</span><span className="text-2xl font-extrabold text-white mt-0.5">{applicants.length}</span></div>
              </div>
              <div className="glass-card rounded-2xl p-5 flex items-center space-x-4 flex-1 min-w-50">
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400"><TrendingUp className="h-6 w-6" /></div>
                <div><span className="text-xs font-medium text-slate-500 block">Interviewing</span><span className="text-2xl font-extrabold text-white mt-0.5">{applicants.filter(a => a.status === 'interviewing').length}</span></div>
              </div>
              <div className="glass-card rounded-2xl p-5 flex items-center space-x-4 flex-1 min-w-50">
                <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400"><UserCheck className="h-6 w-6" /></div>
                <div><span className="text-xs font-medium text-slate-500 block">Successfully Hired</span><span className="text-2xl font-extrabold text-emerald-400 mt-0.5">{applicants.filter(a => a.status === 'hired').length}</span></div>
              </div>
            </section>

            <section className="glass-card rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                <div className="relative w-full md:max-w-md flex-1">
                  <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-500" />
                  <input type="text" placeholder="Search candidates..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-900/60 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-gold-500" />
                </div>
                <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto p-2 bg-slate-950/80 border border-slate-800/80 rounded-xl">
                  <select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} className="bg-slate-900 border border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:cursor-pointer">
                    <option value="all">All Positions</option>
                    {jobs.map(job => <option key={job.id} value={job.id}>{job.position}</option>)}
                  </select>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-slate-900 border border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-400 capitalize hover:cursor-pointer">
                    <option value="all">All Statuses</option>
                    <option value="applied">Applied</option>
                    <option value="interviewing">Interviewing</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button onClick={downloadCSV} className="px-3 py-1.5 rounded-lg bg-emerald-400 hover:bg-emerald-700 hover:cursor-pointer text-white text-xs font-semibold flex items-center space-x-1"><Download className="h-3 w-3" /><span>Export</span></button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20">
                {loading ? <div className="text-center py-12 text-slate-500">Loading...</div> : currentItems.length > 0 ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-4 px-6">#</th>
                          <th className="py-4 px-6">Name</th>
                          <th className="py-4 px-6">Position</th>
                          <th className="py-4 px-6">Date</th>
                          <th className="py-4 px-6">Pass Type</th>
                          <th className="py-4 px-6">Status</th>
                          <th className="py-4 px-6 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-sm">
                        {currentItems.map((app: any, index: number) => (
                          <tr key={app.id} className="hover:bg-slate-900/35 transition-colors cursor-pointer group" onClick={() => setSelectedApplicant(app)}>
                            <td className="py-4.5 px-6 text-slate-500">{indexOfFirst + index + 1}</td>
                            <td className="py-4.5 px-6 font-semibold text-slate-100 group-hover:text-gold-400 transition-colors">{app.name}<div className="text-xs text-slate-500">{app.email}</div></td>
                            <td className="py-4.5 px-6 font-medium">{app.positionTitle}</td>
                            <td className="py-4.5 px-6 text-slate-400">{new Date(app.appliedAt).toLocaleDateString()}</td>
                            <td className="py-4.5 px-6 capitalize">{app.passType}</td>
                            <td className="py-4.5 px-6"><span className={`px-2 py-0.5 rounded-lg text-xs font-semibold capitalize ${statusColors[app.status as Applicant['status']]}`}>{app.status}</span></td>
                            <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}><button onClick={() => setSelectedApplicant(app)} className="p-1.5 hover:text-gold-400 transition-colors hover:cursor-pointer"><ChevronRight className="h-4 w-4" /></button></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : <div className="text-center py-16 text-slate-500">No applications found</div>}
              </div>
            </section>
          </>
        )}

        {activeTab === 'jobs' && (
          <section className="glass-card rounded-2xl p-6 shadow-xl">
             <div className="flex border-b border-slate-800 mb-6 gap-4">
                <button onClick={() => { setActiveJobsTab('positions'); setCurrentPage(1); }} className={`pb-3 text-sm font-bold hover:cursor-pointer ${activeJobsTab === 'positions' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-slate-500'}`}>Positions</button>
                <button onClick={() => { setActiveJobsTab('categories'); setCurrentPage(1); }} className={`pb-3 text-sm font-bold hover:cursor-pointer ${activeJobsTab === 'categories' ? 'text-gold-400 border-b-2 border-gold-400' : 'text-slate-500'}`}>Categories</button>
             </div>
             
             {activeJobsTab === 'positions' ? (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex flex-wrap items-center gap-4">
                          <h3 className="text-lg font-bold text-white">Positions</h3>
                          <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="bg-slate-900 border border-slate-700 text-xs px-2 py-1.5 rounded-lg text-slate-400 hover:cursor-pointer">
                              <option value="all">All Categories</option>
                              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                          </select>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => { setIsJobModalOpen(true); setEditingJob(null); setJobFormData({ position: "", categoryId: "", salaryRange: "" }); }} className="px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 hover:cursor-pointer text-white font-semibold text-sm transition-all flex items-center space-x-2 shrink-0"><Plus className="h-4 w-4" /><span>Create New Position</span></button>
                        </div>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Position</th>
                                    <th className="py-4 px-6">Category</th>
                                    <th className="py-4 px-6">Salary Range</th>
                                    <th className="py-4 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-sm">
                                {currentItems.map((job: any) => (
                                    <tr key={job.id} className="hover:bg-slate-900/35 transition-colors">
                                        <td className="py-4.5 px-6 font-semibold text-slate-100">{job.position}</td>
                                        <td className="py-4.5 px-6 text-slate-300">{job.category?.name || 'N/A'}</td>
                                        <td className="py-4.5 px-6 text-slate-400">{job.salary_range || 'Not Specified'}</td>
                                        <td className="py-4.5 px-6 text-right">
                                            <button onClick={() => editJob(job)} className="p-1.5 hover:text-gold-400 hover:cursor-pointer transition-colors"><Edit2 className="h-4 w-4" /></button>
                                            <button onClick={() => setDeleteConfirmation({type: 'job', id: job.id})} className="p-1.5 hover:text-rose-400 hover:cursor-pointer transition-colors"><Trash2 className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
             ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-white">Categories</h3>
                        <button onClick={() => { setIsCategoryModalOpen(true); setEditingCategory(null); setCatFormData({ name: "", description: "", location: "" }); }} className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition-all hover:cursor-pointer flex items-center space-x-2"><Plus className="h-4 w-4" /><span>Create New Category</span></button>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/20">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800 bg-slate-900/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 px-6">Name</th>
                                    <th className="py-4 px-6">Description</th>
                                    <th className="py-4 px-6">Location</th>
                                    <th className="py-4 px-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 text-sm">
                                {currentItems.map((cat: any) => (
                                    <tr key={cat.id} className="hover:bg-slate-900/35 transition-colors">
                                        <td className="py-4.5 px-6 text-slate-100 font-semibold">{cat.name}</td>
                                        <td className="py-4.5 px-6 text-slate-300 line-clamp-1 max-w-xs">{cat.description}</td>
                                        <td className="py-4.5 px-6 text-slate-300">{cat.location}</td>
                                        <td className="py-4.5 px-6 text-right">
                                            <button onClick={() => editCategory(cat)} className="p-1.5 hover:text-gold-400 hover:cursor-pointer transition-colors"><Edit2 className="h-4 w-4" /></button>
                                            <button onClick={() => setDeleteConfirmation({type: 'category', id: cat.id})} className="p-1.5 hover:text-rose-400 hover:cursor-pointer transition-colors"><Trash2 className="h-4 w-4" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
             )}
          </section>
        )}
        
        {activeTab === 'accounts' && userRole === 'admin' && <AccountsTab currentUserId={userId} />}
        
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 py-4 border-t border-slate-800">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-50 text-sm font-medium hover:border-slate-600 transition-colors flex items-center gap-2 hover:cursor-pointer"><ChevronLeft className="h-4 w-4" />Previous</button>
            <span className="text-sm text-slate-400">Page {currentPage} of {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-50 text-sm font-medium hover:border-slate-600 transition-colors flex items-center gap-2 hover:cursor-pointer">Next<ChevronRight className="h-4 w-4" /></button>
          </div>
        )}
      </main>

      {/* Modals */}
      {isJobModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">{editingJob ? "Edit Position" : "Create New Position"}</h3>
            <form onSubmit={handleJobSubmit} className="space-y-4">
              <div className="relative">
                <Layers className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <select required value={jobFormData.categoryId} onChange={(e) => setJobFormData({ ...jobFormData, categoryId: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 hover:cursor-pointer">
                  <option value="">Select a Category</option>
                  {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Position Title" required value={jobFormData.position} onChange={(e) => setJobFormData({ ...jobFormData, position: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200" />
              </div>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Salary Range (Optional)" value={jobFormData.salaryRange} onChange={(e) => setJobFormData({ ...jobFormData, salaryRange: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsJobModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm hover:cursor-pointer">Cancel</button>
              <button type="submit" disabled={isSavingPosition} className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-white text-sm font-semibold hover:cursor-pointer flex items-center gap-2">
                  {isSavingPosition && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>
                      {isSavingPosition
                          ? (editingJob ? "Saving Changes" : "Creating Position")
                          : (editingJob ? "Save Changes" : "Create Position")}
                  </span>
              </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">{editingCategory ? "Edit Category" : "Create New Category"}</h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="relative">
                <Layers className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Category Name" required value={catFormData.name} onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200" />
              </div>
              <div className="relative">
                <FileText className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <textarea placeholder="Description" required value={catFormData.description} onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 resize-none" rows={4} />
              </div>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input type="text" placeholder="Location" required value={catFormData.location} onChange={(e) => setCatFormData({ ...catFormData, location: e.target.value })} className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 text-sm hover:cursor-pointer">Cancel</button>
              <button type="submit" disabled={isSavingCategory} className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-white text-sm font-semibold hover:cursor-pointer flex items-center gap-2">
                  {isSavingCategory && <Loader2 className="h-3 w-3 animate-spin" />}
                  <span>
                      {isSavingCategory
                          ? (editingCategory ? "Saving Changes" : "Creating Category")
                          : (editingCategory ? "Save Changes" : "Create Category")}
                  </span>
              </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteConfirmation && (
        <div className="fixed inset-0 z-100 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-slate-800 text-center">
            <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-2 capitalize">Delete {deleteConfirmation.type}?</h3>
            <p className="text-sm text-slate-400 mb-6">Are you sure? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmation(null)} className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold hover:cursor-pointer">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold hover:cursor-pointer">Delete</button>
            </div>
          </div>
        </div>
      )}

      {showCategorySuccessModal && (
        <div className="fixed inset-0 z-120 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 h-full w-full">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-slate-800 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4"><UserCheck className="h-6 w-6 text-emerald-400" /></div>
            <h3 className="text-lg font-bold text-white mb-2">Success</h3>
            <p className="text-sm text-slate-400 mb-6">The category has been saved successfully.</p>
            <button onClick={() => setShowCategorySuccessModal(false)} className="w-full px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-white text-sm font-semibold hover:cursor-pointer">Close</button>
          </div>
        </div>
      )}

      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 border border-slate-800 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4"><UserCheck className="h-6 w-6 text-emerald-400" /></div>
            <h3 className="text-lg font-bold text-white mb-2">Success</h3>
            <p className="text-sm text-slate-400 mb-6">The position has been saved successfully.</p>
            <button onClick={() => setShowSuccessModal(false)} className="w-full px-4 py-2.5 rounded-xl bg-gold-600 hover:bg-gold-500 text-white text-sm font-semibold hover:cursor-pointer">Close</button>
          </div>
        </div>
      )}

      {selectedApplicant && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-2xl bg-[#090d18] border-l border-slate-800 shadow-2xl h-full flex flex-col relative animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div>
                <span className="text-xs font-semibold text-gold-400 tracking-widest uppercase">Candidate Review</span>
                <h3 className="text-xl font-bold text-white mt-0.5">{selectedApplicant.name}</h3>
              </div>
              <button onClick={() => setSelectedApplicant(null)} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-colors hover:cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Hiring Pipeline Stage</span>
                  <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold capitalize mt-1 ${statusColors[selectedApplicant.status]}`}>{selectedApplicant.status}</span>
                </div>
                <select disabled={savingStatus} value={selectedApplicant.status} onChange={(e) => handleUpdateStatus(selectedApplicant.id, e.target.value as Applicant["status"])} className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:border-gold-500 hover:cursor-pointer">
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Contact & Credentials</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 text-sm text-slate-300"><Mail className="h-4 w-4 text-slate-500 shrink-0" /><a href={`mailto:${selectedApplicant.email}`} className="hover:text-gold-400 transition-colors truncate">{selectedApplicant.email}</a></div>
                  <div className="flex items-center space-x-3 text-sm text-slate-300"><Phone className="h-4 w-4 text-slate-500 shrink-0" /><span>{selectedApplicant.whatsapp_number}</span></div>
                  <div className="flex items-center space-x-3 text-sm text-slate-300"><Briefcase className="h-4 w-4 text-slate-500 shrink-0" /><span>Applying for: <strong>{selectedApplicant.positionTitle}</strong></span></div>
                  <div className="flex items-center space-x-3 text-sm text-slate-300"><span className="text-slate-500 text-xs font-bold shrink-0 uppercase">PSS</span><span>Pass Type: {selectedApplicant.passType}</span></div>
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  {selectedApplicant.linkedin && <a href={selectedApplicant.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20 text-xs font-semibold hover:bg-gold-500/20 transition-colors"><span>LinkedIn</span><ExternalLink className="h-3 w-3" /></a>}
                  {selectedApplicant.resumeUrl && (
                    <button 
                      onClick={() => handleDownloadResume(selectedApplicant.resumeUrl!)}
                      disabled={fetchingResume}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-50 disabled:cursor-wait hover:cursor-pointer"
                    >
                      {fetchingResume ? <Loader2 className="h-3 w-3 animate-spin" /> : <ExternalLink className="h-3 w-3" />}
                      <span>{fetchingResume ? "Loading..." : "Download Resume / CV"}</span>
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">Recruiter Notes</h4>
                {selectedApplicant.notes?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedApplicant.notes.map((note) => (
                      <div key={note.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-500"><span className="font-semibold text-slate-400">Recruiter Log</span><span>{new Date(note.createdAt).toLocaleDateString()}</span></div>
                        <p className="text-slate-300 leading-relaxed">{note.text}</p>
                      </div>
                    ))}
                  </div>
                ) : <div className="text-center py-6 bg-slate-950/40 rounded-xl border border-slate-900 text-slate-500 text-xs">No notes recorded yet.</div>}
                <form onSubmit={handleAddNote} className="space-y-3 pt-2">
                  <textarea rows={3} required value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add feedback..." className="w-full bg-slate-900 border border-slate-800 focus:border-gold-500 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none" />
                  <div className="flex justify-between items-center">
                    <button type="button" onClick={() => setDeleteConfirmation({ type: "applicant", id: selectedApplicant.id })} className="px-4 py-2 rounded-xl bg-rose-900/20 hover:bg-rose-900/30 text-rose-400 font-semibold text-xs transition-colors flex items-center space-x-1.5 hover:cursor-pointer"><Trash2 className="h-3.5 w-3.5" /><span>Delete Applicant</span></button>
                    <button type="submit" disabled={savingNote} className="px-4 py-2 rounded-xl bg-gold-600 hover:bg-gold-500 text-white font-semibold text-xs transition-colors flex items-center space-x-1.5 hover:cursor-pointer"><span>{savingNote ? "Saving..." : "Add Note"}</span></button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-6 text-center text-xs text-slate-500">&copy; 2026 Golden Dragon Careers Internal Application Tracking System.</div>
      </footer>
    </div>
  );
}
