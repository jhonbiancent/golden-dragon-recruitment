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
  whatsapp_number: string;
  age: number;
  gender: string;
  nationality: string;
  current_location: string;
  positionId: string;
  positionTitle: string;
  expectedSalary: string;
  availability: string;
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

export interface JobCategory {
  id: string;
  name: string;
  description: string;
  location: string;
}

export interface JobPosition {
  id: string;
  category_id: string;
  position: string;
  salaryRange?: string;
  status: "active" | "closed";
  deleted_at?: string;
  // Joined field
  category?: JobCategory;
}

export async function addJob(newJob: { categoryName: string, categoryDescription?: string, categoryLocation?: string, position: string, salaryRange?: string }): Promise<JobPosition | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    // 1. Ensure category exists or create it
    let { data: category, error: catError } = await supabase
      .from("jobs_category")
      .select("id")
      .eq("name", newJob.categoryName)
      .maybeSingle();

    if (!category) {
        const { data: newCat, error: createCatError } = await supabase
            .from("jobs_category")
            .insert({ 
                name: newJob.categoryName, 
                description: newJob.categoryDescription || 'Default', 
                location: newJob.categoryLocation || 'Global' 
            })
            .select('id')
            .single();
        if (createCatError) throw createCatError;
        category = newCat;
    }

    const { data, error } = await supabase
      .from("jobs_position")
      .insert({
        category_id: category.id,
        position: newJob.position,
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
      .from("jobs_position")
      .update({
        position: updates.position,
        category_id: updates.category_id,
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
      .from("jobs_position")
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
      .from("jobs_position")
      .select("*, category:jobs_category(*)")
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
      .from("jobs_position")
      .select("*, category:jobs_category(*)")
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
    const { data: dbApplicants, error: appError } = await supabase
      .from("applicants")
      .select("*")
      .order("applied_at", { ascending: false });

    if (appError) throw appError;

    const { data: dbNotes, error: notesError } = await supabase
      .from("notes")
      .select("*")
      .order("created_at", { ascending: true });

    if (notesError) throw notesError;

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
        whatsapp_number: app.whatsapp_number,
        age: app.age,
        gender: app.gender,
        nationality: app.nationality,
        current_location: app.current_location,
        positionTitle: app.position_title,
        positionId: app.position_id,
        expectedSalary: app.expected_salary,
        availability: app.availability,
        passType: app.pass_type,
        resumeUrl: app.resume_url,
        status: app.status,
        notes: notesForApp,
        appliedAt: app.applied_at,
        coverLetter: app.cover_letter,
        noticePeriod: app.notice_period
      };
    });
  } catch (err) {
    console.error("Supabase error fetching applicants, falling back to local file:", err);
    return getLocalApplicants();
  }
}

export async function addApplicant(newApplicant: Omit<Applicant, "id" | "status" | "notes" | "appliedAt" | "positionTitle"> & { customPosition?: string, positionId?: string }): Promise<Applicant> {
  const position = newApplicant.positionId ? await getJobById(newApplicant.positionId) : undefined;
  
  const positionTitle = newApplicant.customPosition || (position ? position.position : "General Position");
  
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
      whatsapp_number: applicant.whatsapp_number,
      age: applicant.age,
      gender: applicant.gender,
      nationality: applicant.nationality,
      current_location: applicant.current_location,
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
