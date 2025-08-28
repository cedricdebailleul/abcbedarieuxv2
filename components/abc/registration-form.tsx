"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
// import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  IconLoader2,
  IconUserPlus,
  IconMail,
  IconFileText,
  IconCheck,
  IconCurrencyEuro,
} from "@tabler/icons-react";

// Schéma Zod pour le formulaire d'adhésion
const membershipFormSchema = z.object({
  // Informations personnelles
  lastName: z.string().min(1, "Le nom est obligatoire"),
  firstName: z.string().min(1, "Le prénom est obligatoire"),
  commercialName: z.string().optional(),
  address: z.string().min(1, "L'adresse est obligatoire"),
  postalCode: z.string().regex(/^\d{5}$/, "Code postal invalide (5 chiffres)"),
  city: z.string().min(1, "La ville est obligatoire"),
  phone: z.string().optional(),
  email: z.string().email("Email invalide"),
  website: z.string().url().optional().or(z.literal("")),

  // Type de membre (format API)
  membershipType: z.enum([
    "ACTIF",
    "ARTISAN",
    "AUTO_ENTREPRENEUR",
    "PARTENAIRE",
    "BIENFAITEUR",
  ]),

  // Cotisation
  cotisationAmount: z
    .number()
    .min(1, "Le montant de la cotisation doit être supérieur à 0"),
  paymentMethod: z.enum(["CHEQUE", "VIREMENT", "ESPECES"]),

  // Conditions
  acceptsStatuts: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les statuts de l'association",
  }),
  acceptsReglement: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter le règlement intérieur",
  }),
  acceptsCotisation: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter de verser la cotisation",
  }),
  
  // Champs requis par l'API
  motivation: z.string().optional(),
  interests: z.array(z.string()),
  birthDate: z.string().optional(),
  profession: z.string().optional(),
  company: z.string().optional(),
  siret: z.string().optional(),
});

type MembershipFormData = z.infer<typeof membershipFormSchema>;

const membershipTypes = [
  {
    value: "ACTIF" as const,
    label: "Membre actif",
    description: "120 €",
    amount: 120,
  },
  {
    value: "ARTISAN" as const,
    label: "Membre actif artisan",
    description: "60 € (sur justificatif)",
    amount: 60,
  },
  {
    value: "AUTO_ENTREPRENEUR" as const,
    label: "Membre actif auto-entrepreneur",
    description: "60 € (sur justificatif)",
    amount: 60,
  },
  {
    value: "PARTENAIRE" as const,
    label: "Membre partenaire",
    description: "minimum 60 €",
    amount: 60,
  },
  {
    value: "BIENFAITEUR" as const,
    label: "Membre bienfaiteur",
    description: "cotisation libre - Attestation de don sur demande",
    amount: 0,
  },
];

const paymentMethods = [
  { value: "CHEQUE" as const, label: "Chèque" },
  { value: "VIREMENT" as const, label: "Virement" },
  { value: "ESPECES" as const, label: "Espèces" },
];

