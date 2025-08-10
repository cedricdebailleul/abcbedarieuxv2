import { signOut, useSession } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import Link from "next/link";
import { Button } from "../ui/button";
import { ThemeToggle } from "../ui/theme-toggle";

export function NavUser() {
  const { data: session } = useSession();
  return (
    <div className="flex items-center space-x-4">
      {session ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="size-10 cursor-pointer">
              <AvatarImage
                src={session.user.image ?? undefined}
                alt={session.user.name ?? ""}
              />
              <AvatarFallback>
                {session.user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">Mon profil</Link>
            </DropdownMenuItem>
            {session.user.role === "ADMIN" && (
              <DropdownMenuItem asChild>
                <Link href="/admin">Administration</Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center space-x-2">
          <Button variant="ghost" asChild>
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
