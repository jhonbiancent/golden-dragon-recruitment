import { NextResponse } from "next/server";
import { addApplicant } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

// Helper for basic sanitization
function sanitize(str: string): string {
    if (!str) return "";
    return str.trim()
        .replace(/<[^>]*>?/gm, '') // Remove HTML tags
        .replace(/[;"]/g, '');    // Remove common injection characters
}

// Strict validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9\s\-()]{8,20}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

async function verifyTurnstile(token: string) {
    const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
    if (!secretKey) return true; // Skip if not configured

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    });
    const data = await res.json();
    return data.success;
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // 1. Rate Limiting (5 applications per hour per IP)
    const limiter = await rateLimit(`apply_${ip}`, 5, 60 * 60 * 1000);
    if (!limiter.success) {
        return errorResponse("Too many applications. Please try again later.", 429);
    }

    const body = await request.json();
    
    // 2. CAPTCHA Verification
    if (!body.captchaToken || !(await verifyTurnstile(body.captchaToken))) {
        return errorResponse("Security verification failed. Please try again.");
    }

    // 3. Destructure and Sanitize
    const raw = {
        name: sanitize(body.name),
        email: body.email?.trim().toLowerCase(),
        whatsapp_number: sanitize(body.whatsapp_number),
        positionId: sanitize(body.positionId),
        customPosition: sanitize(body.customPosition),
        age: body.age,
        nationality: sanitize(body.nationality),
        expectedSalary: sanitize(body.expectedSalary),
        availability: sanitize(body.availability),
        passType: sanitize(body.passType),
        resumeUrl: sanitize(body.resumeUrl),
        gender: sanitize(body.gender),
        current_location: sanitize(body.current_location)
    };

    // 4. Rate Limiting by Email (1 application per 30 mins)
    const emailLimiter = await rateLimit(`apply_email_${raw.email}`, 1, 30 * 60 * 1000);
    if (!emailLimiter.success) {
        return errorResponse("An application with this email was recently submitted. Please wait.");
    }

    // 5. Strict Validation & Character Limits
    if (!raw.name || raw.name.length > 100) return errorResponse("Invalid name (max 100 chars)");
    if (!raw.email || !EMAIL_REGEX.test(raw.email) || raw.email.length > 150) return errorResponse("Invalid email format");
    if (!raw.whatsapp_number || !PHONE_REGEX.test(raw.whatsapp_number) || raw.whatsapp_number.length > 25) return errorResponse("Invalid whatsapp number");
    
    const ageNum = parseInt(raw.age);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) return errorResponse("Age must be between 18 and 100");

    if (!raw.nationality || raw.nationality.length > 50) return errorResponse("Invalid nationality");
    if (!raw.expectedSalary || raw.expectedSalary.length > 50) return errorResponse("Invalid salary format");
    if (!raw.availability || !DATE_REGEX.test(raw.availability)) return errorResponse("Invalid date format");
    if (!raw.resumeUrl || raw.resumeUrl.length > 255) return errorResponse("Invalid resume identifier");

    if (!raw.positionId && !raw.customPosition) {
      return errorResponse("Position selection is required");
    }

    // 6. Process to Database
    const applicant = await addApplicant({
      name: raw.name,
      email: raw.email,
      whatsapp_number: raw.whatsapp_number,
      positionId: raw.positionId === 'general' ? undefined : raw.positionId,
      customPosition: raw.positionId === 'general' ? raw.customPosition : undefined,
      age: ageNum,
      nationality: raw.nationality,
      expectedSalary: raw.expectedSalary,
      availability: raw.availability,
      passType: raw.passType,
      resumeUrl: raw.resumeUrl,
      gender: raw.gender || "Not specified",
      current_location: raw.current_location || "Not specified"
    });

    return NextResponse.json({ success: true, applicant }, { status: 201 });
  } catch (error: any) {
    console.error("API Error in apply:", error);
    return NextResponse.json(
      { error: "A server error occurred. Please try again later." },
      { status: 500 }
    );
  }
}

function errorResponse(message: string, status = 400) {
    return NextResponse.json({ error: message }, { status });
}
