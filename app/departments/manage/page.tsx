import { redirect } from "next/navigation";

export default function LegacyDepartmentsManagePage() {
  redirect("/admin/departments");
}
