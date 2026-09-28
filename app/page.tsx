import { PageHeader } from "@/components/page-header";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-16 sm:py-24">
      <PageHeader />
      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold">Không gian quản lý công việc</h2>
        <p className="mt-3 max-w-2xl leading-7 text-slate-600">
          Theo dõi phòng ban, dự án, công việc và nhãn trong một ứng dụng.
          Các chức năng quản lý đang được xây dựng.
        </p>
      </section>
    </main>
  );
}
