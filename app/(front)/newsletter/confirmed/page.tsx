"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Home, Mail } from "lucide-react";

export default function NewsletterConfirmedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-lg p-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <Check className="w-8 h-8 text-green-600" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-gray-900 mb-4"
        >
          Abonnement confirmé !
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4 mb-8"
        >
          <p className="text-gray-600">
            Merci d&apos;avoir confirmé votre abonnement à la newsletter
            d&apos;ABC Bédarieux.
          </p>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
              <Mail className="w-5 h-5" />
              <span className="font-medium">Vous êtes maintenant abonné !</span>
            </div>
            <p className="text-sm text-blue-600">
              Vous recevrez bientôt nos actualités, événements et offres
              spéciales directement dans votre boîte email.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Button asChild className="w-full">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Retour à l&apos;accueil
            </Link>
          </Button>

          <Button variant="outline" asChild className="w-full">
            <Link href="/newsletter">Gérer mes préférences</Link>
          </Button>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-gray-500 mt-6"
        >
          Vous pouvez vous désabonner à tout moment en cliquant sur le lien de
          désinscription présent dans nos emails.
        </motion.p>
      </motion.div>
    </div>
  );
}
