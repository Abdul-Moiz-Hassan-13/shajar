import { notFound } from "next/navigation";
import { PersonFormHeading } from "@/components/headers/PersonFormHeading";
import { PersonForm } from "@/components/PersonForm";
import { getAllPeople, getPerson } from "@/lib/store";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPersonPage({ params }: PageProps) {
  const { id } = await params;
  const [person, people] = await Promise.all([
    getPerson(id),
    getAllPeople(),
  ]);

  if (!person) notFound();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PersonFormHeading person={person} />
      <PersonForm person={person} people={people} />
    </div>
  );
}
