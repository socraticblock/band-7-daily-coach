import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/ai-client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }
    const result = await transcribeAudio(audio);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
