import "server-only";
import { supabase } from "./supabaseClient";
import { getLocalApplicants, saveLocalApplicants } from "./server-db";

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

export async function updateJob(id: string, updates: Partial<JobPosition>): Promise<JobPosition | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from("jobs")
      .update({
        title: updates.title,
        department: updates.department,
        location: updates.location,
        description: updates.description,
        salary_range: updates.salaryRange || null,
        status: updates.status
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Failed to update job in Supabase:", err);
    return null;
  }
}

export async function deleteJob(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from("jobs")
      .update({ 
        status: "closed", 
        deleted_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Failed to soft-delete job in Supabase:", err);
    return false;
  }
}

export async function getJobs(): Promise<JobPosition[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "active")
      .is("deleted_at", null);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error("Failed to fetch jobs from Supabase:", err);
    return [];
  }
}

export async function getJobById(id: string): Promise<JobPosition | undefined> {
  if (!isSupabaseConfigured()) {
    return undefined;
  }

  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data || undefined;
  } catch (err) {
    console.error("Failed to fetch job by ID from Supabase:", err);
    return undefined;
  }
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
  const position = newApplicant.positionId ? await getJobById(newApplicant.positionId) : undefined;
  
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

export async function deleteApplicant(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    const applicants = getLocalApplicants();
    const newApplicants = applicants.filter(a => a.id !== id);
    saveLocalApplicants(newApplicants);
    return true;
  }

  try {
    const { error } = await supabase
      .from("applicants")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Failed to delete applicant from Supabase:", err);
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

