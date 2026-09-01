import type { Metadata } from "next";
import { Itim } from "next/font/google";
import { GlobalErrorCatcher } from "@/components/GlobalErrorCatcher";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const itim = Itim({
  weight: "400",
  subsets: ["latin", "vietnamese"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://luminastudy.site'),
  title: {
    template: "%s | Lumina Vocabulary",
    default: "Lumina - Học từ vựng qua Video YouTube với AI",
  },
  description: "Lumina giúp bạn dễ dàng trích xuất, lưu trữ và học từ vựng, ngữ pháp từ bất kỳ video YouTube nào với sự hỗ trợ của AI. Trải nghiệm phương pháp học ngoại ngữ hoàn toàn mới.",
  keywords: ["học từ vựng", "trích xuất từ vựng youtube", "học ngoại ngữ qua video", "AI học tiếng anh", "AI học tiếng trung", "Lumina Vocabulary", "Lumina", "học ngôn ngữ"],
  authors: [{ name: "Lumina Team" }],
  creator: "Lumina",
  publisher: "Lumina",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Lumina - Khám phá và học từ vựng qua Video",
    description: "Trích xuất, lưu trữ và học từ vựng, thành ngữ từ bất kỳ video YouTube nào với sự hỗ trợ của AI. Nâng cao trình độ ngoại ngữ của bạn ngay hôm nay.",
    siteName: "Lumina Vocabulary",
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumina - Khám phá và học từ vựng qua Video",
    description: "Học ngoại ngữ chưa bao giờ dễ dàng đến thế! Trích xuất từ vựng từ YouTube bằng AI.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

import { Toaster } from "react-hot-toast";

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
      <head>
      </head>
      <body className="min-h-full flex flex-col font-sans" suppressHydrationWarning>
        <GlobalErrorCatcher />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          {modal}
          <Toaster 
            position="top-center" 
            toastOptions={{
              className: 'dark:bg-neutral-900 dark:text-white dark:border dark:border-neutral-800'
            }} 
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
