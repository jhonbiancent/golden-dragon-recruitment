"use client";

import React, { useState, useEffect } from "react";
import Turnstile from "react-turnstile";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Search, 
  X, 
  Send, 
  CheckCircle,
  Sparkles,
  ArrowRight,
  Layers,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Upload,
  Award,
  AlertTriangle,
  Users
} from "lucide-react";
interface JobPosition {
  id: string;
  position: string;
  category?: { 
    id: string;
    name: string; 
    description: string; 
    location: string 
  };
  salaryRange?: string;
  status: "active" | "closed";
}

interface GroupedCategory {
  id: string;
  name: string;
  description: string;
  location: string;
  positions: JobPosition[];
}

export default function Home() {
  const [token, setToken] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GroupedCategory | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  
  // Loading State
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp_number: "",
    resumeUrl: "",
    selectedCategoryId: "",
    selectedPositionId: "", 
    customPosition: "",
    age: "",
    gender: "Male",
    nationality: "",
    current_location: "",
    expectedSalary: "",
    availability: "",
    passType: "Singapore citizen",
    coverLetter: "",
  });

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load jobs on mount
  useEffect(() => {
    async function loadJobs() {
      setLoading(true);
      try {
        const response = await fetch("/api/jobs");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setJobs(data.jobs || []);
      } catch (err) {
        console.error("Error loading jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Group positions by category
  const groupedCategories: GroupedCategory[] = React.useMemo(() => {
    const groups: Record<string, GroupedCategory> = {};
    
    (jobs || []).forEach(job => {
      const cat = job.category;
      if (!cat) return;
      
      if (!groups[cat.id]) {
        groups[cat.id] = {
          id: cat.id,
          name: cat.name,
          description: cat.description,
          location: cat.location,
          positions: []
        };
      }
      groups[cat.id].positions.push(job);
    });
    
    return Object.values(groups);
  }, [jobs]);

  const filteredCategories = groupedCategories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          cat.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  const indexOfLast = currentPage * ITEMS_PER_PAGE;
  const indexOfFirst = indexOfLast - ITEMS_PER_PAGE;
  const currentCategories = filteredCategories.slice(indexOfFirst, indexOfLast);

  const handleOpenApply = (cat: GroupedCategory) => {
    setSelectedCategory(cat);
    setIsModalOpen(true);
    setSubmitSuccess(false);
    setErrorMessage("");
    setResumeFile(null);
    setFormData(prev => ({ 
        ...prev, 
        selectedCategoryId: cat.id,
        selectedPositionId: cat.positions.length > 0 ? cat.positions[0].id : "",
        customPosition: "" 
    }));
  };

  const handleOpenGeneralApply = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
    setSubmitSuccess(false);
    setErrorMessage("");
    setResumeFile(null);
    setFormData(prev => ({ 
        ...prev, 
        selectedCategoryId: "", 
        selectedPositionId: "", 
        customPosition: "" 
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === "selectedCategoryId") {
        const cat = groupedCategories.find(c => c.id === value) || null;
        setSelectedCategory(cat);
        setFormData(prev => ({ 
            ...prev, 
            [name]: value, 
            selectedPositionId: cat && cat.positions.length > 0 ? cat.positions[0].id : "" 
        }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          if (file.type !== "application/pdf") {
              alert("Please upload only PDF files.");
              e.target.value = "";
              return;
          }
          if (file.size > 5 * 1024 * 1024) {
              alert("File size must be less than 5MB.");
              e.target.value = "";
              return;
          }
          setResumeFile(file);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
        setErrorMessage("Please upload your resume.");
        return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // 1. Upload Resume
      const fileData = new FormData();
      fileData.append("file", resumeFile);
      
      const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: fileData
      });
      
      if (!uploadRes.ok) {
          const errorData = await uploadRes.json();
          throw new Error(errorData.error || "Failed to upload resume.");
      }
      
      const { filePath } = await uploadRes.json();

      // 2. Submit Application
      const activeCat = selectedCategory || groupedCategories.find(c => c.id === formData.selectedCategoryId);
      const selectedPos = activeCat?.positions.find(p => p.id === formData.selectedPositionId);
      
      let positionTitle = "";
      if (formData.selectedCategoryId === "general") {
          positionTitle = formData.customPosition;
      } else {
          positionTitle = selectedPos?.position || activeCat?.name || "General Position";
      }

      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          positionId: formData.selectedPositionId === 'general' ? undefined : formData.selectedPositionId,
          positionTitle: positionTitle,
          resumeUrl: filePath
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        setResumeFile(null);
        setFormData({
            name: "",
            email: "",
            whatsapp_number: "",
            resumeUrl: "",
            selectedCategoryId: "",
            selectedPositionId: "",
            customPosition: "",
            age: "",
            gender: "Male",
            nationality: "",
            current_location: "",
            expectedSalary: "",
            availability: "",
            passType: "Singapore citizen",
            coverLetter: "",
        });
      } else {
        setErrorMessage(data.error || "Failed to submit application.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b15] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,179,8,0.18),rgba(255,255,255,0))] text-slate-100 flex flex-col font-sans selection:bg-gold-500/30">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b15]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-linear-to-br from-gold-500 to-gold-700 flex items-center justify-center shadow-lg shadow-gold-500/20">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-linear-to-r from-white via-gold-200 to-gold-400 bg-clip-text text-transparent">
              Golden Dragon Careers
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#" className="text-gold-400 transition-colors">Careers</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Values</a>
            <a href="/admin" className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-gold-400 hover:text-gold-300 transition-all flex items-center space-x-1.5 shadow-sm hover:cursor-pointer">
              <span>Recruiter Portal</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4.5 py-1.5 mb-8 text-sm text-gold-300 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <Sparkles className="h-4 w-4 text-gold-400 animate-pulse" />
            <span>We are actively hiring globally</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Build your future with <span className="bg-linear-to-r from-white via-gold-200 to-gold-400 bg-clip-text text-transparent">Golden Dragon</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Join a mission-driven team dedicated to excellence. We partner with talented individuals ready to make a global impact.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <button 
              onClick={handleOpenGeneralApply}
              className="px-8 py-4 rounded-2xl bg-gold-600 hover:bg-gold-500 text-white font-bold transition-all shadow-lg shadow-gold-500/25 flex items-center space-x-2 group hover:cursor-pointer hover:scale-105 active:scale-95"
            >
              <span>Quick Apply</span>
              <Send className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </button>
          
          </div>

          {/* Job Search bar */}
          <div className="max-w-2xl mx-auto glass-card rounded-2xl p-2 shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-1000">
            <div className="relative w-full flex-1">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search job categories (e.g. Technical, Admin)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 pl-11 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 text-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Jobs Section */}
      <main className="grow max-w-6xl w-full mx-auto px-6 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Open Opportunities</h2>
            <p className="text-sm text-slate-500 mt-2">Explore departments and start your journey with us.</p>
          </div>
         
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-8 h-72 animate-pulse">
                <div className="h-8 bg-slate-800 rounded w-1/2 mb-6"></div>
                <div className="h-4 bg-slate-800 rounded w-full mb-3"></div>
                <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {currentCategories.map((cat) => (
                <div 
                  key={cat.id} 
                  className="glass-card glass-card-hover rounded-3xl p-8 flex flex-col justify-between border-t border-l border-white/5 group hover:border-gold-500/30 transition-all duration-500 shadow-xl"
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-gold-500/10 flex items-center justify-center text-gold-400 group-hover:bg-gold-500 group-hover:text-white transition-all duration-500 shadow-inner">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-slate-800">
                            {cat.positions.length} Roles
                        </span>
                    </div>

                    <h3 className="text-2xl font-extrabold text-slate-100 mb-3 group-hover:text-gold-400 transition-colors">
                      {cat.name}
                    </h3>

                    <p className="text-sm text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                      {cat.description || "Join our team in this capacity and help shape the future of our operations."}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-2">
                        {cat.positions.slice(0, 4).map(p => (
                            <span key={p.id} className="text-[10px] px-3 py-1 rounded-lg bg-slate-900 border border-slate-800/50 text-slate-400 group-hover:border-gold-500/20 transition-all">
                                {p.position}
                            </span>
                        ))}
                        {cat.positions.length > 4 && (
                            <span className="text-[10px] px-3 py-1 text-slate-500">+{cat.positions.length - 4} more</span>
                        )}
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-2 mt-auto">
                    <div className="flex items-center justify-between mb-4 text-lg text-slate-400">
                      <span className="flex items-center font-medium">
                        <MapPin className="h-3.5 w-3.5 mr-2 text-gold-500" />
                        {cat.location || "Multiple Locations"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenApply(cat)}
                      className="w-full py-4 px-6 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-gold-600 hover:border-gold-500 text-slate-200 hover:text-white font-bold text-sm transition-all shadow-md flex items-center justify-center space-x-2 hover:cursor-pointer hover:shadow-gold-500/20 group/btn"
                    >
                      <span>Apply for this Category</span>
                      <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-6 mt-16">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:border-gold-500 transition-all hover:cursor-pointer active:scale-95"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="text-sm font-bold text-slate-500 tracking-widest">
                  {currentPage} <span className="mx-1 text-slate-700">/</span> {totalPages}
                </span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800 disabled:opacity-30 text-slate-300 hover:border-gold-500 transition-all hover:cursor-pointer active:scale-95"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-24 glass-card rounded-3xl border border-dashed border-slate-800">
            <Briefcase className="h-16 w-16 text-slate-700 mx-auto mb-6" />
            <h3 className="text-xl font-bold text-slate-300">No categories found</h3>
            <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto">
              Try adjusting your search criteria or explore our featured departments.
            </p>
          </div>
        )}
      </main>

      {/* Slide-over or Modal Apply Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-white/5 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gold-400 tracking-[0.2em] uppercase">Application Portal</span>
                <h3 className="text-2xl font-black text-white mt-1 uppercase tracking-tight">{selectedCategory?.name || "Quick Apply"}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2.5 rounded-xl bg-slate-800 text-slate-400 transition-colors hover:cursor-pointer hover:bg-rose-500/20 hover:text-rose-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
              {submitSuccess ? (
                <div className="text-center py-16 px-4">
                  <div className="h-20 w-20 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl flex items-center justify-center mx-auto mb-8 text-emerald-400 animate-bounce">
                    <CheckCircle className="h-10 w-10" />
                  </div>
                  <h4 className="text-3xl font-black text-white">Application Sent!</h4>
                  <p className="text-slate-400 mt-4 max-w-md mx-auto leading-relaxed text-lg">
                    Thank you for applying, <strong>{formData.name || "candidate"}</strong>. Our hiring team will review your profile and get back to you shortly.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-12 px-10 py-4 rounded-2xl bg-gold-600 hover:bg-gold-500 text-white font-bold transition-all hover:cursor-pointer shadow-lg shadow-gold-500/20"
                  >
                    Close Portal
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-10">
                  
                  {errorMessage && (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4" />
                        {errorMessage}
                    </div>
                  )}

                  {/* Form section: Role Selection */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Award className="h-4 w-4 text-gold-500" />
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Role Selection</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="selectedCategoryId" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Category *</label>
                            <select
                                id="selectedCategoryId"
                                name="selectedCategoryId"
                                required
                                value={formData.selectedCategoryId}
                                onChange={handleInputChange}
                                className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 focus:outline-none cursor-pointer hover:bg-slate-800/80 transition-colors"
                            >
                                <option value="" disabled>Choose Category</option>
                                {groupedCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                                <option value="general">Other / Global</option>
                            </select>
                        </div>

                        {formData.selectedCategoryId === "general" ? (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <label htmlFor="customPosition" className="block text-[10px] font-bold text-gold-400 uppercase tracking-wider mb-2 ml-1">Position Applied For *</label>
                                <input
                                id="customPosition"
                                type="text"
                                name="customPosition"
                                required
                                value={formData.customPosition}
                                onChange={handleInputChange}
                                placeholder="e.g. Senior Strategist"
                                className="w-full bg-gold-500/5 border border-gold-500/20 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none shadow-inner"
                                />
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                                <label htmlFor="selectedPositionId" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Specific Position *</label>
                                <select
                                    id="selectedPositionId"
                                    name="selectedPositionId"
                                    required
                                    disabled={!formData.selectedCategoryId}
                                    value={formData.selectedPositionId}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 focus:outline-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-800/80 transition-colors"
                                >
                                    <option value="" disabled>Select Role</option>
                                    {selectedCategory?.positions.map(p => (
                                        <option key={p.id} value={p.id}>{p.position}</option>
                                    ))}
                                    <option value="general">Open to Suggestions</option>
                                </select>
                            </div>
                        )}
                    </div>
                  </div>

                  {/* Form section: Personal Details */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Users className="h-4 w-4 text-gold-500" />
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Personal Details</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Full Name *</label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="John Doe"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Email Address *</label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john@example.com"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="whatsapp_number" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">WhatsApp Number *</label>
                        <input
                          id="whatsapp_number"
                          type="tel"
                          name="whatsapp_number"
                          required
                          value={formData.whatsapp_number}
                          onChange={handleInputChange}
                          placeholder="+65 0000 0000"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="age" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Age *</label>
                        <input
                          id="age"
                          type="number"
                          name="age"
                          min="18"
                          required
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="e.g. 25"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Gender *</label>
                        <div className="flex gap-6 mt-1">
                            <label className="flex items-center gap-2.5 text-sm text-slate-300 hover:cursor-pointer group">
                                <input type="radio" name="gender" value="Male" checked={formData.gender === "Male"} onChange={handleInputChange} className="h-4 w-4 accent-gold-500 cursor-pointer" />
                                <span className="group-hover:text-gold-400 transition-colors">Male</span>
                            </label>
                            <label className="flex items-center gap-2.5 text-sm text-slate-300 hover:cursor-pointer group">
                                <input type="radio" name="gender" value="Female" checked={formData.gender === "Female"} onChange={handleInputChange} className="h-4 w-4 accent-gold-500 cursor-pointer" />
                                <span className="group-hover:text-gold-400 transition-colors">Female</span>
                            </label>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="nationality" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Nationality *</label>
                        <input
                          id="nationality"
                          type="text"
                          name="nationality"
                          required
                          value={formData.nationality}
                          onChange={handleInputChange}
                          placeholder="e.g. Singaporean"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form section: Professional & Availability */}
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-4 w-4 text-gold-500" />
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Professional Data</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="expectedSalary" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Expected Monthly Salary *</label>
                        <input
                          id="expectedSalary"
                          type="text"
                          name="expectedSalary"
                          required
                          value={formData.expectedSalary}
                          onChange={handleInputChange}
                          placeholder="e.g. 3,500 SGD"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="availability" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Available Start Date *</label>
                        <input
                          id="availability"
                          type="date"
                          name="availability"
                          required
                          value={formData.availability}
                          onChange={handleInputChange}
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 focus:outline-none cursor-pointer"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="passType" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Work Pass Status *</label>
                      <select
                        id="passType"
                        name="passType"
                        value={formData.passType}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl px-5 py-3.5 text-sm text-slate-200 focus:outline-none cursor-pointer hover:bg-slate-800/80 transition-colors"
                      >
                        <option>Singapore citizen</option>
                        <option>PR</option>
                        <option>Work Permit</option>
                        <option>S Pass</option>
                        <option>E Pass</option>
                        <option>Social Visit</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="resumeFile" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Resume / CV (PDF Only) *</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <Upload className="h-5 w-5 text-slate-500 group-hover:text-gold-400 transition-colors" />
                        </div>
                        <input
                            id="resumeFile"
                            type="file"
                            name="resumeFile"
                            accept=".pdf"
                            required
                            onChange={handleFileChange}
                            className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-slate-200 file:mr-4 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-gold-500/10 file:text-gold-400 hover:file:bg-gold-500/20 transition-all cursor-pointer"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 ml-1">Must be PDF format. Maximum size 5MB.</p>
                    </div>
                  </div>
                    {/* Turnstile Widget */}
                    <div className="flex justify-center items-center">
                      <Turnstile sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!} onVerify={setToken} />
                    </div>
                          
                  {/* Submit Button */}
                  <div className="border-t border-slate-800 pt-8 flex items-center justify-end space-x-6">
                    
                      <button
                        type="button"
                        disabled={!token} 
                      onClick={() => setIsModalOpen(false)}
                      className="px-6 py-3 rounded-2xl border border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-sm font-bold transition-all hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-10 py-4 rounded-2xl bg-linear-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 disabled:from-gold-800 disabled:to-gold-800 text-white font-black text-sm uppercase tracking-widest transition-all flex items-center space-x-3 shadow-xl shadow-gold-500/10 hover:cursor-pointer hover:scale-[1.02] active:scale-95 disabled:scale-100"
                    >
                      {isSubmitting ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                        </div>
                      ) : (
                        <>
                          <span>Submit</span>
                          <Send className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-16 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-3 mb-6 md:mb-0">
            <span className="font-bold text-slate-400 uppercase tracking-widest">&copy; 2026 Golden Dragon Employment Agency</span>
            <span className="h-1 w-1 rounded-full bg-slate-800 hidden md:block" />
            <span className="font-medium">Excellence in Recruitment</span>
          </div>
          <div className="flex space-x-8 font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-gold-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-gold-400 transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
