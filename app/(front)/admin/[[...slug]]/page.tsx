import { redirect } from "next/navigation";

// Redirection pour les anciennes URLs /admin vers /dashboard/admin
export default async function AdminRedirectPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const resolvedParams = await params;
  const path = resolvedParams.slug ? resolvedParams.slug.join("/") : "";
  const newPath = path ? `/dashboard/admin/${path}` : "/dashboard/admin";
  
  redirect(newPath);
}