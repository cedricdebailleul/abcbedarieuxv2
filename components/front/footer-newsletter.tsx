"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, Mail, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: email.trim(),
          source: "footer",
          preferences: {
            events: true,
            places: true,
            offers: false,
            news: true,
            frequency: "WEEKLY",
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubscribed(true);
        setEmail("");
        setShowForm(false);
        toast.success(data.message || "Inscription réussie ! Vérifiez votre email.");
      } else {
        toast.error(data.error || "Erreur lors de l'inscription");
      }
    } catch (error) {
      toast.error("Erreur lors de l'inscription à la newsletter");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="flex justify-end h-full"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 12 }}
    >
      <div className="bg-blue-100 text-gray-900 p-6 rounded-2xl max-w-md w-full">
        <div className="text-xs text-gray-600 mb-2 tracking-wide">
          POUR PLUS D&apos;INFORMATION
        </div>
        
        {!isSubscribed ? (
          <>
            <h3 className="text-xl font-bold mb-6">Abonnez-vous à l&apos;essentiel</h3>
            
            {!showForm ? (
              <div className="flex gap-3">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-full w-full"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    S&apos;abonner à la newsletter
                  </Button>
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1"
                >
                  <Button
                    variant="outline"
                    className="border-blue-300 text-gray-900 hover:bg-pink-50 px-6 py-2 rounded-full w-full bg-transparent"
                    asChild
                  >
                    <Link href="/contact">
                      S&apos;abonner aux avis
                    </Link>
                  </Button>
                </motion.div>
              </div>
            ) : (
              <motion.form 
                onSubmit={handleSubscribe}
                className="space-y-4"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white border-blue-200 focus:border-blue-400"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    type="submit"
                    disabled={isLoading}
                    className="bg-gray-900 hover:bg-gray-800 text-white flex-1"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                    ) : (
                      "S'abonner"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEmail("");
                    }}
                    className="border-blue-300 text-gray-900 hover:bg-pink-50 bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Information RGPD */}
                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 mt-0.5 text-blue-600 flex-shrink-0" />
                    <p>
                      En vous abonnant, vous acceptez de recevoir nos emails et vous pouvez vous désabonner à tout moment.
                    </p>
                  </div>
                  <p>
                    Conformément au RGPD, vos données sont protégées. 
                    <Link href="/privacy" className="underline hover:text-blue-700 ml-1">
                      Politique de confidentialité
                    </Link>
                  </p>
                </div>
              </motion.form>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="text-center space-y-4"
          >
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-2">Merci !</h3>
              <p className="text-gray-600 text-sm">
                Vous êtes maintenant abonné à notre newsletter. 
                Vérifiez votre boîte email pour confirmer votre inscription.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setIsSubscribed(false);
                setShowForm(false);
              }}
              className="border-blue-300 text-gray-900 hover:bg-blue-50 bg-transparent"
            >
              S&apos;abonner avec un autre email
            </Button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}