import { Stat, Activity } from '../types';

// Statistiques de la page d'accueil
export const stats: Stat[] = [
  {
    id: 1,
    title: 'Gains',
    value: '25,000',
    subtitle: "FCFA aujourd'hui",
    icon: 'cash-outline',
    color: 'green',
  },
  {
    id: 2,
    title: 'Courses',
    value: '12',
    subtitle: 'Courses du jour',
    icon: 'car-outline',
    color: 'blue',
  },
  {
    id: 3,
    title: 'Note',
    value: '4.8',
    subtitle: 'Note moyenne',
    icon: 'star-outline',
    color: 'yellow',
  },
];

// Activités récentes (générées dynamiquement)
export const generateActivities = (count: number = 10): Activity[] => {
  const activities: Activity[] = [];

  for (let i = 0; i < count; i++) {
    const isCourse = i % 2 === 0;
    activities.push({
      id: i + 1,
      type: isCourse ? 'course' : 'delivery',
      title: isCourse ? 'Course vers Akanda' : 'Livraison Glass',
      time: isCourse ? "Aujourd'hui à 13:30" : 'Hier à 18:45',
      price: isCourse ? '5,000' : '3,500',
      status: i % 3 === 0 ? 'completed' : 'in_progress',
      icon: isCourse ? '🚕' : '📦',
    });
  }

  return activities;
};

// Informations météo
export const weatherInfo = {
  temperature: '32°C',
  location: 'Libreville, Gabon',
  condition: 'Ensoleillé',
  icon: '☀️',
};
