import { Suspense } from "react";
import { RelationsHeader } from "@/components/headers/RelationsHeader";
import { RelationshipFinder } from "@/components/RelationshipFinder";
import { getAllPeople } from "@/lib/store";

export default async function RelationsPage() {
  const people = await getAllPeople();

  return (
    <div className="flex flex-col gap-6">
      <RelationsHeader />
      <Suspense fallback={null}>
        <RelationshipFinder people={people} />
      </Suspense>
    </div>
  );
}
