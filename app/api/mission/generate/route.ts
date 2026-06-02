import { NextRequest, NextResponse } from "next/server";
import { loadAllContent } from "@/lib/content-loader";
import { generateDailyMission } from "@/lib/mission-engine";
import type { UserProfile, UserContentState, MistakeCard } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      profile: UserProfile;
      userState?: UserContentState[];
      dueCards?: MistakeCard[];
      isFirstSession?: boolean;
    };
    if (!body.profile) {
      return NextResponse.json({ error: "Missing profile" }, { status: 400 });
    }
    const result = generateDailyMission({
      profile: body.profile,
      content: loadAllContent(),
      userState: body.userState ?? [],
      dueCards: body.dueCards ?? [],
      isFirstSession: body.isFirstSession,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
