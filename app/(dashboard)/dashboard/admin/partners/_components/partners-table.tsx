"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ExternalLink,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";

interface Partner {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  website?: string;
  email?: string;
  phone?: string;
  partnerType: string;
  category?: string;
  priority: number;
  isActive: boolean;
  isFeatured: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface PartnersTableProps {
  partners: Partner[];
  onDelete: (id: string) => void;
  onToggleActive: (id: string, isActive: boolean) => void;
  onToggleFeatured: (id: string, isFeatured: boolean) => void;
}

const partnerTypeLabels = {
  COMMERCIAL: "Commercial",
  INSTITUTIONAL: "Institutionnel",
  MEDIA: "Média",
  TECHNICAL: "Technique",
  SPONSOR: "Sponsor",
  SUPPLIER: "Fournisseur",
  OTHER: "Autre",
};

const partnerTypeColors = {
  COMMERCIAL: "bg-blue-100 text-blue-800",
  INSTITUTIONAL: "bg-purple-100 text-purple-800",
  MEDIA: "bg-orange-100 text-orange-800",
  TECHNICAL: "bg-green-100 text-green-800",
  SPONSOR: "bg-yellow-100 text-yellow-800",
  SUPPLIER: "bg-gray-100 text-gray-800",
  OTHER: "bg-slate-100 text-slate-800",
};

export function PartnersTable({
  partners,
  onDelete,
  onToggleActive,
  onToggleFeatured,
}: PartnersTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  const handleDeleteClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedPartner) {
      onDelete(selectedPartner.id);
      setDeleteDialogOpen(false);
      setSelectedPartner(null);
    }
  };

  const handleToggleActive = async (partner: Partner) => {
    try {
      await onToggleActive(partner.id, !partner.isActive);
      toast.success(
        partner.isActive ? "Partenaire désactivé" : "Partenaire activé"
      );
    } catch {
      toast.error("Erreur lors de la modification du statut");
    }
  };

  const handleToggleFeatured = async (partner: Partner) => {
    try {
      await onToggleFeatured(partner.id, !partner.isFeatured);
      toast.success(
        partner.isFeatured
          ? "Partenaire retiré de la mise en avant"
          : "Partenaire mis en avant"
      );
    } catch {
      toast.error("Erreur lors de la modification de la mise en avant");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR");
  };

  if (partners.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Aucun partenaire trouvé</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partenaire</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner) => (
              <TableRow key={partner.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {partner.logo ? (
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden">
                        <Image
                          src={partner.logo}
                          alt={partner.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {partner.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{partner.name}</p>
                        {partner.isFeatured && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      {partner.category && (
                        <p className="text-sm text-muted-foreground">
                          {partner.category}
                        </p>
                      )}
                      {partner.website && (
                        <a
                          href={partner.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                        >
                          Voir le site <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      partnerTypeColors[
                        partner.partnerType as keyof typeof partnerTypeColors
                      ]
                    }
                  >
                    {
                      partnerTypeLabels[
                        partner.partnerType as keyof typeof partnerTypeLabels
                      ]
                    }
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{partner.priority}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge
                      variant={partner.isActive ? "default" : "secondary"}
                      className={
                        partner.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {partner.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(partner.createdAt)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/admin/partners/${partner.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Voir
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link
                          href={`/dashboard/admin/partners/${partner.id}/edit`}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(partner)}
                      >
                        {partner.isActive ? (
                          <>
                            <StarOff className="mr-2 h-4 w-4" />
                            Désactiver
                          </>
                        ) : (
                          <>
                            <Star className="mr-2 h-4 w-4" />
                            Activer
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleFeatured(partner)}
                      >
                        {partner.isFeatured ? (
                          <>
                            <StarOff className="mr-2 h-4 w-4" />
                            Retirer de la une
                          </>
                        ) : (
                          <>
                            <Star className="mr-2 h-4 w-4" />
                            Mettre en avant
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(partner)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le partenaire &quot;
              {selectedPartner?.name}&quot; ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
