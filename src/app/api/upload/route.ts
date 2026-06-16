import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. Security Validation: File Type (strictly PDF)
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // 2. Security Validation: File Size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size exceeds 5MB limit" }, { status: 400 });
    }

    // 3. Generate secure random filename
    const fileExtension = file.name.split(".").pop() || "pdf";
    const fileName = `${crypto.randomUUID()}.${fileExtension}`;

    // 4. Upload to Supabase Storage using Service Role
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
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Return the relative path (not a public URL)
    return NextResponse.json({ success: true, filePath: uploadData.path });
  } catch (error: any) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}
