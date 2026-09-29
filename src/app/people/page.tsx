import { PeopleHeader } from "@/components/headers/PeopleHeader";
import { PeopleTable } from "@/components/PeopleTable";
import { getAllPeople } from "@/lib/store";

export default async function PeoplePage() {
  const people = await getAllPeople();

  return (
    <div className="flex flex-col gap-6">
      <PeopleHeader />
      <PeopleTable people={people} />
    </div>
  );
}
