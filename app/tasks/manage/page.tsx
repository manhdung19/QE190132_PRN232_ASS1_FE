import { redirect } from "next/navigation";

export default function LegacyTasksManagePage() {
  redirect("/admin/tasks");
}
