"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Trash2, Plus, ChevronsUpDown } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  GERANT: "Gérant",
  ASSOCIE: "Associé",
  SALARIE: "Salarié",
  AUTRE: "Autre",
};

interface PlaceLink {
  id: string;
  placeId: string;
  role: string;
  place: { name: string; slug: string };
}

interface Place {
  id: string;
  name: string;
  city: string;
}

interface MemberPlacesTabProps {
  memberId: string;
}

export function MemberPlacesTab({ memberId }: MemberPlacesTabProps) {
  const [links, setLinks] = useState<PlaceLink[]>([]);
  const [allPlaces, setAllPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [selectedRole, setSelectedRole] = useState("GERANT");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/abc/members/${memberId}/places`).then((r) => r.json()),
      fetch("/api/admin/abc/places-list").then((r) => r.json()),
    ]).then(([linksData, placesData]) => {
      setLinks(linksData.places ?? []);
      setAllPlaces(placesData.places ?? []);
      setLoading(false);
    });
  }, [memberId]);

  async function handleAdd() {
    if (!selectedPlaceId) return;
    setAdding(true);
    setError(null);
    const res = await fetch(`/api/admin/abc/members/${memberId}/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeId: selectedPlaceId, role: selectedRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur");
    } else {
      setLinks((prev) => [...prev, data.link]);
      setSelectedPlaceId("");
      setSelectedRole("GERANT");
    }
    setAdding(false);
  }

  async function handleRoleChange(placeId: string, role: string) {
    const res = await fetch(
      `/api/admin/abc/members/${memberId}/places/${placeId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }
    );
    if (res.ok) {
      setLinks((prev) =>
        prev.map((l) => (l.placeId === placeId ? { ...l, role } : l))
      );
    }
  }

  async function handleDelete(placeId: string) {
    const res = await fetch(
      `/api/admin/abc/members/${memberId}/places/${placeId}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      setLinks((prev) => prev.filter((l) => l.placeId !== placeId));
    }
  }

  if (loading)
    return <p className="text-sm text-muted-foreground">Chargement...</p>;

  return (
    <div className="space-y-4">
      {links.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucun commerce lié.</p>
      )}

      {links.map((link) => (
        <div
          key={link.id}
          className="flex items-center gap-2 rounded border p-2"
        >
          <span className="flex-1 text-sm font-medium">{link.place.name}</span>
          <Select
            value={link.role}
            onValueChange={(role) => handleRoleChange(link.placeId, role)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(link.placeId)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ))}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-2 pt-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="flex-1 justify-between">
              {selectedPlaceId
                ? allPlaces.find((p) => p.id === selectedPlaceId)?.name
                : "Choisir un commerce..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <Command>
              <CommandInput placeholder="Rechercher..." />
              <CommandEmpty>Aucun résultat.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {allPlaces
                    .filter((p) => !links.some((l) => l.placeId === p.id))
                    .map((place) => (
                      <CommandItem
                        key={place.id}
                        onSelect={() => {
                          setSelectedPlaceId(place.id);
                          setOpen(false);
                        }}
                      >
                        {place.name} — {place.city}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={handleAdd}
          disabled={!selectedPlaceId || adding}
          size="icon"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
