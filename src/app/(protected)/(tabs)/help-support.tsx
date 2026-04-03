import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../constants';
import { faqData, contactInfo, type FAQItem } from '../../../data/help';

type CategoryFilter = 'all' | FAQItem['category'];

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'transport', label: 'Transport' },
  { key: 'livraison', label: 'Livraison' },
  { key: 'hebergement', label: 'Hébergement' },
  { key: 'paiement', label: 'Paiement' },
  { key: 'compte', label: 'Compte' },
  { key: 'securite', label: 'Sécurité' },
];

function AccordionItem({ item }: { item: FAQItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      className="border-b border-gray-100 py-4"
      activeOpacity={0.7}>
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 pr-3 text-base font-semibold text-gray-800">
          {item.question}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={COLORS.gray[400]}
        />
      </View>
      {expanded && (
        <Text className="mt-3 text-sm leading-5 text-gray-600">{item.answer}</Text>
      )}
    </TouchableOpacity>
  );
}

export default function HelpSupportScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('all');

  const filteredFaq =
    activeCategory === 'all'
      ? faqData
      : faqData.filter((item) => item.category === activeCategory);

  const handleEmail = () => {
    Linking.openURL(`mailto:${contactInfo.email}`);
  };

  const handlePhone = () => {
    Linking.openURL(`tel:${contactInfo.phone.replace(/\s/g, '')}`);
  };

  const handleWhatsApp = () => {
    const number = contactInfo.whatsapp.replace(/[+\s]/g, '');
    Linking.openURL(`https://wa.me/${number}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={COLORS.gradients.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 0.3 }}
        style={{ paddingBottom: 32 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pb-6 pt-4">
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-white">Aide & Support</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView
        className="-mt-4 flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Category Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setActiveCategory(cat.key)}
              className={`mr-2 rounded-full px-4 py-2 ${
                activeCategory === cat.key ? 'bg-blue-600' : 'bg-white'
              }`}
              activeOpacity={0.7}>
              <Text
                className={`text-sm font-medium ${
                  activeCategory === cat.key ? 'text-white' : 'text-gray-600'
                }`}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* FAQ Section */}
        <View className="mx-6 mb-6 rounded-2xl bg-white px-5 pt-4 shadow-sm">
          <View className="mb-2 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="help-circle-outline" size={20} color={COLORS.primary} />
            </View>
            <Text className="text-lg font-bold text-gray-800">Questions fréquentes</Text>
          </View>

          {filteredFaq.length > 0 ? (
            filteredFaq.map((item, index) => <AccordionItem key={index} item={item} />)
          ) : (
            <View className="items-center py-8">
              <Ionicons name="search-outline" size={40} color={COLORS.gray[300]} />
              <Text className="mt-2 text-gray-400">Aucune question dans cette catégorie</Text>
            </View>
          )}
        </View>

        {/* Contact Section */}
        <View className="mx-6 rounded-2xl bg-white p-6 shadow-sm">
          <View className="mb-5 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <Ionicons name="chatbubbles-outline" size={20} color={COLORS.primary} />
            </View>
            <Text className="text-lg font-bold text-gray-800">Nous contacter</Text>
          </View>

          {/* Email */}
          <TouchableOpacity
            onPress={handleEmail}
            className="mb-3 flex-row items-center rounded-xl bg-gray-50 p-4"
            activeOpacity={0.7}>
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <Ionicons name="mail-outline" size={20} color={COLORS.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-500">Email</Text>
              <Text className="text-base text-gray-800">{contactInfo.email}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.gray[400]} />
          </TouchableOpacity>

          {/* Phone */}
          <TouchableOpacity
            onPress={handlePhone}
            className="mb-3 flex-row items-center rounded-xl bg-gray-50 p-4"
            activeOpacity={0.7}>
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="call-outline" size={20} color={COLORS.success} />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-500">Téléphone</Text>
              <Text className="text-base text-gray-800">{contactInfo.phone}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.gray[400]} />
          </TouchableOpacity>

          {/* WhatsApp */}
          <TouchableOpacity
            onPress={handleWhatsApp}
            className="flex-row items-center rounded-xl bg-gray-50 p-4"
            activeOpacity={0.7}>
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-medium text-gray-500">WhatsApp</Text>
              <Text className="text-base text-gray-800">{contactInfo.whatsapp}</Text>
            </View>
            <Ionicons name="open-outline" size={18} color={COLORS.gray[400]} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
