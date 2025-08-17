"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Download, 
  Trash2, 
  EyeOff, 
  Info, 
  AlertTriangle,
  CheckCircle,
  Mail
} from "lucide-react";
import { toast } from "sonner";

interface GdprInfo {
  dataController: string;
  purpose: string;
  legalBasis: string;
  retention: string;
  rights: string[];
  contact: {
    email: string;
    address: string;
  };
  availableActions: Array<{
    action: string;
    description: string;
  }>;
}

export default function DataRequestPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [gdprInfo, setGdprInfo] = useState<GdprInfo | null>(null);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [exportedData, setExportedData] = useState<any>(null);

  useEffect(() => {
    fetchGdprInfo();
  }, []);

  const fetchGdprInfo = async () => {
    try {
      const response = await fetch("/api/newsletter/gdpr");
      const data = await response.json();
      if (data.success) {
        setGdprInfo(data.info);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des infos RGPD:", error);
    }
  };

  const handleGdprRequest = async (action: string, confirmationRequired = false) => {
    if (confirmationRequired) {
      const confirmed = window.confirm(
        action === "delete" 
          ? "Êtes-vous sûr de vouloir supprimer définitivement toutes vos données ? Cette action est irréversible."
          : action === "anonymize"
          ? "Êtes-vous sûr de vouloir anonymiser vos données ? Vos informations personnelles seront supprimées mais les statistiques anonymes seront conservées."
          : "Continuer avec cette action ?"
      );
      
      if (!confirmed) return;
    }

    if (!email.trim()) {
      toast.error("Veuillez entrer votre adresse email");
      return;
    }

    setLoading(true);
    setActiveAction(action);
    
    try {
      const response = await fetch("/api/newsletter/gdpr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), action }),
      });

      const data = await response.json();

      if (data.success) {
        if (action === "export") {
          setExportedData(data.data);
          toast.success("Données exportées avec succès");
        } else {
          toast.success(data.message);
          setEmail(""); // Clear email after destructive actions
        }
      } else {
        toast.error(data.error || "Erreur lors de la demande");
      }
    } catch (error) {
      toast.error("Erreur lors de la demande RGPD");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  };

  const downloadData = () => {
    if (!exportedData) return;
    
    const dataStr = JSON.stringify(exportedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `newsletter-data-${email}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Gestion des Données Personnelles</h1>
          <p className="text-gray-600">
            Exercez vos droits RGPD concernant vos données de newsletter
          </p>
        </div>

        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">Informations RGPD</TabsTrigger>
            <TabsTrigger value="actions">Actions sur mes données</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            {gdprInfo && (
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Informations sur le traitement de vos données
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4">
                      <div>
                        <h4 className="font-semibold">Responsable du traitement</h4>
                        <p className="text-sm text-gray-600">{gdprInfo.dataController}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Finalité du traitement</h4>
                        <p className="text-sm text-gray-600">{gdprInfo.purpose}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Base légale</h4>
                        <p className="text-sm text-gray-600">{gdprInfo.legalBasis}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold">Durée de conservation</h4>
                        <p className="text-sm text-gray-600">{gdprInfo.retention}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Vos droits</CardTitle>
                    <CardDescription>
                      Conformément au RGPD, vous disposez des droits suivants
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {gdprInfo.rights.map((right, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{right}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Contact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a 
                          href={`mailto:${gdprInfo.contact.email}`}
                          className="text-blue-600 hover:underline"
                        >
                          {gdprInfo.contact.email}
                        </a>
                      </div>
                      <p className="text-sm text-gray-600">{gdprInfo.contact.address}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="actions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Exercer vos droits</CardTitle>
                <CardDescription>
                  Entrez votre adresse email pour accéder à vos données
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Adresse email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="grid gap-4">
                  {/* Export des données */}
                  <Card className="border-blue-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Download className="w-5 h-5 text-blue-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold">Exporter mes données</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Téléchargez toutes vos données personnelles au format JSON
                          </p>
                          <Button
                            onClick={() => handleGdprRequest("export")}
                            disabled={loading || !email.trim()}
                            variant="outline"
                            size="sm"
                            className="border-blue-300"
                          >
                            {loading && activeAction === "export" ? "Export..." : "Exporter"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Anonymisation */}
                  <Card className="border-orange-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <EyeOff className="w-5 h-5 text-orange-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold">Anonymiser mes données</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Supprime vos informations personnelles mais conserve les statistiques anonymes
                          </p>
                          <Button
                            onClick={() => handleGdprRequest("anonymize", true)}
                            disabled={loading || !email.trim()}
                            variant="outline"
                            size="sm"
                            className="border-orange-300"
                          >
                            {loading && activeAction === "anonymize" ? "Anonymisation..." : "Anonymiser"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Suppression définitive */}
                  <Card className="border-red-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <Trash2 className="w-5 h-5 text-red-600 mt-1" />
                        <div className="flex-1">
                          <h4 className="font-semibold">Supprimer définitivement</h4>
                          <p className="text-sm text-gray-600 mb-3">
                            Supprime complètement et définitivement toutes vos données. Cette action est irréversible.
                          </p>
                          <Alert className="mb-3">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              Attention : Cette action supprimera définitivement toutes vos données et ne peut pas être annulée.
                            </AlertDescription>
                          </Alert>
                          <Button
                            onClick={() => handleGdprRequest("delete", true)}
                            disabled={loading || !email.trim()}
                            variant="destructive"
                            size="sm"
                          >
                            {loading && activeAction === "delete" ? "Suppression..." : "Supprimer définitivement"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Données exportées */}
            {exportedData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Données exportées
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="text-xs text-gray-600 overflow-auto max-h-60">
                      {JSON.stringify(exportedData, null, 2)}
                    </pre>
                  </div>
                  <Button onClick={downloadData} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger le fichier JSON
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link href="/">
              Retour à l'accueil
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}