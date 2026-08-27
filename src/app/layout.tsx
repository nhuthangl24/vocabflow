import type { Metadata } from "next";
import { Itim } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const itim = Itim({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Lumina Vocabulary",
  description: "Learn vocabulary from YouTube videos",
};

export default function RootLayout({ 
  children,
  modal
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${itim.variable} h-full antialiased text-slate-900 bg-slate-50 dark:bg-neutral-950 dark:text-slate-50 dark:bg-[#0a0a0a]`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {modal}
        </ThemeProvider>
      </body>
    </html>
  );
}
