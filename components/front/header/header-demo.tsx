"use client";

import EnhancedHeader from "./enhanced-header";

/**
 * Composant de démonstration pour le nouveau header
 * 
 * Ce composant montre comment utiliser le nouveau header amélioré
 * avec toutes ses fonctionnalités d'accessibilité et de responsive design.
 */
export default function HeaderDemo() {
  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedHeader />
      
      {/* Contenu principal pour tester le header */}
      <main id="main-content" className="pt-20 px-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <section className="bg-white rounded-lg p-8 shadow-sm">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Nouveau Header avec Mega Menu
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              Ce nouveau header présente une architecture unifiée avec un mega menu 
              responsive et accessible, optimisé pour une excellente expérience utilisateur 
              sur tous les appareils.
            </p>
          </section>

          <section className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🚀 Fonctionnalités principales
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-primary mb-2">
                  💻 Desktop
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Mega menu unifié avec navigation par onglets</li>
                  <li>• Hover et focus states optimisés</li>
                  <li>• Animation fluide et performante</li>
                  <li>• Liens rapides dans la barre principale</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-green-600 mb-2">
                  📱 Mobile
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Menu sidebar avec sections collapsibles</li>
                  <li>• Navigation par catégories</li>
                  <li>• Actions utilisateur intégrées</li>
                  <li>• Liens rapides en bas de menu</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              ♿ Accessibilité
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-orange-600 mb-2">
                  ⌨️ Navigation clavier
                </h3>
                <ul className="space-y-2 text-gray-600 text-sm">
                  <li><kbd className="bg-gray-100 px-2 py-1 rounded">Tab</kbd> - Navigation séquentielle</li>
                  <li><kbd className="bg-gray-100 px-2 py-1 rounded">↑↓</kbd> - Navigation verticale</li>
                  <li><kbd className="bg-gray-100 px-2 py-1 rounded">Enter/Space</kbd> - Activation</li>
                  <li><kbd className="bg-gray-100 px-2 py-1 rounded">Escape</kbd> - Fermeture</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-purple-600 mb-2">
                  🗣️ Screen readers
                </h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Annonces vocales des changements</li>
                  <li>• ARIA attributes complets</li>
                  <li>• Landmarks et roles sémantiques</li>
                  <li>• Skip navigation link</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🎨 Design System
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Couleurs par section</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-primary rounded"></div>
                    <span className="text-sm">Découvrir (Primary)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-600 rounded"></div>
                    <span className="text-sm">Établissements (Blue)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-600 rounded"></div>
                    <span className="text-sm">Événements (Green)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-orange-600 rounded"></div>
                    <span className="text-sm">Contenu (Orange)</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">États interactifs</h3>
                <p className="text-gray-600 text-sm">
                  Focus visible avec outline personnalisé, hover states subtils avec 
                  transitions fluides, et feedback visuel clair pour tous les éléments 
                  interactifs.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🧪 Instructions de test
            </h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <h3 className="font-medium mb-2">1. Navigation clavier</h3>
                <p className="text-sm">
                  Utilisez Tab pour naviguer dans le menu, puis les flèches pour explorer 
                  les sections. Testez Escape pour fermer les menus.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">2. Responsive</h3>
                <p className="text-sm">
                  Redimensionnez la fenêtre pour voir les différents breakpoints. 
                  Le menu mobile s&apos;active en dessous de lg (1024px).
                </p>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">3. Accessibilité</h3>
                <p className="text-sm">
                  Testez avec un screen reader pour vérifier les annonces vocales. 
                  Utilisez le skip link (Tab depuis le début de page) pour accéder 
                  directement au contenu.
                </p>
              </div>
            </div>
          </section>

          {/* Contenu factice pour le scroll */}
          <div className="space-y-4">
            {Array.from({ length: 10 }, (_, i) => (
              <section key={i} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Section de contenu #{i + 1}
                </h3>
                <p className="text-gray-600">
                  Contenu factice pour tester le comportement du header au scroll. 
                  Le header devient fixe et s&apos;adapte automatiquement.
                </p>
              </section>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}