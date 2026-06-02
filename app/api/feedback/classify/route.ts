import { NextRequest, NextResponse } from "next/server";
import { generateClassification } from "@/lib/ai-client";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { description, skillScope } = body as {
      description: string;
      skillScope: "listening" | "reading" | "writing" | "speaking";
    };
    if (!description || !skillScope) {
      return NextResponse.json({ error: "Missing description or skillScope" }, { status: 400 });
    }
    const result = await generateClassification({ description, skillScope });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
