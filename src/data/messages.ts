// Données pour les messages et notifications

export interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    time: string;
    read: boolean;
    icon: string;
    iconColor: string;
    iconBg: string;
}

export interface Message {
    id: string;
    sender: string;
    avatar: string;
    content: string;
    date: string;
    time: string;
    read: boolean;
}

export const notificationsData: Notification[] = [
    {
        id: '1',
        type: 'livraison',
        title: 'Livraison acceptée',
        message: 'Mamadou a accepté votre demande de livraison vers Glass',
        time: 'Il y a 5 min',
        read: false,
        icon: 'checkmark-circle',
        iconColor: '#10B981',
        iconBg: '#D1FAE5',
    },
    {
        id: '2',
        type: 'voyage',
        title: 'Nouveau client',
        message: 'Un client souhaite réserver un voyage vers Port-Gentil',
        time: 'Il y a 1h',
        read: false,
        icon: 'car',
        iconColor: '#2162FE',
        iconBg: '#DBEAFE',
    },
    {
        id: '3',
        type: 'paiement',
        title: 'Paiement reçu',
        message: 'Vous avez reçu 15,000 FCFA pour la course vers Ntoum',
        time: 'Il y a 2h',
        read: true,
        icon: 'cash',
        iconColor: '#F59E0B',
        iconBg: '#FEF3C7',
    },
    {
        id: '4',
        type: 'info',
        title: 'Mise à jour disponible',
        message: 'Une nouvelle version de ZopGo est disponible',
        time: 'Hier',
        read: true,
        icon: 'information-circle',
        iconColor: '#6366F1',
        iconBg: '#E0E7FF',
    },
    {
        id: '5',
        type: 'avis',
        title: 'Nouvel avis client',
        message: 'Marie Nguema a laissé un avis 5 étoiles ⭐',
        time: 'Il y a 2 jours',
        read: true,
        icon: 'star',
        iconColor: '#F59E0B',
        iconBg: '#FEF3C7',
    },
];

export const messagesData: Message[] = [
    {
        id: '1',
        sender: 'Brice Mbongo',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
        content: 'Salut, la livraison à PK5 est bien arrivée. Merci beaucoup !',
        date: "Aujourd'hui",
        time: '14:32',
        read: true,
    },
    {
        id: '2',
        sender: 'Marie Nguema',
        avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop',
        content: 'Bonsoir, tu es disponible pour un trajet vers Ntoum demain ?',
        date: 'Hier',
        time: '18:15',
        read: false,
    },
    {
        id: '3',
        sender: 'Kevin Oba',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
        content: "Tu peux m'envoyer les infos du colis pour Owendo stp ?",
        date: 'Il y a 3 jours',
        time: '10:20',
        read: true,
    },
    {
        id: '4',
        sender: 'Aïcha Minko',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
        content: 'Merci pour le voyage à Port-Gentil ! Service impeccable 👍',
        date: 'Il y a 1 semaine',
        time: '16:45',
        read: false,
    },
];
