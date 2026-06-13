import { NextResponse } from "next/server";
import { getJobs, addJob, updateJob, deleteJob } from "@/lib/db";

export async function GET() {
  try {
    const jobs = await getJobs();
    return NextResponse.json({ jobs });
  } catch (error: any) {
    console.error("API Error fetching jobs:", error);
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, department, location, description, salaryRange } = body;

    if (!title || !department || !location || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const job = await addJob({
      title,
      department,
      location,
      description,
      salaryRange
    });

    if (!job) {
      throw new Error("Failed to create job");
    }

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error: any) {
    console.error("API Error in jobs:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: "Missing job ID" }, { status: 400 });

    const job = await updateJob(id, updates);
    return NextResponse.json({ success: true, job });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to update job" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing job ID" }, { status: 400 });

    const success = await deleteJob(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 });
  }
}
