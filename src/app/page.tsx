import { HomeContent } from "@/components/HomeContent";
import { computeLayout } from "@/lib/treeLayout";
import { getAllPeople } from "@/lib/store";

export default async function Home() {
  const people = await getAllPeople();

  if (people.length === 0) {
    return <HomeContent peopleCount={0} generations={0} couples={0} living={0} roots={[]} />;
  }

  const layout = computeLayout(people);
  const generations = layout.nodes.reduce(
    (max, n) => Math.max(max, n.gen),
    0,
  ) + 1;
  const roots = people.filter((p) => p.parentIds.length === 0);
  const couples = people.filter((p) => p.spouseIds.length > 0).length / 2;
  const living = people.filter((p) => !p.isDeceased).length;

  return (
    <HomeContent
      peopleCount={people.length}
      generations={generations}
      couples={couples}
      living={living}
      roots={roots}
    />
  );
}
