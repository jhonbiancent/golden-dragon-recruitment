import fs from "fs";
import path from "path";

export interface RecruiterNote {
  id: string;
  text: string;
  createdAt: string;
}

export interface Applicant {
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

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  type: string; // "Full-time" | "Contract" | "Remote" | etc.
  experienceRequired: string;
  description: string;
  salaryRange?: string;
  status: "active" | "closed";
}

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICANTS_FILE = path.join(DATA_DIR, "applicants.json");

const MOCK_JOBS: JobPosition[] = [
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

const MOCK_APPLICANTS: Applicant[] = [
  {
    id: "app-1",
    name: "Alexander Wright",
    email: "alexander.wright@devmail.io",
    phone: "+1 (555) 019-2834",
    positionId: "sr-frontend",
    positionTitle: "Senior Frontend Engineer",
    experience: "6 years",
    linkedin: "https://linkedin.com/in/alexander-wright-dev",
    portfolio: "https://wright-codes.dev",
    resumeUrl: "https://wright-codes.dev/resume.pdf",
    coverLetter: "I'm highly excited about NextHire! I have built premium design systems and highly interactive user dashboards in my previous roles. I'd love to bring my React and CSS skills to the team.",
    noticePeriod: "Immediate",
    status: "interviewing",
    notes: [
      {
        id: "note-1",
        text: "Strong portfolio with rich interactive components. Fits standard requirements perfectly.",
        createdAt: "2026-06-11T10:00:00Z"
      }
    ],
    appliedAt: "2026-06-10T08:30:00Z"
  },
  {
    id: "app-2",
    name: "Sarah Chen",
    email: "sarah.chen@uxdesign.net",
    phone: "+1 (555) 043-9876",
    positionId: "ui-designer",
    positionTitle: "Lead UI/UX Designer",
    experience: "5 years",
    linkedin: "https://linkedin.com/in/sarah-chen-design",
    portfolio: "https://sarahchen.design",
    resumeUrl: "https://sarahchen.design/resume_2026.pdf",
    coverLetter: "Design is not just what it looks like; it's how it works. My goal is to build premium, immersive design systems that wow users instantly.",
    noticePeriod: "1 Month",
    status: "applied",
    notes: [],
    appliedAt: "2026-06-11T14:22:00Z"
  },
  {
    id: "app-3",
    name: "David Kovic",
    email: "david.kovic@cloudbackend.org",
    phone: "+385 91 234 5678",
    positionId: "backend-eng",
    positionTitle: "Backend Engineer (Node/Go)",
    experience: "4 years",
    linkedin: "https://linkedin.com/in/david-kovic",
    portfolio: "https://github.com/dkovic-dev",
    resumeUrl: "https://dkovic-dev.github.io/cv.pdf",
    coverLetter: "I specialize in writing high-performance APIs and maintaining database structures. I love writing Go and building system integrations.",
    noticePeriod: "2 Weeks",
    status: "offered",
    notes: [
      {
        id: "note-2",
        text: "Technical interview cleared with outstanding score. Offered sent out today.",
        createdAt: "2026-06-12T09:00:00Z"
      }
    ],
    appliedAt: "2026-06-08T11:15:00Z"
  }
];

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(APPLICANTS_FILE)) {
    fs.writeFileSync(APPLICANTS_FILE, JSON.stringify(MOCK_APPLICANTS, null, 2), "utf-8");
  }
}

export function getJobs(): JobPosition[] {
  return MOCK_JOBS;
}

export function getJobById(id: string): JobPosition | undefined {
  return MOCK_JOBS.find(j => j.id === id);
}

export function getApplicants(): Applicant[] {
  initDB();
  try {
    const data = fs.readFileSync(APPLICANTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read applicants DB:", err);
    return MOCK_APPLICANTS;
  }
}

export function saveApplicants(applicants: Applicant[]) {
  initDB();
  try {
    fs.writeFileSync(APPLICANTS_FILE, JSON.stringify(applicants, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write applicants DB:", err);
  }
}

export function addApplicant(newApplicant: Omit<Applicant, "id" | "status" | "notes" | "appliedAt" | "positionTitle">): Applicant {
  const applicants = getApplicants();
  const position = getJobById(newApplicant.positionId);
  const applicant: Applicant = {
    ...newApplicant,
    id: `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    positionTitle: position ? position.title : "General Position",
    status: "applied",
    notes: [],
    appliedAt: new Date().toISOString(),
  };

  applicants.unshift(applicant); // Add to the top of the list
  saveApplicants(applicants);
  return applicant;
}

export function updateApplicantStatus(id: string, status: Applicant["status"]): boolean {
  const applicants = getApplicants();
  const index = applicants.findIndex(a => a.id === id);
  if (index !== -1) {
    applicants[index].status = status;
    saveApplicants(applicants);
    return true;
  }
  return false;
}

export function addApplicantNote(id: string, noteText: string): RecruiterNote | null {
  const applicants = getApplicants();
  const index = applicants.findIndex(a => a.id === id);
  if (index !== -1) {
    const newNote: RecruiterNote = {
      id: `note-${Date.now()}`,
      text: noteText,
      createdAt: new Date().toISOString()
    };
    applicants[index].notes.push(newNote);
    saveApplicants(applicants);
    return newNote;
  }
  return null;
}
