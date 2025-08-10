import { buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center">
      <Link
        href="/"
        className={buttonVariants({
          variant: "outline",
          className: "absolute top-4 left-4",
        })}
      >
        <ArrowLeft className="size-4" />
        Retour à l&apos;accueil
      </Link>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <Link
          href="/"
          className="flex items-center gap-2 self-center font-medium"
        >
          ABC Bédarieux
        </Link>
        {children}
        <div className="text-balance text-center text-xs text-muted-foreground">
          En cliquant sur continuer, vous acceptez nos{" "}
          <span className="hover:text-primary hover:underline">
            Termes et conditions
          </span>
          , et{" "}
          <span className="hover:text-primary hover:underline">
            la politique de confidentialité
          </span>
          .
        </div>
      </div>
    </div>
  );
}
