import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    
    // 1. Rate Limiting (10 uploads per hour per IP)
    const limiter = await rateLimit(`upload_${ip}`, 10, 60 * 60 * 1000);
    if (!limiter.success) {
        return NextResponse.json({ error: "Too many uploads. Please try again later." }, { status: 429 });
    }

    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 2. Security Validation: File Type (strictly PDF)
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // 3. Security Validation: File Size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    // 4. Generate secure random filename
    const fileName = `${crypto.randomUUID()}.pdf`;

    // 5. Upload to Supabase Storage using Service Role
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const { data: uploadData, error: uploadError } = await adminSupabase.storage
      .from("resumes")
      .upload(fileName, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to store file." }, { status: 500 });
    }

    // Return the relative path
    return NextResponse.json({ success: true, filePath: uploadData.path });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "Internal server error during upload." }, { status: 500 });
  }
}