interface RegistrationFormProps {
  onSuccess?: () => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps = {}) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const form = useForm<MembershipFormData>({
    resolver: zodResolver(membershipFormSchema),
    defaultValues: {
      lastName: "",
      firstName: "",
      commercialName: "",
      address: "",
      postalCode: "",
      city: "",
      phone: "",
      email: "",
      website: "",
      membershipType: "ACTIF",
      cotisationAmount: 120,
      paymentMethod: "CHEQUE",
      acceptsStatuts: false,
      acceptsReglement: false,
      acceptsCotisation: false,
      motivation: "",
      interests: [],
      birthDate: "",
      profession: "",
      company: "",
      siret: "",
    },
  });

  const watchedMembershipType = form.watch("membershipType");

  // Mettre à jour le montant de cotisation automatiquement
  useEffect(() => {
    const selectedType = membershipTypes.find(
      (type) => type.value === watchedMembershipType
    );
    if (selectedType && selectedType.amount > 0) {
      form.setValue("cotisationAmount", selectedType.amount);
    } else if (selectedType && selectedType.value === "BIENFAITEUR") {
      // Pour les bienfaiteurs, laisser le champ libre mais avec un minimum de 1€
      if (form.getValues("cotisationAmount") === 0) {
        form.setValue("cotisationAmount", 60);
      }
    }
  }, [watchedMembershipType, form]);

  const onSubmit = async (data: MembershipFormData) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/abc/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        onSuccess?.();
        form.reset();
      } else {
        setError(result.error || "Erreur lors de l'inscription");
      }
    } catch (error) {
      console.error("Erreur inscription:", error);
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full mx-auto border-none shadow-none">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <IconCheck className="h-16 w-16 text-green-600 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">
            Inscription envoyée !
          </h3>
          <p className="text-muted-foreground mb-4">
            Votre demande d&apos;adhésion à l&apos;association ABC Bédarieux a
            été envoyée avec succès.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-center space-x-2">
              <IconMail className="h-4 w-4" />
              <span>Un email de confirmation vous a été envoyé</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <IconFileText className="h-4 w-4" />
              <span>
                Le bulletin d&apos;inscription PDF est joint à l&apos;email
              </span>
            </div>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">
                Informations de paiement :
              </h4>
              <div className="text-sm text-blue-800">
                <p>
                  <strong>IBAN :</strong> FR76 1005 7190 4300 0142 6820 108
                </p>
                <p>
                  <strong>CODE BIC :</strong> CMCIFR
                </p>
              </div>
            </div>
          </div>
          <Button className="mt-6" onClick={() => setSuccess(false)}>
            Nouvelle inscription
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mx-auto border-none shadow-none">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* À remplir par le nouvel adhérent */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold">
                  À remplir par le nouvel adhérent
                </h3>
                <p className="text-sm text-muted-foreground">
                  Exemplaire à conserver par l&apos;association
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Votre nom" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Votre prénom" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="commercialName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dénomination commerciale</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nom de votre entreprise (optionnel)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Adresse */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Adresse</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adresse *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Votre adresse complète"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code postal *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="34600" maxLength={5} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ville *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Bédarieux" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Coordonnées */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Coordonnées</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="tel"
                          placeholder="06 12 34 56 78"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="votre.email@exemple.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Internet</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://votre-site-web.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Déclaration d'adhésion */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold">
                  Je déclare par la présente souhaiter devenir membre de
                  l&apos;ABC en tant que :
                </h3>
              </div>

              <FormField
                control={form.control}
                name="membershipType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <div className="space-y-4">
                        {membershipTypes.map((type) => (
                          <div
                            key={type.value}
                            className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                              field.value === type.value
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            onClick={() => field.onChange(type.value)}
                          >
                            <div className="flex items-center justify-center w-4 h-4 mt-1 rounded-full border-2 border-gray-400">
                              {field.value === type.value && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <div className="flex-1">
                              <Label className="text-base font-medium cursor-pointer">
                                {type.label} ({type.description})
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Montant de cotisation */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold">Cotisation</h3>
              </div>

              <FormField
                control={form.control}
                name="cotisationAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <IconCurrencyEuro className="h-4 w-4" />
                      Le montant de ma cotisation est de
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          {...field}
                          type="number"
                          min="1"
                          step="1"
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          className="w-32"
                        />
                        <span className="text-sm text-muted-foreground">€</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payable par</FormLabel>
                    <FormControl>
                      <div className="flex gap-6">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.value}
                            className="flex items-center space-x-2 cursor-pointer"
                            onClick={() => field.onChange(method.value)}
                          >
                            <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-gray-400">
                              {field.value === method.value && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              )}
                            </div>
                            <Label className="cursor-pointer">
                              {method.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">
                  Informations bancaires :
                </h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <strong>IBAN :</strong> FR76 1005 7190 4300 0142 6820 108
                  </p>
                  <p>
                    <strong>CODE BIC :</strong> CMCIFR
                  </p>
                </div>
              </div>
            </div>

            {/* Déclarations et engagements */}
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold">
                  Déclarations et engagements
                </h3>
              </div>

              <div className="space-y-4 text-sm">
                <p className="text-muted-foreground">
                  À ce titre, je déclare reconnaître l&apos;objet de
                  l&apos;association et en avoir accepté les statuts ainsi que
                  le règlement intérieur qui sont mis à ma disposition sur
                  demande auprès du bureau. J&apos;ai pris note des droits et
                  des devoirs des membres de l&apos;association et accepte de
                  verser ma cotisation due pour l&apos;année en cours.
                </p>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-3">
                    Je fournis pour mon inscription :
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li>
                      • le présent bulletin d&apos;adhésion rempli et signé
                    </li>
                    <li>• le paiement de ma cotisation annuelle</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="acceptsStatuts"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Je reconnais l&apos;objet de l&apos;association et
                          j&apos;accepte les statuts *
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptsReglement"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          J&apos;accepte le règlement intérieur de
                          l&apos;association *
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptsCotisation"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          J&apos;accepte de verser ma cotisation due pour
                          l&apos;année en cours *
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="pt-6 border-t">
              <Button
                type="submit"
                disabled={loading || !form.formState.isValid}
                className="w-full md:w-auto"
                size="lg"
              >
                {loading ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <IconUserPlus className="h-4 w-4 mr-2" />
                    Envoyer ma demande d&apos;adhésion
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Un bulletin d&apos;adhésion PDF vous sera envoyé par email après
                soumission.
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
