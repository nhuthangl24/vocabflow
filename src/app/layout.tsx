import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Lumina Vocabulary",
  description: "Learn vocabulary from YouTube videos",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${jakarta.className} h-full antialiased text-slate-900 bg-slate-50`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
