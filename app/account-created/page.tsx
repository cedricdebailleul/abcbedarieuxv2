"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Trophy, Sparkles, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AccountCreatedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFireworks, setShowFireworks] = useState(false);
  
  const name = searchParams.get("name") || "Nouvel utilisateur";
  const email = searchParams.get("email") || "";

  useEffect(() => {
    // Démarrer les feux d'artifice après un petit délai
    const timer = setTimeout(() => {
      setShowFireworks(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleContinue = () => {
    router.push("/login?message=account-created");
  };

  const fireworkVariants = {
    hidden: { 
      scale: 0, 
      rotate: 0,
      opacity: 0 
    },
    visible: { 
      scale: 1.2, 
      rotate: 360,
      opacity: 0.8,
      transition: {
        duration: 1.5
      }
    }
  } as const;

  const sparkleVariants = {
    hidden: { 
      scale: 0,
      y: 0,
      opacity: 0 
    },
    visible: { 
      scale: 1,
      y: -100,
      opacity: 0,
      transition: {
        duration: 2
      }
    }
  } as const;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Feux d'artifice */}
      <AnimatePresence>
        {showFireworks && (
          <>
            {/* Feux d'artifice principaux */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={`firework-${i}`}
                className="absolute"
                style={{
                  left: `${20 + (i % 4) * 20}%`,
                  top: `${15 + Math.floor(i / 4) * 20}%`,
                }}
                variants={fireworkVariants}
                initial="hidden"
                animate="visible"
              >
                <div className={`w-8 h-8 rounded-full ${
                  i % 3 === 0 ? 'bg-yellow-400' : 
                  i % 3 === 1 ? 'bg-red-400' : 'bg-blue-400'
                } opacity-70`} />
              </motion.div>
            ))}
            
            {/* Étincelles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className="absolute"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                variants={sparkleVariants}
                initial="hidden"
                animate="visible"
              >
                <Sparkles className={`w-4 h-4 ${
                  i % 4 === 0 ? 'text-yellow-400' : 
                  i % 4 === 1 ? 'text-red-400' : 
                  i % 4 === 2 ? 'text-blue-400' : 'text-green-400'
                }`} />
              </motion.div>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Contenu principal */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10"
      >
        <Card className="w-full max-w-lg shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4"
            >
              <div className="relative">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
                <motion.div
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -top-2 -right-2"
                >
                  <Trophy className="h-8 w-8 text-yellow-500" />
                </motion.div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                🎉 Félicitations !
              </CardTitle>
              <h2 className="text-xl text-gray-700 mb-4">
                Bienvenue, {name} !
              </h2>
            </motion.div>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  ✅ Votre compte a été créé avec succès !
                </h3>
                <p className="text-green-700 text-sm">
                  Vous pouvez maintenant vous connecter avec vos identifiants
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2 flex items-center justify-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Premier badge débloqué !
                </h4>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Trophy className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-blue-700 font-medium">Badge "Bienvenue"</span>
                </div>
                <p className="text-blue-600 text-xs mt-1">
                  Votre première récompense sur ABC Bédarieux !
                </p>
              </div>

              {email && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                  <strong>Email :</strong> {email}
                </div>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.2 }}
              className="pt-4"
            >
              <Button
                onClick={handleContinue}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-semibold py-3"
              >
                Se connecter maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
              className="text-xs text-gray-500 mt-4"
            >
              Vous allez être redirigé vers la page de connexion
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}