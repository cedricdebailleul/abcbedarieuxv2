"use client";

import { useState, useTransition } from "react";
import { Users, UserPlus, UserMinus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { useSession } from "@/hooks/use-session";
import { participateInEventAction } from "@/actions/event";
import { ParticipationStatus } from "@/lib/generated/prisma";

interface EventParticipationButtonProps {
  eventId: string;
  eventTitle: string;
  isFull: boolean;
  waitingListEnabled: boolean;
  currentStatus?: ParticipationStatus | null;
  className?: string;
}

const PARTICIPATION_STATUS_LABELS: Record<ParticipationStatus, string> = {
  [ParticipationStatus.INTERESTED]: "Intéressé(e)",
  [ParticipationStatus.GOING]: "Je participe",
  [ParticipationStatus.MAYBE]: "Peut-être",
  [ParticipationStatus.NOT_GOING]: "Je ne participe pas",
  [ParticipationStatus.CANCELLED]: "Annulé",
  [ParticipationStatus.WAITLISTED]: "Liste d'attente"
};

const PARTICIPATION_STATUS_COLORS: Record<ParticipationStatus, string> = {
  [ParticipationStatus.INTERESTED]: "text-blue-600",
  [ParticipationStatus.GOING]: "text-green-600", 
  [ParticipationStatus.MAYBE]: "text-yellow-600",
  [ParticipationStatus.NOT_GOING]: "text-red-600",
  [ParticipationStatus.CANCELLED]: "text-gray-600",
  [ParticipationStatus.WAITLISTED]: "text-orange-600"
};

export function EventParticipationButton({
  eventId,
  eventTitle,
  isFull,
  waitingListEnabled,
  currentStatus = null,
  className
}: EventParticipationButtonProps) {
  const { data: session, status } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<ParticipationStatus>(
    currentStatus || ParticipationStatus.GOING
  );
  const [guestCount, setGuestCount] = useState(0);
  const [specialNeeds, setSpecialNeeds] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleParticipation = () => {
    if (!session?.user) {
      toast.error("Vous devez être connecté pour participer");
      return;
    }

    startTransition(async () => {
      try {
        const result = await participateInEventAction(
          eventId,
          selectedStatus,
          guestCount,
          specialNeeds || undefined
        );

        if (result.success) {
          const statusLabel = PARTICIPATION_STATUS_LABELS[selectedStatus].toLowerCase();
          toast.success(
            `Votre participation à "${eventTitle}" a été mise à jour : ${statusLabel}`
          );
          setIsDialogOpen(false);
          
          // Recharger la page pour voir les changements
          window.location.reload();
        } else {
          toast.error(result.error || "Erreur lors de la participation");
        }
      } catch (error) {
        toast.error("Une erreur est survenue");
        console.error("Erreur participation:", error);
      }
    });
  };

  const getButtonText = () => {
    if (currentStatus) {
      return PARTICIPATION_STATUS_LABELS[currentStatus];
    }
    if (isFull && !waitingListEnabled) {
      return "Événement complet";
    }
    if (isFull && waitingListEnabled) {
      return "Rejoindre la liste d'attente";
    }
    return "Participer";
  };

  const getButtonVariant = () => {
    if (currentStatus === ParticipationStatus.GOING) return "default";
    if (currentStatus === ParticipationStatus.INTERESTED) return "secondary";
    if (currentStatus === ParticipationStatus.MAYBE) return "outline";
    if (currentStatus === ParticipationStatus.NOT_GOING) return "destructive";
    if (currentStatus === ParticipationStatus.WAITLISTED) return "outline";
    return "default";
  };

  const getButtonIcon = () => {
    if (isPending) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (currentStatus === ParticipationStatus.GOING) return <Users className="w-4 h-4" />;
    if (currentStatus === ParticipationStatus.NOT_GOING) return <UserMinus className="w-4 h-4" />;
    return <UserPlus className="w-4 h-4" />;
  };

  if (status === "loading") {
    return (
      <Button disabled className={className}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Chargement...
      </Button>
    );
  }

  if (status === "unauthenticated") {
    return (
      <Button disabled className={className}>
        <Users className="w-4 h-4 mr-2" />
        Connexion requise
      </Button>
    );
  }

  if (isFull && !waitingListEnabled && !currentStatus) {
    return (
      <Button disabled variant="secondary" className={className}>
        <Users className="w-4 h-4 mr-2" />
        Complet
      </Button>
    );
  }

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={getButtonVariant()}
          className={`${className} ${
            currentStatus ? PARTICIPATION_STATUS_COLORS[currentStatus] : ""
          }`}
          disabled={isPending}
        >
          {getButtonIcon()}
          {!isPending && <span className="ml-2">{getButtonText()}</span>}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentStatus ? "Modifier ma participation" : "Participer à l'événement"}
          </DialogTitle>
          <DialogDescription>
            {eventTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statut de participation */}
          <div className="space-y-2">
            <Label htmlFor="status">Votre participation</Label>
            <Select
              value={selectedStatus}
              onValueChange={(value) => setSelectedStatus(value as ParticipationStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ParticipationStatus.GOING}>
                  Je participe
                </SelectItem>
                <SelectItem value={ParticipationStatus.INTERESTED}>
                  Intéressé(e)
                </SelectItem>
                <SelectItem value={ParticipationStatus.MAYBE}>
                  Peut-être
                </SelectItem>
                <SelectItem value={ParticipationStatus.NOT_GOING}>
                  Je ne participe pas
                </SelectItem>
                {isFull && waitingListEnabled && (
                  <SelectItem value={ParticipationStatus.WAITLISTED}>
                    Liste d'attente
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Nombre d'invités */}
          {(selectedStatus === ParticipationStatus.GOING || 
            selectedStatus === ParticipationStatus.WAITLISTED) && (
            <div className="space-y-2">
              <Label htmlFor="guests">Nombre d'accompagnants</Label>
              <Input
                id="guests"
                type="number"
                min="0"
                max="10"
                value={guestCount}
                onChange={(e) => setGuestCount(parseInt(e.target.value) || 0)}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Nombre de personnes qui vous accompagnent (sans vous compter)
              </p>
            </div>
          )}

          {/* Besoins spéciaux */}
          {(selectedStatus === ParticipationStatus.GOING || 
            selectedStatus === ParticipationStatus.WAITLISTED) && (
            <div className="space-y-2">
              <Label htmlFor="special-needs">
                Besoins spéciaux ou informations complémentaires
              </Label>
              <Textarea
                id="special-needs"
                value={specialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.value)}
                placeholder="Allergies, régime alimentaire, accessibilité, etc."
                rows={3}
              />
            </div>
          )}

          {/* Messages d'information */}
          {isFull && selectedStatus === ParticipationStatus.GOING && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-800">
                ⚠️ Cet événement est complet. Vous serez ajouté à la liste d'attente.
              </p>
            </div>
          )}

          {selectedStatus === ParticipationStatus.NOT_GOING && (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-600">
                Vous ne participez plus à cet événement. Vous pourrez changer d'avis plus tard.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsDialogOpen(false)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleParticipation}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Confirmer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}