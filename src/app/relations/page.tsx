import { RelationshipFinder } from "@/components/RelationshipFinder";
import { getAllPeople } from "@/lib/store";

export default async function RelationsPage() {
  const people = await getAllPeople();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">How are they related?</h1>
        <p className="mt-1 text-black/60 dark:text-white/60">
          Pick any two people to see their relationship and how they connect.
        </p>
      </div>
      <RelationshipFinder people={people} />
    </div>
  );
}
