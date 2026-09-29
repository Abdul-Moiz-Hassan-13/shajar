import { FamiliesHeader } from "@/components/headers/FamiliesHeader";
import { FamiliesList } from "@/components/FamiliesList";
import { computeFamilies } from "@/lib/families";
import { getAllPeople } from "@/lib/store";

export default async function FamiliesPage() {
  const people = await getAllPeople();
  const families = computeFamilies(people);

  return (
    <div className="flex flex-col gap-6">
      <FamiliesHeader />
      <FamiliesList families={families} />
    </div>
  );
}
