import { NextResponse } from "next/server";
import { getApplicants, addApplicantNote } from "@/lib/db";

export async function GET() {
  try {
    const applicants = await getApplicants();
    return NextResponse.json({ applicants });
  } catch (error: any) {
    console.error("API Error fetching applicants:", error);
    return NextResponse.json({ error: "Failed to fetch applicants" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, note } = await request.json();
    if (!id || !note) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const newNote = await addApplicantNote(id, note);
    return NextResponse.json({ success: true, note: newNote });
  } catch (error: any) {
    console.error("API Error adding note:", error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    if (!id || !status) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const success = await updateApplicantStatus(id, status);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("API Error updating status:", error);
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

import { updateApplicantStatus, deleteApplicant } from "@/lib/db";

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Missing applicant ID" }, { status: 400 });

    const success = await deleteApplicant(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("API Error deleting applicant:", error);
    return NextResponse.json({ error: "Failed to delete applicant" }, { status: 500 });
  }
}
