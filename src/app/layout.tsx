import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import { LanguageProvider } from "@/components/LanguageProvider";
import { NavBar } from "@/components/NavBar";
import type { Locale } from "@/lib/i18n/translations";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoNastaliqUrdu = Noto_Nastaliq_Urdu({
  variable: "--font-noto-nastaliq-urdu",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Shajar",
  description: "Shajar — your family tree, rooted in one place.",
};

// The tree page implements its own pinch-to-zoom on the diagram; the
// browser's native page-level pinch-zoom would otherwise fight with it
// (magnifying the whole screen instead of just the diagram), so it's
// disabled site-wide in favor of that in-app zoom.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const initialLocale: Locale =
    cookieStore.get("shajar-locale")?.value === "ur" ? "ur" : "en";

  return (
    <html
      lang={initialLocale === "ur" ? "ur" : "en"}
      dir={initialLocale === "ur" ? "rtl" : "ltr"}
      className={`${geistSans.variable} ${geistMono.variable} ${notoNastaliqUrdu.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider initialLocale={initialLocale}>
          <NavBar />
          <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
            {children}
          </main>
        </LanguageProvider>
      </body>
    </html>
  );
}
