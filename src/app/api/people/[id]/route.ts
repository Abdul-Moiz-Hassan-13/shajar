import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { deletePerson, getPerson, renamePerson, updatePerson } from "@/lib/store";
import type { PersonInput } from "@/lib/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const person = await getPerson(id);
  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(person);
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as PersonInput;

  if (!body.firstName || !body.gender) {
    return NextResponse.json(
      { error: "firstName and gender are required" },
      { status: 400 },
    );
  }

  const person = await updatePerson(id, body);
  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(person);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  const { firstName, lastName } = body as Record<string, unknown>;
  if (
    typeof firstName !== "string" || !firstName.trim() ||
    typeof lastName !== "string"
  ) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const { id } = await params;
  const person = await renamePerson(id, {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
  });
  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(person);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const ok = await deletePerson(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
