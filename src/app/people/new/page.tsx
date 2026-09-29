import { PersonFormHeading } from "@/components/headers/PersonFormHeading";
import { PersonForm } from "@/components/PersonForm";
import { getAllPeople } from "@/lib/store";

export default async function NewPersonPage() {
  const people = await getAllPeople();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <PersonFormHeading />
      <PersonForm people={people} />
    </div>
  );
}
