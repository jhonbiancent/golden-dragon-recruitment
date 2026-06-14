"use client";

import React, { useState, useEffect } from "react";
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
  ChevronRight
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
    selectedCategoryId: "", // Added for Quick Apply logic
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
    noticePeriod: "",
  });
  
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
    setFormData(prev => ({ 
        ...prev, 
        selectedCategoryId: cat.id,
        selectedPositionId: cat.positions.length > 0 ? cat.positions[0].id : "",
        customPosition: "" 
    }));
  };

  const handleOpenGeneralApply = () => {
    // Quick Apply logic: Start with no category selected or "General"
    setSelectedCategory(null);
    setIsModalOpen(true);
    setSubmitSuccess(false);
    setErrorMessage("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
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
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
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
            noticePeriod: "",
        });
      } else {
        setErrorMessage(data.error || "Failed to submit application.");
      }
    } catch (err) {
      setErrorMessage("Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b15] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(234,179,8,0.18),rgba(255,255,255,0))] text-slate-100 flex flex-col font-sans">
      
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
            <a href="#" className="hover:text-slate-200 transition-colors">Our Values</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Benefits</a>
            <a href="/admin" className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-gold-400 hover:text-gold-300 transition-all flex items-center space-x-1.5 shadow-sm">
              <span>Recruiter Portal</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-16 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-gold-500/10 border border-gold-500/20 rounded-full px-4.5 py-1.5 mb-6 text-sm text-gold-300">
            <Sparkles className="h-4 w-4 text-gold-400 animate-pulse" />
            <span>We are actively hiring globally</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Build your future with <span className="bg-linear-to-r  from-white via-gold-200 to-gold-400 bg-clip-text text-transparent">Golden Dragon</span>
          </h1>

          <p className="text-lg md:text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            We partner with talented individuals who are ready to grow, succeed, and make a meaningful impact.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button 
              onClick={handleOpenGeneralApply}
              className="px-8 py-4 rounded-2xl bg-gold-600 hover:bg-gold-500 text-white font-bold transition-all shadow-lg shadow-gold-500/25 flex items-center space-x-2 group hover:cursor-pointer"
            >
              <span>Quick Apply</span>
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Job Search bar */}
          <div className="mt-40 lg:mt-0 max-w-xl mx-auto glass-card rounded-2xl p-2 shadow-2xl flex items-center gap-2">
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
      <main className="grow max-w-6xl w-full mx-auto px-6 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Open Opportunities</h2>
            <p className="text-sm text-slate-500 mt-1">Found {filteredCategories.length} categories for you</p>
          </div>
        </div>

        {/* Categories Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 h-64 animate-pulse">
                <div className="h-6 bg-slate-800 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-slate-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredCategories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentCategories.map((cat) => (
                <div 
                  key={cat.id} 
                  className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between border-t-2 border-t-gold-500/20"
                >
                  <div>
                    <h3 className="text-2xl font-extrabold text-slate-100 mb-2">
                      {cat.name}
                    </h3>

                    <p className="text-sm text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                      {cat.description || "No description available."}
                    </p>
                    
                    <div className="flex flex-wrap gap-1.5 mb-6">
                        {cat.positions.slice(0, 3).map(p => (
                            <span key={p.id} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                                {p.position}
                            </span>
                        ))}
                        {cat.positions.length > 3 && (
                            <span className="text-[10px] px-2 py-0.5 text-slate-500">+{cat.positions.length - 3} more</span>
                        )}
                    </div>
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 mt-auto">
                    <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
                      <span className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-slate-500" />
                        {cat.location || "Multiple Locations"}
                      </span>
                      <span className="text-gold-500/80 font-medium">
                        {cat.positions.length} Active Positions
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenApply(cat)}
                      className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-white font-bold text-sm transition-all shadow-md hover:shadow-lg hover:shadow-gold-500/15 flex items-center justify-center space-x-2 hover:cursor-pointer"
                    >
                      <span>Apply for this Category</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-50 text-sm font-medium hover:border-slate-600 transition-colors flex items-center gap-2 hover:cursor-pointer"
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
                  className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 disabled:opacity-50 text-sm font-medium hover:border-slate-600 transition-colors flex items-center gap-2 hover:cursor-pointer"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 glass-card rounded-2xl border border-dashed border-slate-800">
            <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No categories found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any job category matching "{searchTerm}".
            </p>
          </div>
        )}
      </main>

      {/* Slide-over or Modal Apply Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-800/80 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gold-400 tracking-wider uppercase">Application Form</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedCategory?.name || "Quick Apply"}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors hover:cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <div className="p-6 overflow-y-auto flex-1">
              {submitSuccess ? (
                <div className="text-center py-12 px-4">
                  <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center mx-auto mb-6 text-emerald-400">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">Application Submitted!</h4>
                  <p className="text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                    Thank you for applying, {formData.name || "candidate"}. We have received your application and our hiring team will review it shortly.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-8 px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium text-sm transition-all hover:cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {errorMessage && (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm">
                      {errorMessage}
                    </div>
                  )}

                  {/* Form section: Role Selection */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Role Selection
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Category Dropdown (Always shown for Quick Apply) */}
                        <div>
                            <label htmlFor="selectedCategoryId" className="block text-xs font-semibold text-slate-400 mb-1.5">Category *</label>
                            <select
                                id="selectedCategoryId"
                                name="selectedCategoryId"
                                required
                                value={formData.selectedCategoryId}
                                onChange={handleInputChange}
                                className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none cursor-pointer"
                            >
                                <option value="" disabled>Select Category</option>
                                {groupedCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                                <option value="general">Other / General</option>
                            </select>
                        </div>

                        {/* Position Dropdown (Depends on Category) */}
                        {formData.selectedCategoryId === "general" ? (
                            <div>
                                <label htmlFor="customPosition" className="block text-xs font-semibold text-gold-400 mb-1.5">Position Applied For *</label>
                                <input
                                id="customPosition"
                                type="text"
                                name="customPosition"
                                required
                                value={formData.customPosition}
                                onChange={handleInputChange}
                                placeholder="e.g. Senior Marketing Lead"
                                className="w-full bg-gold-500/5 border border-gold-500/20 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none shadow-inner"
                                />
                            </div>
                        ) : (
                            <div>
                                <label htmlFor="selectedPositionId" className="block text-xs font-semibold text-slate-400 mb-1.5">Specific Position *</label>
                                <select
                                    id="selectedPositionId"
                                    name="selectedPositionId"
                                    required
                                    disabled={!formData.selectedCategoryId}
                                    value={formData.selectedPositionId}
                                    onChange={handleInputChange}
                                    className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <option value="" disabled>Select Position</option>
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
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Personal Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name *</label>
                        <input
                          id="name"
                          type="text"
                          name="name"
                          required
                          value={formData.name}
                          onChange={handleInputChange}
                          placeholder="e.g. John Doe"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-slate-400 mb-1.5">Email Address *</label>
                        <input
                          id="email"
                          type="email"
                          name="email"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="john.doe@example.com"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="whatsapp_number" className="block text-xs font-semibold text-slate-400 mb-1.5">WhatsApp Number *</label>
                        <input
                          id="whatsapp_number"
                          type="tel"
                          name="whatsapp_number"
                          required
                          value={formData.whatsapp_number}
                          onChange={handleInputChange}
                          placeholder="+65 0000 0000"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="age" className="block text-xs font-semibold text-slate-400 mb-1.5">Age *</label>
                        <input
                          id="age"
                          type="number"
                          name="age"
                          min="0"
                          required
                          value={formData.age}
                          onChange={handleInputChange}
                          placeholder="e.g. 25"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gender *</label>
                        <div className="flex gap-4">
                            <label className="flex items-center gap-2 text-sm text-slate-300 hover:cursor-pointer">
                                <input type="radio" name="gender" value="Male" checked={formData.gender === "Male"} onChange={handleInputChange} className="accent-gold-500" />
                                Male
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-300 hover:cursor-pointer">
                                <input type="radio" name="gender" value="Female" checked={formData.gender === "Female"} onChange={handleInputChange} className="accent-gold-500" />
                                Female
                            </label>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="nationality" className="block text-xs font-semibold text-slate-400 mb-1.5">Nationality *</label>
                        <input
                          id="nationality"
                          type="text"
                          name="nationality"
                          required
                          value={formData.nationality}
                          onChange={handleInputChange}
                          placeholder="e.g. Singaporean"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="current_location" className="block text-xs font-semibold text-slate-400 mb-1.5">Current Location *</label>
                        <input
                          id="current_location"
                          type="text"
                          name="current_location"
                          required
                          value={formData.current_location}
                          onChange={handleInputChange}
                          placeholder="e.g. Singapore"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Form section: Professional & Availability */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Professional & Availability
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expectedSalary" className="block text-xs font-semibold text-slate-400 mb-1.5">Expected Salary *</label>
                        <input
                          id="expectedSalary"
                          type="text"
                          name="expectedSalary"
                          required
                          value={formData.expectedSalary}
                          onChange={handleInputChange}
                          placeholder="e.g. 600 SGD"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="availability" className="block text-xs font-semibold text-slate-400 mb-1.5">Availability *</label>
                        <input
                          id="availability"
                          type="date"
                          name="availability"
                          required
                          value={formData.availability}
                          onChange={handleInputChange}
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="passType" className="block text-xs font-semibold text-slate-400 mb-1.5">Pass Currently Holding *</label>
                      <select
                        id="passType"
                        name="passType"
                        value={formData.passType}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none cursor-pointer"
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
                      <label htmlFor="resumeUrl" className="block text-xs font-semibold text-slate-400 mb-1.5">Resume / CV Link *</label>
                      <input
                        id="resumeUrl"
                        type="url"
                        name="resumeUrl"
                        required
                        value={formData.resumeUrl}
                        onChange={handleInputChange}
                        placeholder="Link to hosted Resume PDF"
                        className="w-full bg-slate-900/60 border border-slate-800 focus:border-gold-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="border-t border-slate-800/80 pt-4 flex items-center justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all hover:cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-linear-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 disabled:from-gold-800 disabled:to-gold-800 text-white font-bold text-sm transition-all flex items-center space-x-2 shadow-lg shadow-gold-500/20 hover:cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <span>Submit Application</span>
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
      <footer className="border-t border-slate-900 bg-slate-950 py-12 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <span className="font-semibold text-slate-400">&copy; 2026 Golden Dragon Employment Agency</span>
            <span>&bull;</span>
            <span>All rights reserved.</span>
          </div>
          <div className="flex space-x-6">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
