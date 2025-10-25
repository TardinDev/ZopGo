import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LivraisonsTab() {
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [expandedLivreur, setExpandedLivreur] = useState<number | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [selectedLivreur, setSelectedLivreur] = useState<number | null>(null);
  const [waitingForAcceptance, setWaitingForAcceptance] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [noResponse, setNoResponse] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const livreurs = [
    {
      id: 1,
      prenom: 'Mamadou',
      vehicule: '🚲 Vélo',
      etoiles: 4.5,
      disponible: true,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
      commentaires: ['Rapide et sympa', 'Très pro'],
      distance: 1.2,
    },
    {
      id: 2,
      prenom: 'Fatou',
      vehicule: '🏍️ Moto',
      etoiles: 4.8,
      disponible: false,
      photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop',
      commentaires: ['Service impeccable', "Toujours à l'heure"],
      distance: 2.0,
    },
    {
      id: 3,
      prenom: 'Kofi',
      vehicule: '🚐 Mini-bus',
      etoiles: 4.2,
      disponible: true,
      photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      commentaires: ['Super professionnel', 'Très ponctuel'],
      distance: 1.8,
    },
    {
      id: 4,
      prenom: 'Amina',
      vehicule: '🚗 Voiture',
      etoiles: 4.7,
      disponible: true,
      photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop',
      commentaires: ['Rapide', 'Souriante'],
      distance: 1.5,
    },
    {
      id: 5,
      prenom: 'Ibrahim',
      vehicule: '🚛 Camionnette',
      etoiles: 4.3,
      disponible: false,
      photo: 'https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=150&h=150&fit=crop',
      commentaires: ['Top!', 'Consciencieux'],
      distance: 2.5,
    },
  ].sort((a, b) => a.distance - b.distance);

  const handleSearch = () => {
    if (pickupLocation && dropoffLocation) {
      setShowResults(true);
    }
  };

  const handleConfirmLivraison = () => {
    setWaitingForAcceptance(true);
    setNoResponse(false);

    // Timeout de 5 minutes (300000 ms) pour la non-réponse
    const timeout = setTimeout(() => {
      setWaitingForAcceptance(false);
      setNoResponse(true);
    }, 300000); // 5 minutes

    setTimeoutId(timeout);

    // Simuler l'acceptation du livreur après 4 secondes (pour démo)
    // En production, cette partie sera gérée par votre backend
    setTimeout(() => {
      // Annuler le timeout si le livreur accepte
      if (timeout) {
        clearTimeout(timeout);
      }
      setWaitingForAcceptance(false);
      setAccepted(true);
    }, 4000); // 4 secondes
  };

  const handleRetrySearch = () => {
    setNoResponse(false);
    setSelectedLivreur(null);
    setShowResults(true); // Retour à la liste des livreurs
  };

  // Nettoyer le timeout quand le composant est démonté
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1">
      <LinearGradient colors={['#F59E0B', '#FBBF24']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="px-6 pt-4 pb-6">
            <Text className="text-4xl font-extrabold text-white">📦 Livraison</Text>
            <Text className="text-white/80 mt-1">Trouvez votre livreur en quelques clics</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}>

            {/* Écran de non-réponse du livreur */}
            {noResponse ? (
              <View className="px-6">
                <View className="bg-white rounded-3xl p-8 shadow-xl items-center">
                  <View className="mb-6 h-20 w-20 rounded-full bg-red-100 items-center justify-center">
                    <Ionicons name="time-outline" size={60} color="#EF4444" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
                    Livreur non disponible
                  </Text>
                  <Text className="text-gray-600 text-center mb-6">
                    {livreurs.find(l => l.id === selectedLivreur)?.prenom} n'a pas répondu à votre demande dans les temps impartis.
                  </Text>

                  {/* Info du livreur qui n'a pas répondu */}
                  {selectedLivreur && (
                    <View className="w-full bg-red-50 rounded-2xl p-4 mb-6 border-2 border-red-200">
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: livreurs.find(l => l.id === selectedLivreur)?.photo }}
                          className="h-14 w-14 rounded-full opacity-50"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="font-bold text-gray-800">
                            {livreurs.find(l => l.id === selectedLivreur)?.prenom}
                          </Text>
                          <Text className="text-red-600 text-sm font-semibold">
                            ⚠️ Aucune réponse
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Message d'encouragement */}
                  <View className="w-full bg-blue-50 rounded-2xl p-4 mb-6">
                    <View className="flex-row items-start">
                      <Ionicons name="information-circle" size={20} color="#2162FE" />
                      <Text className="ml-2 text-sm text-gray-700 flex-1">
                        Ne vous inquiétez pas ! Il y a d'autres livreurs disponibles pour vous aider.
                      </Text>
                    </View>
                  </View>

                  {/* Boutons d'action */}
                  <View className="w-full gap-3">
                    <TouchableOpacity
                      onPress={handleRetrySearch}
                      className="overflow-hidden rounded-2xl shadow-lg"
                      activeOpacity={0.9}>
                      <LinearGradient
                        colors={['#2162FE', '#1E40AF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ paddingVertical: 18, paddingHorizontal: 24 }}>
                        <View className="flex-row items-center justify-center">
                          <Ionicons name="search" size={22} color="white" />
                          <Text className="text-lg font-bold text-white ml-2">
                            Choisir un autre livreur
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setNoResponse(false);
                        setShowResults(false);
                        setSelectedLivreur(null);
                        setPickupLocation('');
                        setDropoffLocation('');
                      }}
                      className="bg-gray-100 rounded-2xl py-4"
                      activeOpacity={0.8}>
                      <Text className="text-center text-gray-700 font-semibold">
                        Annuler la livraison
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : waitingForAcceptance ? (
              /* Écran d'attente de l'acceptation */
              <View className="px-6">
                <View className="bg-white rounded-3xl p-8 shadow-xl items-center">
                  <View className="mb-6">
                    <ActivityIndicator size="large" color="#2162FE" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
                    En attente de confirmation
                  </Text>
                  <Text className="text-gray-600 text-center mb-6">
                    Nous attendons que {livreurs.find(l => l.id === selectedLivreur)?.prenom} accepte votre demande...
                  </Text>

                  {/* Info du livreur */}
                  {selectedLivreur && (
                    <View className="w-full bg-blue-50 rounded-2xl p-4 mb-4">
                      <View className="flex-row items-center">
                        <Image
                          source={{ uri: livreurs.find(l => l.id === selectedLivreur)?.photo }}
                          className="h-14 w-14 rounded-full border-2 border-blue-200"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="font-bold text-gray-800">
                            {livreurs.find(l => l.id === selectedLivreur)?.prenom}
                          </Text>
                          <Text className="text-gray-600 text-sm">
                            {livreurs.find(l => l.id === selectedLivreur)?.vehicule}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Info trajet */}
                  <View className="w-full bg-gray-50 rounded-2xl p-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="location" size={16} color="#2162FE" />
                      <Text className="ml-2 text-sm text-gray-600">{pickupLocation}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="flag" size={16} color="#10B981" />
                      <Text className="ml-2 text-sm text-gray-600">{dropoffLocation}</Text>
                    </View>
                  </View>

                  <Text className="text-xs text-gray-400 mt-6 text-center">
                    Cela peut prendre quelques instants...
                  </Text>
                </View>
              </View>
            ) : accepted ? (
              /* Écran de confirmation d'acceptation */
              <View className="px-6">
                <View className="bg-white rounded-3xl p-8 shadow-xl items-center">
                  <View className="mb-6 h-20 w-20 rounded-full bg-green-100 items-center justify-center">
                    <Ionicons name="checkmark-circle" size={60} color="#10B981" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 text-center mb-3">
                    Demande acceptée ! 🎉
                  </Text>
                  <Text className="text-gray-600 text-center mb-6">
                    {livreurs.find(l => l.id === selectedLivreur)?.prenom} a accepté votre demande de livraison
                  </Text>

                  {/* Carte du livreur */}
                  {selectedLivreur && (
                    <View className="w-full bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-5 mb-6">
                      <View className="flex-row items-center mb-4">
                        <Image
                          source={{ uri: livreurs.find(l => l.id === selectedLivreur)?.photo }}
                          className="h-16 w-16 rounded-full border-2 border-green-400"
                        />
                        <View className="ml-3 flex-1">
                          <Text className="text-xl font-bold text-gray-800">
                            {livreurs.find(l => l.id === selectedLivreur)?.prenom}
                          </Text>
                          <Text className="text-gray-600">
                            {livreurs.find(l => l.id === selectedLivreur)?.vehicule}
                          </Text>
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="star" size={14} color="#F59E0B" />
                            <Text className="ml-1 text-sm font-bold text-gray-700">
                              {livreurs.find(l => l.id === selectedLivreur)?.etoiles}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="border-t border-gray-200 pt-3">
                        <View className="flex-row items-center mb-2">
                          <Ionicons name="location" size={16} color="#2162FE" />
                          <Text className="ml-2 text-sm text-gray-700 flex-1">{pickupLocation}</Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="flag" size={16} color="#10B981" />
                          <Text className="ml-2 text-sm text-gray-700 flex-1">{dropoffLocation}</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Prochaines étapes */}
                  <View className="w-full bg-blue-50 rounded-2xl p-4 mb-4">
                    <Text className="font-bold text-gray-800 mb-2">Prochaines étapes :</Text>
                    <View className="flex-row items-start mb-2">
                      <Text className="text-blue-600 mr-2">1.</Text>
                      <Text className="text-gray-600 flex-1">Le livreur se dirige vers le point de récupération</Text>
                    </View>
                    <View className="flex-row items-start mb-2">
                      <Text className="text-blue-600 mr-2">2.</Text>
                      <Text className="text-gray-600 flex-1">Récupération de votre colis</Text>
                    </View>
                    <View className="flex-row items-start">
                      <Text className="text-blue-600 mr-2">3.</Text>
                      <Text className="text-gray-600 flex-1">Livraison à destination</Text>
                    </View>
                  </View>

                  {/* Boutons d'action */}
                  <View className="w-full gap-3">
                    <TouchableOpacity
                      className="overflow-hidden rounded-2xl shadow-lg"
                      activeOpacity={0.9}>
                      <LinearGradient
                        colors={['#2162FE', '#1E40AF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ paddingVertical: 16, paddingHorizontal: 24 }}>
                        <View className="flex-row items-center justify-center">
                          <Ionicons name="call" size={20} color="white" />
                          <Text className="text-base font-bold text-white ml-2">
                            Appeler le livreur
                          </Text>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        setAccepted(false);
                        setShowResults(false);
                        setSelectedLivreur(null);
                        setPickupLocation('');
                        setDropoffLocation('');
                      }}
                      className="bg-gray-100 rounded-2xl py-4"
                      activeOpacity={0.8}>
                      <Text className="text-center text-gray-700 font-semibold">
                        Nouvelle livraison
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : !showResults ? (
              /* Formulaire Principal */
              <View className="px-6">
                {/* Card principale */}
                <View className="bg-white rounded-3xl p-6 shadow-xl mb-6">
                  <Text className="text-2xl font-bold text-gray-800 mb-6">
                    Où souhaitez-vous envoyer votre colis ?
                  </Text>

                  {/* Lieu de récupération */}
                  <View className="mb-5">
                    <View className="flex-row items-center mb-2">
                      <View className="h-10 w-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <Ionicons name="cube-outline" size={20} color="#2162FE" />
                      </View>
                      <Text className="text-sm font-semibold text-gray-600">Point de récupération</Text>
                    </View>
                    <View className="flex-row items-center rounded-2xl bg-gray-50 px-4 py-4 border-2 border-gray-200">
                      <Ionicons name="location" size={24} color="#2162FE" />
                      <TextInput
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholder="Ex: Libreville, Glass"
                        placeholderTextColor="#9CA3AF"
                        value={pickupLocation}
                        onChangeText={setPickupLocation}
                      />
                    </View>
                  </View>

                  {/* Bouton swap */}
                  <View className="items-center -my-3 z-10">
                    <View className="bg-white rounded-full p-2 shadow-md border-2 border-orange-200">
                      <Ionicons name="swap-vertical" size={24} color="#F59E0B" />
                    </View>
                  </View>

                  {/* Lieu de livraison */}
                  <View className="mt-5">
                    <View className="flex-row items-center mb-2">
                      <View className="h-10 w-10 rounded-full bg-green-100 items-center justify-center mr-3">
                        <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
                      </View>
                      <Text className="text-sm font-semibold text-gray-600">Point de livraison</Text>
                    </View>
                    <View className="flex-row items-center rounded-2xl bg-gray-50 px-4 py-4 border-2 border-gray-200">
                      <Ionicons name="flag" size={24} color="#10B981" />
                      <TextInput
                        className="flex-1 ml-3 text-gray-800 text-base"
                        placeholder="Ex: Port-Gentil, Centre-ville"
                        placeholderTextColor="#9CA3AF"
                        value={dropoffLocation}
                        onChangeText={setDropoffLocation}
                      />
                    </View>
                  </View>

                  {/* Informations supplémentaires */}
                  <View className="mt-6 bg-blue-50 rounded-2xl p-4">
                    <View className="flex-row items-center">
                      <Ionicons name="information-circle" size={20} color="#2162FE" />
                      <Text className="ml-2 text-sm text-gray-600 flex-1">
                        Les livreurs les plus proches seront affichés en premier
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Bouton de recherche principal */}
                <TouchableOpacity
                  onPress={handleSearch}
                  disabled={!pickupLocation || !dropoffLocation}
                  className={`overflow-hidden rounded-3xl shadow-xl ${(!pickupLocation || !dropoffLocation) ? 'opacity-50' : ''}`}
                  activeOpacity={0.9}>
                  <LinearGradient
                    colors={['#2162FE', '#1E40AF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ paddingVertical: 20, paddingHorizontal: 24 }}>
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="search" size={24} color="white" />
                      <Text className="text-xl font-bold text-white ml-3">
                        Rechercher un livreur
                      </Text>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              /* Résultats de recherche */
              <View className="px-6">
                {/* En-tête des résultats */}
                <View className="bg-white rounded-3xl p-4 mb-4 shadow-md">
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <Text className="text-sm text-gray-500">Trajet</Text>
                      <Text className="text-base font-bold text-gray-800">
                        {pickupLocation} → {dropoffLocation}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowResults(false)}
                      className="bg-gray-100 rounded-full p-2">
                      <Ionicons name="pencil" size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text className="text-white text-lg font-bold mb-4">
                  {livreurs.filter(l => l.disponible).length} livreurs disponibles
                </Text>

                {/* Liste des livreurs */}
                {livreurs.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    className={`mb-4 rounded-3xl bg-white p-5 shadow-lg ${selectedLivreur === item.id ? 'border-4 border-blue-500' : ''}`}
                    onPress={() => setSelectedLivreur(item.id)}
                    activeOpacity={0.9}>
                    <View className="flex-row items-center gap-4">
                      <Image source={{ uri: item.photo }} className="h-16 w-16 rounded-full border-2 border-gray-200" />
                      <View className="flex-1">
                        <View className="flex-row items-center justify-between mb-1">
                          <Text className="text-xl font-bold text-gray-800">{item.prenom}</Text>
                          <View className={`px-3 py-1 rounded-full ${item.disponible ? 'bg-green-100' : 'bg-red-100'}`}>
                            <Text className={`text-xs font-bold ${item.disponible ? 'text-green-700' : 'text-red-700'}`}>
                              {item.disponible ? 'Disponible' : 'Occupé'}
                            </Text>
                          </View>
                        </View>
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-600">{item.vehicule}</Text>
                          <View className="flex-row items-center">
                            <Ionicons name="star" size={16} color="#F59E0B" />
                            <Text className="ml-1 font-bold text-gray-700">{item.etoiles}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center mt-2">
                          <Ionicons name="location-outline" size={14} color="#6B7280" />
                          <Text className="ml-1 text-xs text-gray-500">{item.distance} km</Text>
                        </View>
                      </View>
                    </View>

                    {selectedLivreur === item.id && (
                      <View className="mt-4 pt-4 border-t border-gray-200">
                        <Text className="font-bold text-gray-700 mb-2">Avis clients :</Text>
                        {item.commentaires.map((com, idx) => (
                          <View key={idx} className="flex-row items-start mb-1">
                            <Ionicons name="chatbox-ellipses" size={14} color="#9CA3AF" />
                            <Text className="ml-2 text-sm text-gray-600 flex-1 italic">
                              "{com}"
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}

                {/* Bouton de confirmation */}
                {selectedLivreur && (
                  <TouchableOpacity
                    onPress={handleConfirmLivraison}
                    className="overflow-hidden rounded-3xl shadow-xl mt-4"
                    activeOpacity={0.9}>
                    <LinearGradient
                      colors={['#10B981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{ paddingVertical: 20, paddingHorizontal: 24 }}>
                      <View className="flex-row items-center justify-center">
                        <Ionicons name="checkmark-circle" size={24} color="white" />
                        <Text className="text-xl font-bold text-white ml-3">
                          Confirmer la livraison
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}
