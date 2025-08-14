/**
 * Utilitaires pour le calcul des horaires d'ouverture
 */

interface OpeningHour {
  dayOfWeek: string;
  isClosed: boolean;
  openTime?: string | null;
  closeTime?: string | null;
}

interface OpeningStatus {
  isOpen: boolean;
  isPause: boolean;
  nextChange?: {
    type: 'open' | 'close';
    time: string;
    day?: string;
  };
  todaySlots: Array<{ openTime: string; closeTime: string }>;
}

const DAY_NAMES = {
  SUNDAY: 'Dimanche',
  MONDAY: 'Lundi', 
  TUESDAY: 'Mardi',
  WEDNESDAY: 'Mercredi',
  THURSDAY: 'Jeudi',
  FRIDAY: 'Vendredi',
  SATURDAY: 'Samedi'
};

const DAY_ORDER = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

/**
 * Convertit une heure "HH:MM" en minutes depuis minuit
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Formate une heure pour l'affichage
 */
function formatTime(time: string): string {
  const [h, m] = time.split(':');
  return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`;
}

/**
 * Groupe les horaires par jour et gère les créneaux multiples
 */
function groupOpeningHours(hours: OpeningHour[]) {
  const grouped: Record<string, Array<{ openTime: string; closeTime: string }>> = {};
  
  // Initialiser tous les jours
  DAY_ORDER.forEach(day => {
    grouped[day] = [];
  });

  // Grouper les créneaux par jour
  hours.forEach(hour => {
    if (!hour.isClosed && hour.openTime && hour.closeTime) {
      grouped[hour.dayOfWeek].push({
        openTime: hour.openTime,
        closeTime: hour.closeTime
      });
    }
  });

  // Trier les créneaux par heure d'ouverture
  Object.keys(grouped).forEach(day => {
    grouped[day].sort((a, b) => a.openTime.localeCompare(b.openTime));
  });

  return grouped;
}

/**
 * Calcule le statut d'ouverture actuel d'un établissement
 */
export function computeOpeningStatus(openingHours: OpeningHour[], currentTime?: Date): OpeningStatus {
  const now = currentTime || new Date();
  const currentDay = DAY_ORDER[now.getDay()];
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const grouped = groupOpeningHours(openingHours);
  const todaySlots = grouped[currentDay] || [];
  
  let isOpen = false;
  let isPause = false;
  let nextChange: OpeningStatus['nextChange'];

  // Vérifier si c'est actuellement ouvert
  for (const slot of todaySlots) {
    const openMinutes = timeToMinutes(slot.openTime);
    const closeMinutes = timeToMinutes(slot.closeTime);
    
    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      isOpen = true;
      nextChange = {
        type: 'close',
        time: slot.closeTime
      };
      break;
    }
  }

  if (!isOpen) {
    // Vérifier s'il y a une pause (créneau passé + créneau à venir aujourd'hui)
    const hasPastSlot = todaySlots.some(slot => timeToMinutes(slot.closeTime) <= currentMinutes);
    const nextTodaySlot = todaySlots.find(slot => currentMinutes < timeToMinutes(slot.openTime));
    
    if (hasPastSlot && nextTodaySlot) {
      isPause = true;
      nextChange = {
        type: 'open',
        time: nextTodaySlot.openTime
      };
    } else if (nextTodaySlot) {
      // Pas encore ouvert aujourd'hui
      nextChange = {
        type: 'open',
        time: nextTodaySlot.openTime
      };
    } else {
      // Chercher le prochain jour d'ouverture
      for (let i = 1; i <= 7; i++) {
        const dayIndex = (now.getDay() + i) % 7;
        const dayKey = DAY_ORDER[dayIndex];
        const slots = grouped[dayKey];
        
        if (slots.length > 0) {
          nextChange = {
            type: 'open',
            time: slots[0].openTime,
            day: DAY_NAMES[dayKey as keyof typeof DAY_NAMES]
          };
          break;
        }
      }
    }
  }

  return {
    isOpen,
    isPause,
    nextChange,
    todaySlots
  };
}

/**
 * Obtient le texte de statut à afficher
 */
export function getOpeningStatusText(status: OpeningStatus): { text: string; className: string } {
  if (status.isOpen) {
    return {
      text: 'Ouvert maintenant',
      className: 'text-emerald-700 bg-emerald-100'
    };
  }

  if (status.isPause) {
    return {
      text: 'En pause',
      className: 'text-orange-700 bg-orange-100'
    };
  }

  return {
    text: 'Fermé',
    className: 'text-rose-700 bg-rose-100'
  };
}

/**
 * Obtient le texte du prochain changement d'état
 */
export function getNextChangeText(status: OpeningStatus): string | null {
  if (!status.nextChange) return null;

  const { type, time, day } = status.nextChange;
  
  if (day) {
    return `${type === 'open' ? 'Ouvre' : 'Ferme'} ${day} à ${formatTime(time)}`;
  }
  
  return `${type === 'open' ? 'Ouvre à' : 'Ferme à'} ${formatTime(time)}`;
}

/**
 * Formate les horaires d'ouverture pour l'affichage
 */
export function formatOpeningHours(openingHours: OpeningHour[]): Array<{
  day: string;
  dayKey: string;
  slots: string;
  isToday: boolean;
}> {
  const grouped = groupOpeningHours(openingHours);
  const today = DAY_ORDER[new Date().getDay()];

  return DAY_ORDER.map(dayKey => {
    const slots = grouped[dayKey];
    const dayName = DAY_NAMES[dayKey as keyof typeof DAY_NAMES];
    
    return {
      day: dayName,
      dayKey,
      slots: slots.length === 0 
        ? 'Fermé' 
        : slots.map(slot => `${formatTime(slot.openTime)} - ${formatTime(slot.closeTime)}`).join(' • '),
      isToday: dayKey === today
    };
  });
}