"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RegistrationForm } from "./registration-form";
import { UserPlus } from "lucide-react";

interface RegistrationDialogProps {
  children?: React.ReactNode;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function RegistrationDialog({
  children,
  variant = "default",
  size = "default",
  className,
}: RegistrationDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant={variant} size={size} className={className}>
            <UserPlus className="h-4 w-4 mr-2" />
            Adhérer à l&apos;association
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rejoignez l&apos;Association ABC Bédarieux</DialogTitle>
          <DialogDescription>
            Soutenez le commerce local et l&apos;artisanat bédaricien en
            devenant membre de notre association. Remplissez le formulaire
            ci-dessous pour faire votre demande d&apos;adhésion.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <RegistrationForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
