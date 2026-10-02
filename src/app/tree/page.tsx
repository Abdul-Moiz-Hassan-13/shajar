import { FamilyTree } from "@/components/FamilyTree";
import { TreeHeader } from "@/components/headers/TreeHeader";
import { getAllPeople } from "@/lib/store";

export default async function TreePage() {
  const people = await getAllPeople();

  return (
    <div className="tree-page-shell flex flex-col gap-6">
      <TreeHeader />
      <FamilyTree people={people} />
    </div>
  );
}
