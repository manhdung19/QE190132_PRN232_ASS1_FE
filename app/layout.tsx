import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TaskTrack | Task & Team Management",
  description: "Quan ly phong ban, du an va cong viec — QE190132 PRN232.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
