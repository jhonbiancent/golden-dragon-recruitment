import { NextResponse } from "next/server";
import { getApplicants, updateApplicantStatus, addApplicantNote } from "@/lib/db";

export async function GET() {
  try {
    const applicants = getApplicants();
    return NextResponse.json({ applicants });
  } catch (error) {
    console.error("API Error fetching applicants:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing applicant ID or status" },
        { status: 400 }
      );
    }

    const success = updateApplicantStatus(id, status);
    if (!success) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error("API Error updating applicant:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, note } = body;

    if (!id || !note) {
      return NextResponse.json(
        { error: "Missing applicant ID or note content" },
        { status: 400 }
      );
    }

    const newNote = addApplicantNote(id, note);
    if (!newNote) {
      return NextResponse.json(
        { error: "Applicant not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, note: newNote });
  } catch (error) {
    console.error("API Error adding note:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
