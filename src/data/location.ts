export interface Vehicle {
    id: string;
    name: string;
    type: 'voiture' | 'utilitaire' | 'moto';
    price: string;
    period: string; // 'jour' | 'heure'
    image: string;
    rating: number;
    location: string;
    features: string[];
    isAvailable: boolean;
    owner: {
        name: string;
        avatar: string;
    };
}

export const vehicles: Vehicle[] = [
    {
        id: '1',
        name: 'Toyota Yaris 2022',
        type: 'voiture',
        price: '25,000',
        period: 'jour',
        image: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?w=500&q=80',
        rating: 4.8,
        location: 'Libreville, Centre',
        features: ['Auto', 'Clim', '5 places'],
        isAvailable: true,
        owner: {
            name: 'Jean-Pierre',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80'
        }
    },
    {
        id: '2',
        name: 'Scooter Yamaha NMAX',
        type: 'moto',
        price: '10,000',
        period: 'jour',
        image: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&q=80',
        rating: 4.9,
        location: 'Owendo',
        features: ['Casque inclus', 'Top case'],
        isAvailable: true,
        owner: {
            name: 'Marc',
            avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80'
        }
    },
    {
        id: '3',
        name: 'Mitsubishi L200',
        type: 'utilitaire',
        price: '45,000',
        period: 'jour',
        image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=500&q=80',
        rating: 4.7,
        location: 'Zone Industrielle',
        features: ['4x4', 'Diesel', 'Grande benne'],
        isAvailable: true,
        owner: {
            name: 'Société LocaGabon',
            avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&q=80'
        }
    },
    {
        id: '4',
        name: 'Hyundai Tucson',
        type: 'voiture',
        price: '40,000',
        period: 'jour',
        image: 'https://images.unsplash.com/photo-1580273916550-e323be2ebcc5?w=500&q=80',
        rating: 4.9,
        location: 'Aéroport',
        features: ['SUV', 'Luxe', 'GPS'],
        isAvailable: false,
        owner: {
            name: 'Sarah',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80'
        }
    },
];
