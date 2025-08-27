"use client";

import { Eye, EyeOff, Globe, Mail, Phone, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ContactButtonsProps {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
}

export function ContactButtons({ phone, email, website }: ContactButtonsProps) {
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  const maskText = (text: string, visibleChars: number = 3) => {
    if (text.length <= visibleChars) return text;
    const visible = text.slice(0, visibleChars);
    const masked = "•".repeat(Math.min(text.length - visibleChars, 8));
    return visible + masked;
  };

  return (
    <div className="space-y-4">
      {phone && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Téléphone</p>
          <div className="flex items-center gap-2">
            <Button
              asChild={showPhone}
              variant="outline"
              className="flex-1 justify-start min-w-0"
              disabled={!showPhone}
            >
              {showPhone ? (
                <a href={`tel:${phone}`} itemProp="telephone" className="flex items-center min-w-0">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{phone}</span>
                </a>
              ) : (
                <span className="flex items-center min-w-0">
                  <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{maskText(phone, 2)}</span>
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setShowPhone(!showPhone)}
              title={showPhone ? "Masquer le téléphone" : "Afficher le téléphone"}
            >
              {showPhone ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {email && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Email</p>
          <div className="flex items-center gap-2">
            <Button
              asChild={showEmail}
              variant="outline"
              className="flex-1 justify-start min-w-0"
              disabled={!showEmail}
            >
              {showEmail ? (
                <a href={`mailto:${email}`} itemProp="email" className="flex items-center min-w-0">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{email}</span>
                </a>
              ) : (
                <span className="flex items-center min-w-0">
                  <Mail className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="truncate">{maskText(email, 3)}</span>
                </span>
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => setShowEmail(!showEmail)}
              title={showEmail ? "Masquer l'email" : "Afficher l'email"}
            >
              {showEmail ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}

      {website && (
        <div>
          <p className="text-sm text-muted-foreground mb-2">Site web</p>
          <Button
            asChild
            variant="outline"
            className="w-full justify-start"
          >
            <a
              href={website}
              target="_blank"
              rel="noopener noreferrer"
              itemProp="url"
            >
              <Globe className="w-4 h-4 mr-2" />
              Visiter le site
              <ExternalLink className="w-3 h-3 ml-auto" />
            </a>
          </Button>
        </div>
      )}
    </div>
  );
}