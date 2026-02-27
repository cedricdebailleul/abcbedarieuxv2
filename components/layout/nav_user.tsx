import Link from "next/link";
import { User } from "lucide-react";
import { signOut, useSession } from "@/lib/auth-client";
import { safeUserCast } from "@/lib/auth-helpers-client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export function NavUser() {
  const { data: session } = useSession();
  return (
    <div className="flex items-center space-x-4">
      {session ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="size-10 cursor-pointer">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name ?? ""} />
              <AvatarFallback>{session.user.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8} className="z-[99999]">
            <DropdownMenuItem asChild>
              <Link href="/dashboard">Dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">Mon profil</Link>
            </DropdownMenuItem>
            {safeUserCast(session.user).role === "admin" && (
              <DropdownMenuItem asChild>
                <Link href="/admin">Administration</Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>Se déconnecter</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center">
          {/* Icône seule sur mobile */}
          <Button variant="ghost" size="icon" asChild className="md:hidden">
            <Link href="/login">
              <User className="size-5" />
            </Link>
          </Button>
          {/* Texte sur desktop */}
          <Button variant="ghost" asChild className="hidden md:flex">
            <Link href="/login">Se connecter</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
