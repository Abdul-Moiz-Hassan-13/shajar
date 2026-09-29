import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { createPerson, getAllPeople } from "@/lib/store";
import type { PersonInput } from "@/lib/types";

export async function GET() {
  const people = await getAllPeople();
  return NextResponse.json(people);
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PersonInput;

  if (!body.firstName || !body.gender) {
    return NextResponse.json(
      { error: "firstName and gender are required" },
      { status: 400 },
    );
  }

  const person = await createPerson(body);
  return NextResponse.json(person, { status: 201 });
}
