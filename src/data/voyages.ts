import { Voyage, Hebergement } from '../types';

// Liste des voyages disponibles
export const voyages: Voyage[] = [
  { id: 1, type: 'Bus', from: 'Libreville', to: 'Franceville', price: '25000 FCFA', icon: '🚍' },
  { id: 2, type: 'Voiture', from: 'PK12', to: 'Ntoum', price: '2500 FCFA', icon: '🚗' },
  { id: 3, type: 'Bus', from: 'Port-Gentil', to: 'Lambaréné', price: '15000 FCFA', icon: '🚍' },
  { id: 4, type: 'Avion', from: 'Libreville', to: 'Port-Gentil', price: '75000 FCFA', icon: '✈️' },
  { id: 5, type: 'Voiture', from: 'Libreville', to: 'Oyem', price: '18000 FCFA', icon: '🚗' },
  { id: 6, type: 'Bus', from: 'Mouanda', to: 'Franceville', price: '8000 FCFA', icon: '🚍' },
  { id: 7, type: 'Voiture', from: 'Tchibanga', to: 'Mayumba', price: '12000 FCFA', icon: '🚗' },
  { id: 8, type: 'Bateau', from: 'Port-Gentil', to: 'Cap Lopez', price: '5000 FCFA', icon: '🚢' },
  { id: 9, type: 'Bus', from: 'Bitam', to: 'Oyem', price: '6000 FCFA', icon: '🚍' },
  { id: 10, type: 'Voiture', from: 'Gamba', to: 'Tchibanga', price: '10000 FCFA', icon: '🚗' },
  { id: 11, type: 'Train', from: 'Libreville', to: 'Franceville', price: '30000 FCFA', icon: '🚂' },
  { id: 12, type: 'Train', from: 'Libreville', to: 'Ndjolé', price: '12000 FCFA', icon: '🚂' },
  { id: 13, type: 'Train', from: 'Owendo', to: 'Booué', price: '18000 FCFA', icon: '🚂' },
  { id: 14, type: 'Train', from: 'Ntoum', to: 'Lopé', price: '22000 FCFA', icon: '🚂' },
];

// Liste des hébergements disponibles
export const hebergements: Hebergement[] = [
  {
    id: 1,
    type: 'Hôtel',
    name: 'Hôtel Le Meridien',
    location: 'Libreville',
    price: '45000 FCFA/nuit',
    rating: 4.5,
    icon: '🏨',
  },
  {
    id: 2,
    type: 'Auberge',
    name: 'Auberge du Centre',
    location: 'Franceville',
    price: '15000 FCFA/nuit',
    rating: 3.8,
    icon: '🏠',
  },
  {
    id: 3,
    type: 'Hôtel',
    name: 'Hôtel Hibiscus',
    location: 'Port-Gentil',
    price: '38000 FCFA/nuit',
    rating: 4.2,
    icon: '🏨',
  },
  {
    id: 4,
    type: 'Auberge',
    name: 'Chez Marie',
    location: 'Oyem',
    price: '12000 FCFA/nuit',
    rating: 4.0,
    icon: '🏠',
  },
  {
    id: 5,
    type: 'Hôtel',
    name: 'Hôtel Rapontchombo',
    location: 'Lambaréné',
    price: '25000 FCFA/nuit',
    rating: 3.9,
    icon: '🏨',
  },
  {
    id: 6,
    type: 'Auberge',
    name: 'Villa Tropicale',
    location: 'Mayumba',
    price: '18000 FCFA/nuit',
    rating: 4.3,
    icon: '🏠',
  },
  {
    id: 7,
    type: 'Hôtel',
    name: 'Hôtel Residence',
    location: 'Tchibanga',
    price: '20000 FCFA/nuit',
    rating: 3.7,
    icon: '🏨',
  },
  {
    id: 8,
    type: 'Auberge',
    name: 'Auberge du Parc',
    location: 'Lopé',
    price: '22000 FCFA/nuit',
    rating: 4.4,
    icon: '🏠',
  },
];

// Types de transport disponibles
export const transportTypes = ['All', 'Bus', 'Voiture', 'Bateau', 'Avion', 'Train'];

// Types d'hébergement disponibles
export const hebergementTypes = ['All', 'Hôtel', 'Auberge'];
