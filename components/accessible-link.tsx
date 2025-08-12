import Link from "next/link";
import { cn } from "@/lib/utils"; // garde ton util cn existant

export function AccessibleLink({
  href,
  isActive,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { isActive?: boolean }) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn("underline-offset-4 hover:underline focus-visible:outline-2", className)}
      {...props}
    >
      {children}
    </Link>
  );
}
