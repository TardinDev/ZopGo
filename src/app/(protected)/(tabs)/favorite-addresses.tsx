export { RouteErrorBoundary as ErrorBoundary } from '../../../components/RouteErrorBoundary';
import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { useSettingsStore } from '../../../stores/settingsStore';
import type { AddressIcon } from '../../../stores/settingsStore';

const ICON_OPTIONS: { icon: AddressIcon; iosName: string; label: string }[] = [
  { icon: 'home', iosName: 'home', label: 'Maison' },
  { icon: 'briefcase', iosName: 'briefcase', label: 'Travail' },
  { icon: 'star', iosName: 'star', label: 'Favori' },
  { icon: 'heart', iosName: 'heart', label: 'Amour' },
  { icon: 'location', iosName: 'location', label: 'Lieu' },
];

export default function FavoriteAddressesScreen() {
  const router = useRouter();
  const { favoriteAddresses, addFavoriteAddress, removeFavoriteAddress, updateFavoriteAddress } =
    useSettingsStore();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formIcon, setFormIcon] = useState<AddressIcon>('home');

  const resetForm = () => {
    setFormLabel('');
    setFormAddress('');
    setFormIcon('home');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (id: string) => {
    const addr = favoriteAddresses.find((a) => a.id === id);
    if (!addr) return;
    setEditingId(id);
    setFormLabel(addr.label);
    setFormAddress(addr.address);
    setFormIcon(addr.icon);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formLabel.trim() || !formAddress.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    if (editingId) {
      updateFavoriteAddress(editingId, {
        label: formLabel.trim(),
        address: formAddress.trim(),
        icon: formIcon,
      });
    } else {
      addFavoriteAddress({
        label: formLabel.trim(),
        address: formAddress.trim(),
        icon: formIcon,
      });
    }
    resetForm();
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette adresse ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeFavoriteAddress(id) },
    ]);
  };

  const getIosIcon = (icon: AddressIcon) =>
    ICON_OPTIONS.find((o) => o.icon === icon)?.iosName || 'location';

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={COLORS.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={{ paddingBottom: 32 }}>
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Adresses favorites</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="-mt-4 flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Liste */}
          {favoriteAddresses.length > 0 ? (
            <View className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
              {favoriteAddresses.map((addr) => (
                <View
                  key={addr.id}
                  className="flex-row items-center border-b border-gray-100 py-4">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <Ionicons
                      name={getIosIcon(addr.icon) as any}
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{addr.label}</Text>
                    <Text className="text-sm text-gray-500" numberOfLines={1}>
                      {addr.address}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleEdit(addr.id)} className="mr-3">
                    <Ionicons name="pencil-outline" size={20} color={COLORS.gray[500]} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(addr.id)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View className="mb-6 items-center rounded-2xl bg-white py-12 shadow-sm">
              <Ionicons name="location-outline" size={48} color={COLORS.gray[300]} />
              <Text className="mt-3 text-base text-gray-400">Aucune adresse enregistrée</Text>
            </View>
          )}

          {/* Formulaire */}
          {showForm ? (
            <View className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
              <Text className="mb-4 text-lg font-bold text-gray-800">
                {editingId ? 'Modifier l\'adresse' : 'Ajouter une adresse'}
              </Text>

              <Text className="mb-2 text-gray-600">Icône</Text>
              <View className="mb-4 flex-row gap-2">
                {ICON_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.icon}
                    onPress={() => setFormIcon(opt.icon)}
                    className={`h-12 w-12 items-center justify-center rounded-xl ${
                      formIcon === opt.icon ? 'bg-blue-100' : 'bg-gray-50'
                    }`}>
                    <Ionicons
                      name={opt.iosName as any}
                      size={22}
                      color={formIcon === opt.icon ? COLORS.primary : COLORS.gray[400]}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="mb-2 text-gray-600">Libellé</Text>
              <TextInput
                value={formLabel}
                onChangeText={setFormLabel}
                className="mb-4 rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="Ex: Maison, Bureau..."
              />

              <Text className="mb-2 text-gray-600">Adresse</Text>
              <TextInput
                value={formAddress}
                onChangeText={setFormAddress}
                className="mb-6 rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="Ex: Quartier Louis, Libreville"
                multiline
                numberOfLines={2}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={resetForm}
                  className="flex-1 rounded-xl bg-gray-100 py-4">
                  <Text className="text-center font-semibold text-gray-600">Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  className="flex-1 rounded-xl bg-[#2162FE] py-4">
                  <Text className="text-center font-semibold text-white">
                    {editingId ? 'Modifier' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              className="mb-8 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 py-4">
              <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
              <Text className="ml-2 font-semibold text-[#2162FE]">Ajouter une adresse</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
