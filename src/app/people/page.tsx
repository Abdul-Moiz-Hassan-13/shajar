import Link from "next/link";
import { PeopleTable } from "@/components/PeopleTable";
import { getAllPeople } from "@/lib/store";

export default async function PeoplePage() {
  const people = await getAllPeople();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">People</h1>
        <Link
          href="/people/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Add a person
        </Link>
      </div>

      <PeopleTable people={people} />
    </div>
  );
}
