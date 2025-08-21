"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { searchUsersAction, awardBadgeAction } from "@/actions/badge";
import { UserSearchResult } from "@/lib/types/badge";

interface ManualAwardBadgeProps {
  badgeId: string;
  badgeTitle: string;
}

export function ManualAwardBadge({
  badgeId,
  badgeTitle,
}: ManualAwardBadgeProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [userQuery, setUserQuery] = useState("");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(
    null
  );
  const [reason, setReason] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);

  // Rechercher des utilisateurs
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUsers([]);
      return;
    }

    setSearchLoading(true);
    try {
      const result = await searchUsersAction(query);
      if (result.success) {
        setUsers(result.data || []);
      } else {
        toast.error(result.error || "Erreur lors de la recherche");
      }
    } catch {
      toast.error("Erreur lors de la recherche d'utilisateurs");
    }
    setSearchLoading(false);
  };

  // Attribuer le badge
  const handleAward = async () => {
    if (!selectedUser || !reason.trim()) {
      toast.error("Veuillez sélectionner un utilisateur et saisir une raison");
      return;
    }

    startTransition(async () => {
      try {
        const result = await awardBadgeAction({
          badgeId,
          userId: selectedUser.id,
          reason: reason.trim(),
        });

        if (result.success) {
          toast.success(`Badge attribué à ${selectedUser.email}`);
          // Réinitialiser le formulaire
          setSelectedUser(null);
          setReason("");
          setUserQuery("");
          // Recharger la page pour voir les changements
          router.refresh();
        } else {
          toast.error(result.error || "Erreur lors de l'attribution");
        }
      } catch {
        toast.error("Erreur lors de l'attribution du badge");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Sélection de l'utilisateur */}
      <div>
        <Label htmlFor="user">Utilisateur *</Label>
        {selectedUser ? (
          <div className="flex items-center gap-2 p-2 border rounded-md mt-1">
            <Avatar className="h-8 w-8">
              <AvatarImage src={selectedUser.image || ""} />
              <AvatarFallback>
                {selectedUser.name?.[0] || selectedUser.email[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">
                {selectedUser.name || selectedUser.email}
              </div>
              {selectedUser.name && (
                <div className="text-xs text-muted-foreground truncate">
                  {selectedUser.email}
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedUser(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={userSearchOpen}
                className="w-full justify-start mt-1"
              >
                <Search className="mr-2 h-4 w-4" />
                Rechercher un utilisateur...
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <Command>
                <CommandInput
                  placeholder="Rechercher par email ou nom..."
                  value={userQuery}
                  onValueChange={(value) => {
                    setUserQuery(value);
                    searchUsers(value);
                  }}
                />
                <CommandList>
                  <CommandEmpty>
                    {searchLoading
                      ? "Recherche..."
                      : "Aucun utilisateur trouvé"}
                  </CommandEmpty>
                  <CommandGroup>
                    {users.map((user) => (
                      <CommandItem
                        key={user.id}
                        onSelect={() => {
                          setSelectedUser(user);
                          setUserSearchOpen(false);
                          setUserQuery("");
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.image || ""} />
                            <AvatarFallback>
                              {user.name?.[0] || user.email[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">
                              {user.name || user.email}
                            </div>
                            {user.name && (
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Raison */}
      <div>
        <Label htmlFor="reason">Raison de l&apos;attribution *</Label>
        <Textarea
          id="reason"
          placeholder="Pourquoi attribuer ce badge à cet utilisateur ?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[80px] mt-1"
        />
        <div className="text-xs text-muted-foreground mt-1">
          Cette raison sera visible pour l&apos;utilisateur
        </div>
      </div>

      {/* Bouton d'attribution */}
      <Button
        onClick={handleAward}
        disabled={!selectedUser || !reason.trim() || isPending}
        className="w-full"
      >
        {isPending ? (
          "Attribution..."
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Attribuer le badge
          </>
        )}
      </Button>

      {selectedUser && (
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded border">
          💡 Le badge &quot;{badgeTitle}&quot; sera attribué à{" "}
          {selectedUser.email} avec la raison fournie.
        </div>
      )}
    </div>
  );
}
