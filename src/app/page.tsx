"use client";

import React, { useState, useEffect } from "react";
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  X, 
  Send, 
  CheckCircle,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  ArrowUpRight
} from "lucide-react";

interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string;
  experienceRequired: string;
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
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience: "1-3 Years",
    linkedin: "",
    portfolio: "",
    resumeUrl: "",
    coverLetter: "",
    noticePeriod: "Immediate",
    customPosition: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load jobs on mount
  useEffect(() => {
    // We can fetch from API or hardcode the list for immediate load
    const mockJobsList: JobPosition[] = [
      {
        id: "sr-frontend",
        title: "Senior Frontend Engineer",
        department: "Engineering",
        location: "San Francisco, CA (Hybrid)",
        type: "Full-time",
        experienceRequired: "5+ years",
        description: "We are looking for a Senior Frontend Engineer to build beautiful, responsive web applications using React, Next.js, and modern CSS/Tailwind. You will design, develop, and lead frontend architecture.",
        salaryRange: "$140,000 - $170,000",
        status: "active",
      },
      {
        id: "product-mgr",
        title: "Technical Product Manager",
        department: "Product",
        location: "Remote (US/Canada)",
        type: "Full-time",
        experienceRequired: "3+ years",
        description: "Seeking a TPM to drive technical products. You will collaborate with engineering, design, and operations teams to ship features that empower our recruiters and customers.",
        salaryRange: "$130,000 - $160,000",
        status: "active",
      },
      {
        id: "ui-designer",
        title: "Lead UI/UX Designer",
        department: "Design",
        location: "New York, NY (On-site)",
        type: "Full-time",
        experienceRequired: "4+ years",
        description: "Join our design studio to craft state-of-the-art interactive platforms. We value creativity, pixel-perfection, design systems, and rapid prototyping capabilities.",
        salaryRange: "$120,000 - $150,000",
        status: "active",
      },
      {
        id: "backend-eng",
        title: "Backend Engineer (Node/Go)",
        department: "Engineering",
        location: "Remote (Global)",
        type: "Contract",
        experienceRequired: "3+ years",
        description: "Help build scalable APIs, microservices, and databases. Strong experience with Node.js, Go, PostgreSQL, Redis, and cloud infrastructure (AWS/GCP) is required.",
        salaryRange: "$80 - $110 / hour",
        status: "active",
      }
    ];
    setJobs(mockJobsList);
  }, []);

  const departments = ["All", ...Array.from(new Set(jobs.map(j => j.department)))];

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === "All" || job.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const handleOpenApply = (job: JobPosition) => {
    setSelectedJob(job);
    setIsModalOpen(true);
    setSubmitSuccess(false);
    setErrorMessage("");
    setFormData(prev => ({ ...prev, customPosition: "" }));
  };

  const handleOpenGeneralApply = () => {
    setSelectedJob({
      id: "general",
      title: "General Application",
      department: "General",
      location: "Remote / Multiple",
      type: "Full-time / Contract",
      experienceRequired: "Any",
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
          positionId: selectedJob?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitSuccess(true);
        // Reset form
        setFormData({
          name: "",
          email: "",
          phone: "",
          experience: "1-3 Years",
          linkedin: "",
          portfolio: "",
          resumeUrl: "",
          coverLetter: "",
          noticePeriod: "Immediate",
          customPosition: "",
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
    <div className="min-h-screen bg-[#070b15] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.18),rgba(255,255,255,0))] text-slate-100 flex flex-col font-sans">
      
      {/* Header / Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b15]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              NextHire
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
            <a href="#" className="text-indigo-400 transition-colors">Careers</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Our Values</a>
            <a href="#" className="hover:text-slate-200 transition-colors">Benefits</a>
            <a href="/admin" className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 transition-all flex items-center space-x-1.5 shadow-sm">
              <span>Recruiter Portal</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4.5 py-1.5 mb-6 text-sm text-indigo-300">
            <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" />
            <span>We are actively hiring globally</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.15]">
            Build the future of recruitment with <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">NextHire</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Join a fast-growing team of innovators, engineers, and creators. We value ambition, diversity, and pixel-perfect digital experiences.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <button 
              onClick={() => {
                const element = document.getElementById('open-positions');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center space-x-2 group"
            >
              <span>View Openings</span>
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={handleOpenGeneralApply}
              className="px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold transition-all flex items-center space-x-2"
            >
              <span>General Application</span>
              <Send className="h-4 w-4 text-slate-500" />
            </button>
          </div>

          {/* Job Search bar */}
          <div className="max-w-xl mx-auto glass-card rounded-2xl p-2 shadow-2xl flex flex-col md:flex-row items-center gap-2">
            <div className="relative w-full flex-1">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search positions (e.g. Frontend)..."
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
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 cursor-pointer w-full md:w-auto"
              >
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept} Departments</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main Jobs Section */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Open Positions</h2>
            <p className="text-sm text-slate-500 mt-1">Found {filteredJobs.length} opportunities for you</p>
          </div>
          
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800/80 rounded-xl p-1 text-xs text-slate-400">
            <button 
              onClick={() => setSelectedDept("All")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${selectedDept === "All" ? "bg-indigo-600 text-white" : "hover:text-slate-200"}`}
            >
              All Openings
            </button>
            {departments.filter(d => d !== "All").map(dept => (
              <button 
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${selectedDept === dept ? "bg-indigo-600 text-white" : "hover:text-slate-200"}`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className="glass-card glass-card-hover rounded-2xl p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <span className="inline-flex items-center rounded-lg bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                      {job.department}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {job.type}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-100 hover:text-indigo-400 transition-colors cursor-pointer mb-2">
                    {job.title}
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
                    {job.salaryRange && (
                      <span className="flex items-center text-emerald-400 font-medium">
                        <DollarSign className="h-3.5 w-3.5 mr-0.5" />
                        {job.salaryRange}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleOpenApply(job)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg hover:shadow-indigo-500/15 flex items-center justify-center space-x-2"
                  >
                    <span>Apply Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                <span className="text-xs font-semibold text-indigo-400 tracking-wider uppercase">Application Form</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedJob.title}</h3>
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
                    Thank you for applying, {formData.name || "candidate"}. We have received your application for the <strong>{selectedJob.title}</strong> role and our hiring team will review it shortly.
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
                    
                    {selectedJob.id === "general" && (
                      <div className="pb-2">
                        <label htmlFor="customPosition" className="block text-xs font-semibold text-indigo-400 mb-1.5 flex items-center">
                          <Sparkles className="h-3 w-3 mr-1.5" />
                          What position are you interested in? *
                        </label>
                        <input
                          id="customPosition"
                          type="text"
                          name="customPosition"
                          required
                          value={formData.customPosition}
                          onChange={handleInputChange}
                          placeholder="e.g. Senior Marketing Lead, Creative Director, etc."
                          className="w-full bg-indigo-500/5 border border-indigo-500/20 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none shadow-inner"
                        />
                      </div>
                    )}
                    
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
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
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
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-xs font-semibold text-slate-400 mb-1.5">Phone Number *</label>
                        <input
                          id="phone"
                          type="tel"
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleInputChange}
                          placeholder="+1 (555) 000-0000"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="experience" className="block text-xs font-semibold text-slate-400 mb-1.5">Years of Relevant Experience *</label>
                        <select
                          id="experience"
                          name="experience"
                          value={formData.experience}
                          onChange={handleInputChange}
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none cursor-pointer"
                        >
                          <option>Less than 1 Year</option>
                          <option>1-3 Years</option>
                          <option>3-5 Years</option>
                          <option>5-8 Years</option>
                          <option>8+ Years</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Form section: Links & Attachments */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Professional Links & CV
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="linkedin" className="block text-xs font-semibold text-slate-400 mb-1.5">LinkedIn Profile URL</label>
                        <input
                          id="linkedin"
                          type="url"
                          name="linkedin"
                          value={formData.linkedin}
                          onChange={handleInputChange}
                          placeholder="https://linkedin.com/in/username"
                          className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                        />
                      </div>

                      {selectedJob.id !== "general" && (
                        <div>
                          <label htmlFor="portfolio" className="block text-xs font-semibold text-slate-400 mb-1.5">Portfolio / Website URL</label>
                          <input
                            id="portfolio"
                            type="url"
                            name="portfolio"
                            value={formData.portfolio}
                            onChange={handleInputChange}
                            placeholder="https://myportfolio.com"
                            className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                          />
                        </div>
                      )}
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
                        placeholder="Link to hosted Resume PDF (Google Drive, Dropbox, Dropbox, etc.)"
                        className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Form section: Extra Info */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-2">
                      Notice Period & Statement
                    </h4>

                    <div>
                      <label htmlFor="noticePeriod" className="block text-xs font-semibold text-slate-400 mb-1.5">Notice Period *</label>
                      <select
                        id="noticePeriod"
                        name="noticePeriod"
                        value={formData.noticePeriod}
                        onChange={handleInputChange}
                        className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none cursor-pointer"
                      >
                        <option>Immediate</option>
                        <option>2 Weeks</option>
                        <option>1 Month</option>
                        <option>2 Months</option>
                        <option>3+ Months</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="coverLetter" className="block text-xs font-semibold text-slate-400 mb-1.5">Cover Letter / Statement of Interest *</label>
                      <textarea
                        id="coverLetter"
                        name="coverLetter"
                        required
                        rows={4}
                        value={formData.coverLetter}
                        onChange={handleInputChange}
                        placeholder="Tell us why you are a great fit for this position..."
                        className="w-full bg-slate-900/60 border border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
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
                      className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:from-indigo-800 disabled:to-indigo-800 text-white font-semibold text-sm transition-all flex items-center space-x-2 shadow-lg shadow-indigo-500/20"
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
            <span className="font-semibold text-slate-400">&copy; 2026 NextHire Inc.</span>
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
