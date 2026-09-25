import { NextRequest, NextResponse } from "next/server";
import { deletePerson, getPerson, updatePerson } from "@/lib/store";
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
  const { id } = await params;
  const body = (await request.json()) as PersonInput;

  if (!body.firstName || !body.lastName || !body.gender) {
    return NextResponse.json(
      { error: "firstName, lastName, and gender are required" },
      { status: 400 },
    );
  }

  const person = await updatePerson(id, body);
  if (!person) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(person);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const ok = await deletePerson(id);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
