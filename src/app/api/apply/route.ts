import { NextResponse } from "next/server";
import { addApplicant, seedSupabaseIfNeeded } from "@/lib/db";

export async function POST(request: Request) {
  try {
    await seedSupabaseIfNeeded();
    const body = await request.json();
    const { name, email, phone, positionId, experience, linkedin, portfolio, resumeUrl, coverLetter, noticePeriod } = body;

    // Basic validation
    if (!name || !email || !phone || !positionId || !experience || !coverLetter || !noticePeriod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const applicant = await addApplicant({
      name,
      email,
      phone,
      positionId,
      experience,
      linkedin: linkedin || "",
      portfolio: portfolio || "",
      resumeUrl: resumeUrl || "",
      coverLetter,
      noticePeriod,
    });

    // Optionally: Here, you could post this data to Google Sheets via fetch to an Apps Script Web App URL if configured.
    // e.g. if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) { fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {method: 'POST', body: JSON.stringify(applicant)}) }

    return NextResponse.json(
      { success: true, applicant },
      { status: 201 }
    );
  } catch (error) {
    console.error("API Error in apply:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
