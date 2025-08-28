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
            <UserPlus className="size-4 mr-2" />
            Adhérer à l&apos;association
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] h-[90vh] max-h-[90vh] flex flex-col p-0">
        <div className="flex-shrink-0 px-6 py-4 lg:px-8 lg:py-6 border-b">
          <DialogHeader>
            <DialogTitle className="text-xl lg:text-2xl">
              Rejoignez l&apos;Association ABC Bédarieux
            </DialogTitle>
            <DialogDescription className="text-base lg:text-lg">
              Soutenez le commerce local et l&apos;artisanat bédaricien en
              devenant membre de notre association. Remplissez le formulaire
              ci-dessous pour faire votre demande d&apos;adhésion.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 lg:px-8 lg:py-6">
          <RegistrationForm onSuccess={handleSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
