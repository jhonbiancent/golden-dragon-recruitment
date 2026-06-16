import { NextResponse } from "next/server";
import { adminSupabase } from "@/utils/supabase/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // 1. Authenticate as Admin
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "Missing file path" }, { status: 400 });
    }

    // 2. Generate a Signed URL valid for 15 minutes (900 seconds)
    const { data, error } = await adminSupabase.storage
      .from("resumes")
      .createSignedUrl(path, 900);

    if (error) {
      console.error("Signed URL error:", error);
      throw error;
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (error: any) {
    console.error("Resume Proxy Error:", error);
    return NextResponse.json({ error: "Failed to generate access link" }, { status: 500 });
  }
}
