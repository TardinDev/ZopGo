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
import type { PaymentProviderType } from '../../../stores/settingsStore';

type PaymentTypeChoice = 'card' | 'mobile_money';

const PROVIDER_OPTIONS: {
  type: PaymentTypeChoice;
  provider: PaymentProviderType;
  label: string;
  icon: string;
}[] = [
  { type: 'card', provider: 'visa', label: 'Visa', icon: 'card' },
  { type: 'card', provider: 'mastercard', label: 'Mastercard', icon: 'card' },
  { type: 'mobile_money', provider: 'airtel_money', label: 'Airtel Money', icon: 'phone-portrait' },
  { type: 'mobile_money', provider: 'moov_money', label: 'Moov Money', icon: 'phone-portrait' },
];

const getProviderColor = (provider: PaymentProviderType) => {
  switch (provider) {
    case 'visa':
      return '#1A1F71';
    case 'mastercard':
      return '#EB001B';
    case 'airtel_money':
      return '#ED1C24';
    case 'moov_money':
      return '#0066B3';
  }
};

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } =
    useSettingsStore();

  const [showForm, setShowForm] = useState(false);
  const [formProvider, setFormProvider] = useState<PaymentProviderType>('visa');
  const [formLabel, setFormLabel] = useState('');
  const [formNumber, setFormNumber] = useState('');

  const selectedOption = PROVIDER_OPTIONS.find((o) => o.provider === formProvider)!;

  const handleAdd = () => {
    if (!formLabel.trim() || !formNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }
    const digits = formNumber.replace(/\s/g, '');
    if (digits.length < 4) {
      Alert.alert('Erreur', 'Numéro invalide.');
      return;
    }
    const isFirst = paymentMethods.length === 0;
    addPaymentMethod({
      type: selectedOption.type,
      provider: formProvider,
      label: formLabel.trim(),
      lastDigits: digits.slice(-4),
      isDefault: isFirst,
    });
    setFormLabel('');
    setFormNumber('');
    setFormProvider('visa');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Supprimer', 'Voulez-vous supprimer cette méthode de paiement ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removePaymentMethod(id) },
    ]);
  };

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
          <Text className="text-xl font-bold text-white">Méthodes de paiement</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView className="-mt-4 flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Liste */}
          {paymentMethods.length > 0 ? (
            <View className="mb-6 rounded-2xl bg-white p-4 shadow-sm">
              {paymentMethods.map((method) => (
                <View
                  key={method.id}
                  className="flex-row items-center border-b border-gray-100 py-4">
                  <View
                    className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                    style={{ backgroundColor: getProviderColor(method.provider) + '20' }}>
                    <Ionicons
                      name={method.type === 'card' ? 'card' : 'phone-portrait'}
                      size={20}
                      color={getProviderColor(method.provider)}
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center">
                      <Text className="font-semibold text-gray-800">{method.label}</Text>
                      {method.isDefault && (
                        <View className="ml-2 rounded-full bg-blue-100 px-2 py-0.5">
                          <Text className="text-xs font-medium text-blue-600">Par défaut</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-gray-500">
                      **** {method.lastDigits}
                    </Text>
                  </View>
                  {!method.isDefault && (
                    <TouchableOpacity
                      onPress={() => setDefaultPaymentMethod(method.id)}
                      className="mr-3 rounded-lg bg-gray-100 px-3 py-2">
                      <Text className="text-xs font-medium text-gray-600">Défaut</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(method.id)}>
                    <Ionicons name="trash-outline" size={20} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View className="mb-6 items-center rounded-2xl bg-white py-12 shadow-sm">
              <Ionicons name="card-outline" size={48} color={COLORS.gray[300]} />
              <Text className="mt-3 text-base text-gray-400">
                Aucune méthode de paiement
              </Text>
            </View>
          )}

          {/* Formulaire */}
          {showForm ? (
            <View className="mb-8 rounded-2xl bg-white p-6 shadow-sm">
              <Text className="mb-4 text-lg font-bold text-gray-800">Ajouter une méthode</Text>

              <Text className="mb-2 text-gray-600">Type</Text>
              <View className="mb-4 flex-row flex-wrap gap-2">
                {PROVIDER_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.provider}
                    onPress={() => setFormProvider(opt.provider)}
                    className={`rounded-xl px-4 py-3 ${
                      formProvider === opt.provider ? 'bg-blue-100' : 'bg-gray-50'
                    }`}>
                    <Text
                      className={`font-medium ${
                        formProvider === opt.provider ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="mb-2 text-gray-600">Libellé</Text>
              <TextInput
                value={formLabel}
                onChangeText={setFormLabel}
                className="mb-4 rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder="Ex: Ma carte Visa"
              />

              <Text className="mb-2 text-gray-600">
                {selectedOption.type === 'card' ? 'Numéro de carte' : 'Numéro de téléphone'}
              </Text>
              <TextInput
                value={formNumber}
                onChangeText={setFormNumber}
                className="mb-6 rounded-xl bg-gray-50 px-4 py-3 text-gray-800"
                placeholder={
                  selectedOption.type === 'card' ? '1234 5678 9012 3456' : '+241 07 00 00 00'
                }
                keyboardType="number-pad"
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowForm(false)}
                  className="flex-1 rounded-xl bg-gray-100 py-4">
                  <Text className="text-center font-semibold text-gray-600">Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAdd}
                  className="flex-1 rounded-xl bg-[#2162FE] py-4">
                  <Text className="text-center font-semibold text-white">Ajouter</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowForm(true)}
              className="mb-8 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 py-4">
              <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
              <Text className="ml-2 font-semibold text-[#2162FE]">Ajouter une méthode</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
