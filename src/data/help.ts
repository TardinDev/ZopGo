export interface FAQItem {
  question: string;
  answer: string;
  category: 'transport' | 'livraison' | 'hebergement' | 'paiement' | 'compte' | 'securite';
}

export const faqData: FAQItem[] = [
  {
    question: 'Comment commander un transport ?',
    answer:
      "Depuis l'onglet Voyages, recherchez un trajet en indiquant votre ville de départ et d'arrivée. Vous verrez la liste des chauffeurs disponibles avec leurs tarifs. Sélectionnez celui qui vous convient et confirmez votre réservation.",
    category: 'transport',
  },
  {
    question: 'Comment annuler un trajet ?',
    answer:
      "Vous pouvez annuler un trajet depuis la section Messages > Notifications. L'annulation est gratuite si elle est effectuée au moins 1 heure avant le départ prévu.",
    category: 'transport',
  },
  {
    question: 'Comment commander une livraison ?',
    answer:
      "Accédez à l'onglet Livraisons, remplissez les détails de votre colis (poids, dimensions, adresses de retrait et de livraison). Un livreur disponible à proximité sera assigné à votre commande.",
    category: 'livraison',
  },
  {
    question: 'Comment suivre ma livraison ?',
    answer:
      "Une fois votre livraison acceptée par un livreur, vous recevez des notifications à chaque étape : prise en charge, en route, et livrée. Vous pouvez aussi vérifier l'état depuis l'onglet Messages.",
    category: 'livraison',
  },
  {
    question: 'Comment réserver un hébergement ?',
    answer:
      "Depuis l'onglet Hébergements, parcourez les logements disponibles par ville. Consultez les détails, photos et avis, puis réservez directement. L'hébergeur recevra une notification et confirmera votre réservation.",
    category: 'hebergement',
  },
  {
    question: 'Quels modes de paiement sont acceptés ?',
    answer:
      'ZopGo accepte les cartes bancaires (Visa, Mastercard), Airtel Money et Moov Money. Vous pouvez gérer vos méthodes de paiement depuis Profil > Réglages > Méthodes de paiement.',
    category: 'paiement',
  },
  {
    question: 'Comment modifier mes informations personnelles ?',
    answer:
      "Rendez-vous dans l'onglet Profil, puis appuyez sur \"Informations personnelles\" dans les Réglages. Vous pourrez modifier votre nom, téléphone, adresse et contact d'urgence.",
    category: 'compte',
  },
  {
    question: 'Comment changer mon mot de passe ?',
    answer:
      'Allez dans Profil > Réglages > Sécurité. Vous pourrez changer votre mot de passe en entrant votre ancien mot de passe puis le nouveau.',
    category: 'securite',
  },
  {
    question: 'Comment supprimer mon compte ?',
    answer:
      "Dans Profil > Réglages > Sécurité, faites défiler jusqu'en bas pour trouver l'option \"Supprimer mon compte\". Cette action est irréversible et supprimera toutes vos données.",
    category: 'securite',
  },
  {
    question: "Comment devenir chauffeur ou hébergeur sur ZopGo ?",
    answer:
      "Lors de votre inscription, choisissez le rôle \"Chauffeur\" ou \"Hébergeur\". Vous aurez accès à un tableau de bord dédié pour gérer vos trajets ou logements. Vous pouvez aussi nous contacter pour changer de rôle.",
    category: 'compte',
  },
];

export const contactInfo = {
  email: 'support@zopgo.com',
  phone: '+241 77 00 00 00',
  whatsapp: '+241 77 00 00 00',
};
