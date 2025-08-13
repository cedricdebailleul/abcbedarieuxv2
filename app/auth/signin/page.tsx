import { redirect } from "next/navigation";

export default function SignInRedirect({ searchParams }: { searchParams: { message?: string } }) {
  // Rediriger vers la vraie page de connexion
  const params = searchParams.message ? `?message=${searchParams.message}` : "";
  redirect(`/login${params}`);
}
