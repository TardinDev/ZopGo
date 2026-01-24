import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { userInfo, menuItems } from '../../../data';
import { AnimatedTabScreen } from '../../../components/ui';
import { RatingSummary, ReviewCard } from '../../../components/ratings';
import { useRatingsStore } from '../../../stores/ratingsStore';
import { useAuthStore, isChauffeur } from '../../../stores/authStore';
import { COLORS } from '../../../constants';
import { ChauffeurProfile } from '../../../types';

type MainTabType = 'reviews' | 'settings';
type ReviewTabType = 'received' | 'given';

export default function ProfilTab() {
  const router = useRouter();
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('reviews');
  const [activeReviewTab, setActiveReviewTab] = useState<ReviewTabType>('received');
  const { receivedReviews, givenReviews, ratingSummary } = useRatingsStore();
  const { user, setDisponible } = useAuthStore();

  // Utilise les données du store auth si disponibles, sinon fallback sur userInfo
  const profile = user?.profile || userInfo;
  const isUserChauffeur = isChauffeur(user);
  const chauffeurProfile = isUserChauffeur ? (user.profile as ChauffeurProfile) : null;

  // Pour les chauffeurs, on affiche uniquement les avis reçus
  const reviews = activeReviewTab === 'received' ? receivedReviews : givenReviews;

  const handleMenuPress = (index: number) => {
    switch (index) {
      case 0:
        router.push('/(protected)/(tabs)/profile-edit');
        break;
      case 1:
        // Les avis sont maintenant affichés directement dans le profil
        break;
      case 2:
        Alert.alert('Mes véhicules', 'Fonctionnalité en développement');
        break;
      case 3:
        Alert.alert('Méthodes de paiement', 'Fonctionnalité en développement');
        break;
      case 4:
        Alert.alert('Adresses favorites', 'Fonctionnalité en développement');
        break;
      case 5:
        Alert.alert('Notifications', 'Fonctionnalité en développement');
        break;
      case 6:
        Alert.alert('Sécurité', 'Fonctionnalité en développement');
        break;
      case 7:
        Alert.alert('Aide et support', 'Fonctionnalité en développement');
        break;
      case 8:
        Alert.alert('Paramètres', 'Fonctionnalité en développement');
        break;
      default:
        break;
    }
  };

  const handleToggleDisponible = (value: boolean) => {
    setDisponible(value);
  };

  return (
    <AnimatedTabScreen>
      <LinearGradient colors={['#667eea', '#764ba2']} style={{ flex: 1 }}>
        <SafeAreaView className="flex-1">
          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 100 }}>
            {/* Header avec photo de profil */}
            <View className="items-center pb-6 pt-6">
              <Image
                source={{ uri: profile.avatar }}
                className="mb-4 h-24 w-24 rounded-full border-4 border-white"
              />
              <Text className="mb-1 text-2xl font-bold text-white">{profile.name}</Text>
              <Text className="mb-2 text-white/80">{profile.email}</Text>

              {/* Badge véhicule pour les chauffeurs */}
              {isUserChauffeur && chauffeurProfile && (
                <View className="mb-2 flex-row items-center rounded-full bg-white/20 px-4 py-2">
                  <Text className="mr-2 text-lg">{chauffeurProfile.vehicule.icon}</Text>
                  <Text className="font-semibold text-white">
                    {chauffeurProfile.vehicule.label}
                  </Text>
                </View>
              )}

              <View className="flex-row items-center rounded-full bg-white/20 px-4 py-2">
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text className="ml-1 font-semibold text-white">{profile.rating}</Text>
              </View>

              {/* Badge Top Chauffeur si rating >= 4.5 */}
              {profile.rating >= 4.5 && (
                <View className="mt-3 flex-row items-center rounded-full bg-yellow-400/90 px-4 py-2">
                  <Text className="mr-1">🏆</Text>
                  <Text className="font-bold text-gray-800">
                    {isUserChauffeur ? 'Top Chauffeur' : 'Client VIP'}
                  </Text>
                </View>
              )}

              {/* Toggle disponibilité pour les chauffeurs */}
              {isUserChauffeur && chauffeurProfile && (
                <View className="mt-4 flex-row items-center rounded-2xl bg-white/10 px-5 py-3">
                  <View
                    className={`mr-3 h-3 w-3 rounded-full ${
                      chauffeurProfile.disponible ? 'bg-green-400' : 'bg-red-400'
                    }`}
                  />
                  <Text className="mr-3 font-medium text-white">
                    {chauffeurProfile.disponible ? 'Disponible' : 'Indisponible'}
                  </Text>
                  <Switch
                    value={chauffeurProfile.disponible}
                    onValueChange={handleToggleDisponible}
                    trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#10B981' }}
                    thumbColor="white"
                  />
                </View>
              )}
            </View>

            {/* Statistiques */}
            <View className="mx-6 mb-6 rounded-2xl bg-white/10 p-6">
              <Text className="mb-4 text-center text-lg font-bold text-white">
                {isUserChauffeur ? '📊 Mes performances' : '📊 Mes statistiques'}
              </Text>
              <View className="flex-row justify-around">
                <View className="items-center">
                  <Text className="text-3xl font-bold text-white">{profile.totalTrips}</Text>
                  <Text className="text-sm text-white/80">
                    {isUserChauffeur ? 'Courses' : 'Voyages'}
                  </Text>
                </View>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-white">{profile.totalDeliveries}</Text>
                  <Text className="text-sm text-white/80">Livraisons</Text>
                </View>
                <View className="items-center">
                  <Text className="text-3xl font-bold text-white">{profile.memberSince}</Text>
                  <Text className="text-sm text-white/80">Membre depuis</Text>
                </View>
              </View>
            </View>

            {/* Section principale avec onglets */}
            <View className="flex-1 rounded-t-3xl bg-gray-50 px-5 pt-6">
              {/* Onglets principaux : Avis / Réglages */}
              <View className="mb-5 flex-row rounded-2xl bg-white p-1.5 shadow-sm">
                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
                    activeMainTab === 'reviews' ? 'bg-purple-600' : ''
                  }`}
                  onPress={() => setActiveMainTab('reviews')}>
                  <Ionicons
                    name="star"
                    size={20}
                    color={activeMainTab === 'reviews' ? 'white' : '#9CA3AF'}
                  />
                  <Text
                    className={`text-base font-semibold ${
                      activeMainTab === 'reviews' ? 'text-white' : 'text-gray-400'
                    }`}>
                    Avis
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
                    activeMainTab === 'settings' ? 'bg-purple-600' : ''
                  }`}
                  onPress={() => setActiveMainTab('settings')}>
                  <Ionicons
                    name="settings"
                    size={20}
                    color={activeMainTab === 'settings' ? 'white' : '#9CA3AF'}
                  />
                  <Text
                    className={`text-base font-semibold ${
                      activeMainTab === 'settings' ? 'text-white' : 'text-gray-400'
                    }`}>
                    Réglages
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Contenu Avis */}
              {activeMainTab === 'reviews' && (
                <>
                  {/* Résumé des notes */}
                  <RatingSummary data={ratingSummary} />

                  {/* Onglets Avis reçus / Avis donnés (masqué pour chauffeurs) */}
                  {!isUserChauffeur ? (
                    <View className="mb-4 flex-row rounded-2xl bg-white p-1 shadow-sm">
                      <TouchableOpacity
                        className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3 ${
                          activeReviewTab === 'received' ? 'bg-blue-50' : ''
                        }`}
                        onPress={() => setActiveReviewTab('received')}>
                        <Ionicons
                          name="arrow-down-circle"
                          size={18}
                          color={activeReviewTab === 'received' ? COLORS.primary : '#9CA3AF'}
                        />
                        <Text
                          className={`text-sm font-medium ${
                            activeReviewTab === 'received'
                              ? 'font-semibold text-blue-600'
                              : 'text-gray-400'
                          }`}>
                          Reçus
                        </Text>
                        <View
                          className={`rounded-full px-2 py-0.5 ${
                            activeReviewTab === 'received' ? 'bg-blue-600' : 'bg-gray-200'
                          }`}>
                          <Text
                            className={`text-xs font-semibold ${
                              activeReviewTab === 'received' ? 'text-white' : 'text-gray-500'
                            }`}>
                            {receivedReviews.length}
                          </Text>
                        </View>
                      </TouchableOpacity>

                      <TouchableOpacity
                        className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-3 ${
                          activeReviewTab === 'given' ? 'bg-blue-50' : ''
                        }`}
                        onPress={() => setActiveReviewTab('given')}>
                        <Ionicons
                          name="arrow-up-circle"
                          size={18}
                          color={activeReviewTab === 'given' ? COLORS.primary : '#9CA3AF'}
                        />
                        <Text
                          className={`text-sm font-medium ${
                            activeReviewTab === 'given'
                              ? 'font-semibold text-blue-600'
                              : 'text-gray-400'
                          }`}>
                          Donnés
                        </Text>
                        <View
                          className={`rounded-full px-2 py-0.5 ${
                            activeReviewTab === 'given' ? 'bg-blue-600' : 'bg-gray-200'
                          }`}>
                          <Text
                            className={`text-xs font-semibold ${
                              activeReviewTab === 'given' ? 'text-white' : 'text-gray-500'
                            }`}>
                            {givenReviews.length}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text className="mb-4 text-center text-sm text-gray-500">
                      Avis reçus de vos clients
                    </Text>
                  )}

                  {/* Liste des avis */}
                  {(isUserChauffeur ? receivedReviews : reviews).length > 0 ? (
                    <View className="pb-6">
                      {(isUserChauffeur ? receivedReviews : reviews).map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </View>
                  ) : (
                    <View className="items-center justify-center py-12">
                      <Ionicons name="chatbubble-ellipses-outline" size={48} color="#D1D5DB" />
                      <Text className="mt-3 text-base text-gray-400">
                        Aucun avis pour le moment
                      </Text>
                    </View>
                  )}
                </>
              )}

              {/* Contenu Réglages */}
              {activeMainTab === 'settings' && (
                <>
                  {/* Menu des options */}
                  <View className="rounded-2xl bg-white px-4 pb-2 pt-4">
                    {menuItems
                      .filter((_, index) => index !== 1) // Exclure "Mes avis"
                      .map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => handleMenuPress(index >= 1 ? index + 1 : index)}
                          className="flex-row items-center border-b border-gray-100 py-4"
                          activeOpacity={0.7}>
                          <View className="mr-4 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                            <Ionicons name={item.icon as any} size={20} color="#2162FE" />
                          </View>
                          <View className="flex-1">
                            <Text className="font-semibold text-gray-800">{item.title}</Text>
                            <Text className="text-sm text-gray-500">{item.subtitle}</Text>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>
                      ))}
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </AnimatedTabScreen>
  );
}
