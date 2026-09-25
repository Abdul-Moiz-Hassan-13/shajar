import { PersonForm } from "@/components/PersonForm";
import { getAllPeople } from "@/lib/store";

export default async function NewPersonPage() {
  const people = await getAllPeople();

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add a person</h1>
      <PersonForm people={people} />
    </div>
  );
}
