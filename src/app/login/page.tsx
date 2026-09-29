import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { LoginHeading } from "@/components/headers/LoginHeading";
import { isAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");

  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <LoginHeading />
        <LoginForm />
      </div>
    </div>
  );
}
