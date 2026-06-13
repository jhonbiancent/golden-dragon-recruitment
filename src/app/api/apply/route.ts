import { NextResponse } from "next/server";
import { addApplicant } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, email, phone, positionId, customPosition, 
      age, nationality, expectedSalary, availability, passType, resumeUrl 
    } = body;

    // Validation
    if (!name || !email || !phone || !age || !nationality || !expectedSalary || !availability || !passType || !resumeUrl || 
        (!positionId || (positionId === 'general' && !customPosition))) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const applicant = await addApplicant({
      name,
      email,
      phone,
      positionId: positionId === 'general' ? '' : positionId,
      customPosition: positionId === 'general' ? customPosition : '',
      age: parseInt(age),
      nationality,
      expectedSalary,
      availability,
      passType,
      resumeUrl
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
