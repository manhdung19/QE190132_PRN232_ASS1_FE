import { redirect } from "next/navigation";

export default function LegacyProjectsManagePage() {
  redirect("/admin/projects");
}
