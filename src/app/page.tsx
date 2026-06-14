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
  category: { name: string; description: string; location: string };
  location: string;
  description: string;
  salaryRange?: string;
  status: "active" | "closed";
}

export default function Home() {
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosition | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const JOBS_PER_PAGE = 10;
  
  // Loading State
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    whatsapp_number: "",
    resumeUrl: "",
    customPosition: "",
    age: "",
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
        setJobs(data.jobs);
      } catch (err) {
        console.error("Error loading jobs:", err);
      } finally {
        setLoading(false);
      }
    }
    loadJobs();
  }, []);

  // Reset page when search or department changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDept]);

  const departments = ["All", ...Array.from(new Set((jobs || []).map(j => j.category?.name || "Uncategorized")))];

  const filteredJobs = (jobs || []).filter(job => {
    const matchesSearch = job.position.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "All" || (job.category?.name || "Uncategorized") === selectedDept;
    return matchesSearch && matchesDept;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const indexOfLastJob = currentPage * JOBS_PER_PAGE;
  const indexOfFirstJob = indexOfLastJob - JOBS_PER_PAGE;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);

  const handleOpenApply = (job: JobPosition) => {
    setSelectedJob(job);
    setIsModalOpen(true);
    setSubmitSuccess(false);
    setErrorMessage("");
    setFormData(prev => ({ ...prev, customPosition: "" }));
  };

  const handleOpenGeneralApply = async () => {
    setSelectedJob({
      id: "general",
      position: "General Application",
      category: { name: "General", description: "", location: "" },
      location: "Remote / Multiple",
      description: "Submit your profile for future opportunities that match your skills.",
      status: "active",
    });
    setIsModalOpen(true);
    setSubmitSuccess(false);
    setErrorMessage("");
    setFormData(prev => ({ ...prev, customPosition: "" }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          positionId: selectedJob?.id === 'general' ? undefined : selectedJob?.id,
          positionTitle: selectedJob?.id === 'general' ? formData.customPosition : selectedJob?.position,
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
            customPosition: "",
            age: "",
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
              className="px-8 py-4 rounded-2xl bg-gold-600 hover:bg-gold-500 text-white font-bold transition-all shadow-lg shadow-gold-500/25 flex items-center space-x-2 group"
            >
              <span>Quick Apply</span>
              <Send className="h-4 w-4" />
            </button>
          </div>

          {/* Job Search bar */}
          <div className="mt-40 lg:mt-0 max-w-xl mx-auto glass-card rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full flex-1">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search positions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-transparent border-0 pl-11 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-0 text-sm"
              />
            </div>
            
            <div className="w-full md:w-auto flex items-center gap-2">
              <div className="h-8 w-px bg-slate-800 hidden md:block" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-gold-500 cursor-pointer w-full md:w-auto"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept} Categories</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Jobs Section */}
      <main className="grow max-w-6xl w-full mx-auto px-6 pb-24">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Open Positions</h2>
            <p className="text-sm text-slate-500 mt-1">Found {filteredJobs.length} opportunities for you</p>
          </div>
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-6 h-64 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-1/4 mb-4"></div>
                <div className="h-6 bg-slate-800 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-slate-800 rounded w-full mb-2"></div>
                <div className="h-4 bg-slate-800 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentJobs.map((job) => (
                <div 
                  key={job.id} 
                  className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <span className="inline-flex items-center rounded-lg bg-gold-500/10 px-2.5 py-1 text-xs font-semibold text-gold-400 border border-gold-500/20">
                        {job.category?.name || "Uncategorized"}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100 hover:text-gold-400 transition-colors cursor-pointer mb-2">
                      {job.position}
                    </h3>

                    <p className="text-sm text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                      {job.description}
                    </p>
                  </div>

                  <div className="border-t border-slate-800/80 pt-4 mt-auto">
                    <div className="flex items-center justify-between mb-4 text-xs text-slate-400">
                      <span className="flex items-center">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-slate-500" />
                        {job.location}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenApply(job)}
                      className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg hover:shadow-gold-500/15 flex items-center justify-center space-x-2"
                    >
                      <span>Apply Now</span>
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
          </>
        ) : (
          <div className="text-center py-16 glass-card rounded-2xl border border-dashed border-slate-800">
            <Briefcase className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-300">No positions found</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              We couldn't find any job matching "{searchTerm}". Try refining your search keywords or categories.
            </p>
          </div>
        )}
      </main>

      {/* Slide-over or Modal Apply Form */}
      {isModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-800/80 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gold-400 tracking-wider uppercase">Application Form</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedJob.position}</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
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
                    Thank you for applying, {formData.name || "candidate"}. We have received your application for the <strong>{selectedJob.position}</strong> role and our hiring team will review it shortly.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="mt-8 px-6 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-medium text-sm transition-all"
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
                      
                    {selectedJob.id === "general" && (
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
                    )}
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
                      className="px-5 py-2.5 rounded-xl border border-slate-850 hover:bg-slate-900 text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 rounded-xl bg-linear-to-r from-gold-600 to-gold-700 hover:from-gold-500 hover:to-gold-600 disabled:from-gold-800 disabled:to-gold-800 text-white font-semibold text-sm transition-all flex items-center space-x-2 shadow-lg shadow-gold-500/20"
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
