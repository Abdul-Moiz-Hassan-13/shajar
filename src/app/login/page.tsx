import { redirect } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { LoginHeading } from "@/components/headers/LoginHeading";
import { LoginWelcome } from "@/components/LoginWelcome";
import { isAuthenticated } from "@/lib/auth";

export default async function LoginPage() {
  if (await isAuthenticated()) redirect("/");

  return (
    <div className="login-page-shell -mt-6 box-border flex min-h-0 items-center justify-center py-4 pb-0 sm:py-6 sm:pb-0">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-black/10 bg-white shadow-2xl shadow-emerald-950/10 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-black/30 md:grid-cols-[0.9fr_1.1fr]">
        <LoginWelcome />
        <div className="login-form-panel flex flex-col justify-center p-6 sm:p-8 lg:p-10">
          <LoginHeading />
          <div className="mt-6">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
