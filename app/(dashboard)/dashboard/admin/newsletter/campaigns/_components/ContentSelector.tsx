"use client";

import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  MapPin, 
  FileText, 
  ExternalLink,
  User,
  Phone,
  Globe,
  Image as ImageIcon,
  Clock,
  MapPinIcon
} from "lucide-react";
import { ContentItem } from "../_hooks/useAvailableContent";
import Image from "next/image";

interface ContentSelectorProps {
  items: ContentItem[];
  selectedIds: string[];
  onToggle: (itemId: string) => void;
  type: 'event' | 'place' | 'post';
}

export function ContentSelector({ items, selectedIds, onToggle, type }: ContentSelectorProps) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? items : items.slice(0, 6);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "event": return <Calendar className="w-4 h-4 text-blue-600" />;
      case "place": return <MapPin className="w-4 h-4 text-green-600" />;
      case "post": return <FileText className="w-4 h-4 text-purple-600" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string, isAllDay?: boolean) => {
    const date = new Date(dateString);
    if (isAllDay) {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "event": return "Événements";
      case "place": return "Commerces";
      case "post": return "Articles";
      default: return "Contenu";
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <div className="mb-2">{getTypeIcon(type)}</div>
        <p>Aucun {getTypeLabel(type).toLowerCase()} disponible</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          {getTypeIcon(type)}
          {getTypeLabel(type)} ({items.length})
        </h3>
        {selectedIds.length > 0 && (
          <Badge variant="secondary">
            {selectedIds.length} sélectionné{selectedIds.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {displayItems.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            isSelected={selectedIds.includes(item.id)}
            onToggle={() => onToggle(item.id)}
          />
        ))}
      </div>

      {items.length > 6 && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll(!showAll)}
          >
            {showAll ? 'Afficher moins' : `Afficher tout (${items.length - 6} de plus)`}
          </Button>
        </div>
      )}
    </div>
  );
}

interface ContentCardProps {
  item: ContentItem;
  isSelected: boolean;
  onToggle: () => void;
}

function ContentCard({ item, isSelected, onToggle }: ContentCardProps) {
  const formatDate = (dateString: string, isAllDay?: boolean) => {
    const date = new Date(dateString);
    if (isAllDay) {
      return date.toLocaleDateString('fr-FR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
    }
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`
      flex items-start space-x-3 p-4 border rounded-lg transition-all duration-200
      ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-200 hover:border-gray-300'}
    `}>
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        className="mt-1"
      />
      
      {/* Image de couverture */}
      <div className="flex-shrink-0 w-16 h-16 relative overflow-hidden rounded-md bg-gray-100">
        {(item.coverImage || item.logo) ? (
          <Image
            src={item.coverImage || item.logo || ''}
            alt={item.title}
            fill
            className="object-cover"
            onError={(e) => {
              // Hide image on error and show fallback
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                const fallback = parent.querySelector('.image-fallback');
                if (fallback) {
                  (fallback as HTMLElement).style.display = 'flex';
                }
              }
            }}
          />
        ) : null}
        <div 
          className="image-fallback w-full h-full flex items-center justify-center"
          style={{ display: (item.coverImage || item.logo) ? 'none' : 'flex' }}
        >
          <ImageIcon className="w-6 h-6 text-gray-400" />
        </div>
      </div>

      <div className="flex-1 min-w-0 space-y-2">
        {/* En-tête avec titre et lien */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {item.title}
            </h4>
            
            {/* Badges de catégorie */}
            <div className="flex items-center gap-2 mt-1">
              {item.category && (
                <Badge 
                  variant="outline" 
                  className="text-xs"
                  style={{ 
                    borderColor: item.category.color || '#6b7280',
                    color: item.category.color || '#6b7280'
                  }}
                >
                  {item.category.icon && <span className="mr-1">{item.category.icon}</span>}
                  {item.category.name}
                </Badge>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="flex-shrink-0 h-8 w-8 p-0"
          >
            <a 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer"
              title="Voir sur le site"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
        </div>

        {/* Description */}
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Métadonnées spécifiques par type */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {/* Événements */}
          {item.type === 'event' && (
            <>
              {item.startDate && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDate(item.startDate, item.isAllDay)}
                </span>
              )}
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  {item.location}
                </span>
              )}
            </>
          )}

          {/* Places */}
          {item.type === 'place' && (
            <>
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPinIcon className="w-3 h-3" />
                  {item.location}
                </span>
              )}
              {item.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {item.phone}
                </span>
              )}
              {item.website && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  Site web
                </span>
              )}
            </>
          )}

          {/* Articles */}
          {item.type === 'post' && (
            <>
              {item.publishedAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(item.publishedAt).toLocaleDateString('fr-FR')}
                </span>
              )}
              {item.author && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {item.author}
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility class for line clamping
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}