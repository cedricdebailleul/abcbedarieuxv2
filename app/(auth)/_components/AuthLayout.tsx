import Image from "next/image";
import Link from "next/link";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  image?: string;
}

export function AuthLayout({
  children,
  title,
  description,
  image = "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1920&auto=format&fit=crop",
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Colonne gauche - Image */}
      <div className="relative hidden lg:block">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover object-center"
          priority
          sizes="(max-width: 1024px) 0vw, 50vw"
        />
        {/* Overlay avec dégradé */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50" />

        {/* Contenu sur l'image */}
        <div className="relative z-10 flex h-full flex-col justify-between p-8 lg:p-10 xl:p-12 text-white">
          <div>
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src="/images/logo_abc.png"
                alt="ABC Bédarieux"
                width={40}
                height={40}
                className="brightness-0 invert"
              />
              <span className="text-lg font-bold">ABC Bédarieux</span>
            </Link>
          </div>

          <div className="max-w-sm lg:max-w-md">
            <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight mb-3 lg:mb-4">
              {title}
            </h1>
            <p className="text-sm lg:text-base xl:text-lg text-white/90">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:gap-4 text-xs lg:text-sm text-white/70">
            <span>© {new Date().getFullYear()} ABC Bédarieux</span>
            <span className="hidden sm:inline">•</span>
            <Link href="/privacy2" className="hover:text-white transition-colors">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>

      {/* Colonne droite - Formulaire */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 lg:min-h-0">
        {/* Logo mobile */}
        <div className="mb-6 sm:mb-8 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/logo_abc.png"
              alt="ABC Bédarieux"
              width={36}
              height={36}
            />
            <span className="text-base sm:text-lg font-bold text-primary">ABC Bédarieux</span>
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-[420px] flex-col justify-center space-y-4 sm:space-y-6">
          {children}
        </div>

        {/* Lien retour sur mobile */}
        <div className="mt-6 text-center lg:hidden">
          <Link
            href="/"
            className="text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
