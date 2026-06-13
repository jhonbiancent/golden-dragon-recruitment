import { NextResponse } from "next/server";
import { addJob } from "@/lib/db";

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
      return NextResponse.json({ error: "Failed to create job" }, { status: 500 });
    }

    return NextResponse.json({ success: true, job }, { status: 201 });
  } catch (error: any) {
    console.error("API Error in jobs:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
