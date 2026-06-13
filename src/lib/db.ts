import fs from "fs";
import path from "path";
import { supabase } from "./supabaseClient";

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
  age: number;
  nationality: string;
  positionTitle: string;
  expectedSalary: string;
  availability: string;
  passType: string;
  resumeUrl: string;
  status: "applied" | "interviewing" | "offered" | "rejected" | "hired";
  notes: RecruiterNote[];
  appliedAt: string;
}

export interface JobPosition {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string;
  salaryRange?: string;
  status: "active" | "closed";
}

const DATA_DIR = path.join(process.cwd(), "data");
const APPLICANTS_FILE = path.join(DATA_DIR, "applicants.json");

const CORPORATE_JOBS: JobPosition[] = [
  {
    id: "sr-frontend",
    title: "Senior Frontend Engineer",
    department: "Technical",
    location: "Singapore",
    description: "We are looking for a Senior Frontend Engineer to build beautiful, responsive web applications using React, Next.js, and modern CSS/Tailwind. You will design, develop, and lead frontend architecture.",
    status: "active",
  },
  {
    id: "hr-partner",
    title: "HR Business Partner",
    department: "Administrative",
    location: "Singapore",
    description: "Join our HR division to manage corporate talent strategy, employee relations, onboarding frameworks, and organizational health. You will partner with business unit heads to direct hiring strategies.",
    status: "active",
  },
  {
    id: "fin-analyst",
    title: "Senior Financial Analyst",
    department: "Administrative",
    location: "Singapore",
    description: "Seeking a Senior Analyst to direct financial modeling, budgeting, and monthly auditing reports. Experience with enterprise ERP systems and financial forecasting models is required.",
    status: "active",
  },
  {
    id: "growth-mkt",
    title: "Growth Marketing Manager",
    department: "Sales",
    location: "Singapore",
    description: "Lead user acquisition and campaign management across PPC, social, and SEO channels. You will monitor metrics, run A/B testing, and collaborate with creative designers.",
    status: "active",
  },
  {
    id: "ops-coord",
    title: "Operations Coordinator",
    department: "General Operations",
    location: "Singapore",
    description: "Provide administrative, logistial, and office management support. You will manage scheduling, vendor relationships, facility maintenance, and assist on corporate operational tasks.",
    status: "active",
  },
  {
    id: "sales-exec",
    title: "Corporate Account Executive",
    department: "Sales",
    location: "Singapore",
    description: "Manage client acquisitions, close B2B enterprise deals, and run software demonstrations. Must have strong verbal communication skills and a track record of meeting revenue targets.",
    status: "active",
  },
  {
    id: "clean-1",
    title: "Cleaning Specialist",
    department: "General Operations",
    location: "Singapore",
    description: "Maintain cleanliness of our facilities, ensuring a safe and hygienic environment for all staff and visitors.",
    status: "active",
  },
  {
    id: "drive-1",
    title: "Driver / Chauffeur",
    department: "General Operations",
    location: "Singapore",
    description: "Provide safe and timely transportation for staff and guests. Maintaining vehicles and following traffic safety regulations is required.",
    status: "active",
  },
  {
    id: "food-1",
    title: "Food Service Worker",
    department: "General Operations",
    location: "Singapore",
    description: "Prepare and serve high-quality food and beverages in our office cafeterias, ensuring hygiene standards are met.",
    status: "active",
  },
  {
    id: "gen-1",
    title: "Production Operator",
    department: "General Operations",
    location: "Singapore",
    description: "Operate production machinery, monitor quality control, and ensure efficient workflow on the production line.",
    status: "active",
  },
  {
    id: "health-1",
    title: "Wellness Coordinator",
    department: "General Operations",
    location: "Singapore",
    description: "Promote employee health and well-being through programs, workshops, and wellness initiatives.",
    status: "active",
  },
  {
    id: "sec-1",
    title: "Security Guard",
    department: "General Operations",
    location: "Singapore",
    description: "Monitor and patrol facility, ensuring safety of personnel, assets, and premises.",
    status: "active",
  }
];

export async function addJob(newJob: Omit<JobPosition, "id" | "status">): Promise<JobPosition | null> {
  const id = newJob.title.toLowerCase().replace(/\s+/g, '-');
  
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("jobs")
      .insert({
        id,
        title: newJob.title,
        department: newJob.department,
        location: newJob.location,
        description: newJob.description,
        salary_range: newJob.salaryRange || null,
        status: "active"
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to insert job into Supabase:", err);
    return null;
  }
}

function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

// Local File Fallback System
function initLocalDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(APPLICANTS_FILE)) {
    fs.writeFileSync(APPLICANTS_FILE, JSON.stringify([], null, 2), "utf-8");
  }
}

