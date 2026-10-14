import { redirect } from "next/navigation";

export default function LegacyTagsManagePage() {
  redirect("/admin/tags");
}
