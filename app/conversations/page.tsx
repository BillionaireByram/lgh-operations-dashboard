import { redirect } from "next/navigation";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default function ConversationsPage() {
  redirect("/conversations/voice");
}
