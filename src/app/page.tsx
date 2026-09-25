import Link from "next/link";
import { getAllPeople } from "@/lib/store";

export default async function Home() {
  const people = await getAllPeople();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-black/60 dark:text-white/60">
          You have {people.length}{" "}
          {people.length === 1 ? "person" : "people"} in your family tree.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/people/new"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black"
        >
          Add a person
        </Link>
        <Link
          href="/tree"
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          View tree
        </Link>
        <Link
          href="/people"
          className="rounded-md border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/20"
        >
          Manage people
        </Link>
      </div>
    </div>
  );
}
