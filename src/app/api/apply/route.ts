import { NextResponse } from "next/server";
import { addApplicant } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, email, whatsapp_number, positionId, customPosition, 
      age, nationality, expectedSalary, availability, passType, resumeUrl,
      gender, current_location
    } = body;

    // Validation - ensure all non-nullable fields according to schema are present
    if (!name || !email || !whatsapp_number || !age || !nationality || !expectedSalary || !availability || !passType || !resumeUrl || 
        (!positionId && !customPosition)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const applicant = await addApplicant({
      name,
      email,
      whatsapp_number,
      positionId: positionId === 'general' ? undefined : positionId,
      customPosition: positionId === 'general' ? customPosition : undefined,
      age: parseInt(age),
      nationality,
      expectedSalary,
      availability,
      passType,
      resumeUrl,
      gender: gender || "",
      current_location: current_location || "",
      coverLetter: body.coverLetter || "",
      noticePeriod: body.noticePeriod || ""
    });

    return NextResponse.json(
      { success: true, applicant },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("API Error in apply:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