function getLocalApplicants(): Applicant[] {
  initLocalDB();
  try {
    const data = fs.readFileSync(APPLICANTS_FILE, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

function saveLocalApplicants(applicants: Applicant[]) {
  initLocalDB();
  try {
    fs.writeFileSync(APPLICANTS_FILE, JSON.stringify(applicants, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local DB:", err);
  }
}


// --- Public Access Methods ---

export function getJobs(): JobPosition[] {
  // We keep corporate jobs defined locally as a static list for immediate render,
  // but can read them from Supabase if needed. We return static list to prevent page loading lags.
  return CORPORATE_JOBS;
}

export function getJobById(id: string): JobPosition | undefined {
  return CORPORATE_JOBS.find(j => j.id === id);
}

export async function getApplicants(): Promise<Applicant[]> {
  if (!isSupabaseConfigured()) {
    return getLocalApplicants();
  }

  try {
    // Fetch applicants
    const { data: dbApplicants, error: appError } = await supabase
      .from("applicants")
      .select("*")
      .order("applied_at", { ascending: false });

    if (appError) throw appError;

    // Fetch notes
    const { data: dbNotes, error: notesError } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: true });

    if (notesError) throw notesError;

    // Map database structures back to frontend Typescript interfaces
    return (dbApplicants || []).map(app => {
      const notesForApp = (dbNotes || [])
        .filter(note => note.applicant_id === app.id)
        .map(note => ({
          id: note.id,
          text: note.text,
          createdAt: note.created_at
        }));

      return {
        id: app.id,
        name: app.name,
        email: app.email,
        phone: app.phone,
        positionTitle: app.position_title,
        age: app.age,
        nationality: app.nationality,
        expectedSalary: app.expected_salary,
        availability: app.availability,
        passType: app.pass_type,
        resumeUrl: app.resume_url,
        status: app.status,
        notes: notesForApp,
        appliedAt: app.applied_at
      };
    });
  } catch (err) {
    console.error("Supabase error fetching applicants, falling back to local file:", err);
    return getLocalApplicants();
  }
}

export async function addApplicant(newApplicant: Omit<Applicant, "id" | "status" | "notes" | "appliedAt" | "positionTitle"> & { customPosition?: string, positionId?: string }): Promise<Applicant> {
  const position = newApplicant.positionId ? getJobById(newApplicant.positionId) : undefined;
  
  // If customPosition is provided, use it. Otherwise, fallback to the matched job title or "General Position"
  const positionTitle = newApplicant.customPosition || (position ? position.title : "General Position");
  
  const id = `app-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const appliedAt = new Date().toISOString();

  const applicant: Applicant = {
    ...newApplicant,
    id,
    positionTitle,
    status: "applied",
    notes: [],
    appliedAt,
  };

  if (!isSupabaseConfigured()) {
    const applicants = getLocalApplicants();
    applicants.unshift(applicant);
    saveLocalApplicants(applicants);
    return applicant;
  }

  try {
    const { error } = await supabase.from("applicants").insert({
      id: applicant.id,
      name: applicant.name,
      email: applicant.email,
      phone: applicant.phone,
      age: applicant.age,
      nationality: applicant.nationality,
      position_title: applicant.positionTitle,
      expected_salary: applicant.expectedSalary,
      availability: applicant.availability,
      pass_type: applicant.passType,
      resume_url: applicant.resumeUrl,
      status: "applied",
      applied_at: appliedAt
    });

    if (error) throw error;
    return applicant;
  } catch (err) {
    console.error("Failed to insert into Supabase:", err);
    throw err;
  }
}

export async function updateApplicantStatus(id: string, status: Applicant["status"]): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const applicants = getLocalApplicants();
    const index = applicants.findIndex(a => a.id === id);
    if (index !== -1) {
      applicants[index].status = status;
      saveLocalApplicants(applicants);
      return true;
    }
    return false;
  }

  try {
    const { error } = await supabase
      .from("applicants")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Failed to update status on Supabase:", err);
    return false;
  }
}

export async function addApplicantNote(id: string, noteText: string): Promise<RecruiterNote | null> {
  const noteId = `note-${Date.now()}`;
  const createdAt = new Date().toISOString();
  const newNote: RecruiterNote = {
    id: noteId,
    text: noteText,
    createdAt
  };

  if (!isSupabaseConfigured()) {
    const applicants = getLocalApplicants();
    const index = applicants.findIndex(a => a.id === id);
    if (index !== -1) {
      applicants[index].notes.push(newNote);
      saveLocalApplicants(applicants);
      return newNote;
    }
    return null;
  }

  try {
    const { error } = await supabase.from("notes").insert({
      id: noteId,
      applicant_id: id,
      text: noteText,
      created_at: createdAt
    });

    if (error) throw error;
    return newNote;
  } catch (err) {
    console.error("Failed to add note to Supabase:", err);
    return null;
  }
}
