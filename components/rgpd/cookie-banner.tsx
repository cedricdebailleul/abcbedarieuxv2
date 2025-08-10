"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { updateConsentAction } from "@/actions/gdpr-simple";
import { Cookie, Settings, X } from "lucide-react";
import { toast } from "sonner";

interface ConsentState {
  cookies: boolean;
  analytics: boolean;
  marketing: boolean;
}

export function SimpleCookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consent, setConsent] = useState<ConsentState>({
    cookies: false,
    analytics: false,
    marketing: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const hasConsent = localStorage.getItem("cookie-consent");
    if (!hasConsent) {
      setShowBanner(true);
    }
  }, []);

  const saveConsent = async (consentData: ConsentState) => {
    setIsLoading(true);

    const formData = new FormData();
    Object.entries(consentData).forEach(([key, value]) => {
      formData.append(key, value.toString());
    });

    const result = await updateConsentAction(formData);

    if (result.errors) {
      toast.error("Impossible de sauvegarder vos préférences");
    } else {
      localStorage.setItem("cookie-consent", "given");
      setShowBanner(false);
      setShowDetails(false);
      toast.success("Préférences sauvegardées");
    }

    setIsLoading(false);
  };

  const acceptAll = () => {
    const allAccepted = { cookies: true, analytics: true, marketing: true };
    setConsent(allAccepted);
    saveConsent(allAccepted);
  };

  const rejectAll = () => {
    const allRejected = { cookies: false, analytics: false, marketing: false };
    setConsent(allRejected);
    saveConsent(allRejected);
  };

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto md:left-auto md:right-4"
      >
        <Card className="p-6 shadow-lg border-2">
          <div className="flex items-start gap-3">
            <Cookie className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">🍪 Cookies</h3>

              {!showDetails ? (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Nous utilisons des cookies pour améliorer votre expérience.
                  </p>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={acceptAll}
                        disabled={isLoading}
                      >
                        Accepter
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={rejectAll}
                        disabled={isLoading}
                      >
                        Refuser
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDetails(true)}
                      className="text-xs"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      Personnaliser
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Préférences</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowDetails(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Fonctionnels</p>
                        <p className="text-xs text-muted-foreground">
                          Nécessaires
                        </p>
                      </div>
                      <Switch checked={true} disabled />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Préférences</p>
                        <p className="text-xs text-muted-foreground">
                          Mémorisation
                        </p>
                      </div>
                      <Switch
                        checked={consent.cookies}
                        onCheckedChange={(checked) =>
                          setConsent((prev) => ({ ...prev, cookies: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Analytics</p>
                        <p className="text-xs text-muted-foreground">
                          Statistiques
                        </p>
                      </div>
                      <Switch
                        checked={consent.analytics}
                        onCheckedChange={(checked) =>
                          setConsent((prev) => ({
                            ...prev,
                            analytics: checked,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Marketing</p>
                        <p className="text-xs text-muted-foreground">
                          Publicités
                        </p>
                      </div>
                      <Switch
                        checked={consent.marketing}
                        onCheckedChange={(checked) =>
                          setConsent((prev) => ({
                            ...prev,
                            marketing: checked,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => saveConsent(consent)}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Sauvegarder
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
