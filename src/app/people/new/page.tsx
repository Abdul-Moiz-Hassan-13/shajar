import { redirect } from "next/navigation";
import { PersonFormHeading } from "@/components/headers/PersonFormHeading";
import { PersonFormBackButton } from "@/components/PersonFormBackButton";
import { PersonForm } from "@/components/PersonForm";
import { isAuthenticated } from "@/lib/auth";
import { getAllPeople } from "@/lib/store";

export default async function NewPersonPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const people = await getAllPeople();

  return (
    <div className="person-form-page relative mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PersonFormBackButton />
      <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
        <PersonFormHeading />
        <PersonForm people={people} />
      </div>
    </div>
  );
}
