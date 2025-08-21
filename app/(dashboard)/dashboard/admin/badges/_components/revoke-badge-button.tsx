"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { revokeBadgeAction } from "@/actions/badge";

interface RevokeBadgeButtonProps {
  badgeId: string;
  userId: string;
  badgeTitle: string;
  userEmail: string;
}

export function RevokeBadgeButton({ 
  badgeId, 
  userId, 
  badgeTitle, 
  userEmail 
}: RevokeBadgeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDialog, setShowDialog] = useState(false);

  const handleRevoke = async () => {
    startTransition(async () => {
      try {
        const result = await revokeBadgeAction({
          badgeId,
          userId,
        });

        if (result.success) {
          toast.success(`Badge retiré de ${userEmail}`);
          setShowDialog(false);
          router.refresh();
        } else {
          toast.error(result.error || "Erreur lors du retrait");
        }
      } catch {
        toast.error("Erreur lors du retrait du badge");
      }
    });
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retirer le badge</AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir retirer le badge &quot;{badgeTitle}&quot; à {userEmail} ? 
            Cette action est irréversible.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRevoke}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Retrait..." : "Retirer le badge"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}