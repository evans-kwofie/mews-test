import { NextRequest, NextResponse } from "next/server";
import { mewsPost } from "../mews/config";

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email } = await req.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "firstName, lastName, and email are required" },
        { status: 400 }
      );
    }

    const data = await mewsPost("customers/add", {
      FirstName: firstName,
      LastName: lastName,
      Email: email,
    });

    return NextResponse.json({ customer: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
