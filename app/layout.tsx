import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast-context";

export const metadata: Metadata = {
  title: "TaskTrack | Task & Team Management",
  description: "Quản lý phòng ban, dự án và công việc — QE190132 PRN232.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className="h-full" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased font-sans" suppressHydrationWarning>
        <ToastProvider>
          <Navbar />
          <div className="flex-1">
            {children}
          </div>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
