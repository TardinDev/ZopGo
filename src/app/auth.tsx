import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import { useAuthStore, VEHICLE_TYPES } from '../stores/authStore';
import { UserRole, VehicleType } from '../types';
import { ModeTransition } from '../components/ui';
import { COLORS } from '../constants/colors';

const AUTH_IMAGES = {
  taxi: require('../../assets/auth/luxury_cars.jpg'),
  transport: require('../../assets/auth/city_traffic.jpg'),
  passengers: require('../../assets/auth/nairobi_city.jpg'),
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AuthScreen() {
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  const { user: clerkUser } = useUser();
  const { setupProfile } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('moto');
  const [showTransition, setShowTransition] = useState(false);
  const [transitionRole, setTransitionRole] = useState<UserRole>('client');
  const [isRoleSwitch, setIsRoleSwitch] = useState(false);
  const hasSetupProfile = useRef(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const verificationInputRef = useRef<TextInput>(null);

  // Après sign-in/sign-up, clerkUser se met à jour → configurer le profil
  // Le rôle sélectionné dans le formulaire est TOUJOURS utilisé (même compte = client ou chauffeur)
  useEffect(() => {
    if (clerkUser && showTransition && !isRoleSwitch && !hasSetupProfile.current) {
      hasSetupProfile.current = true;

      const role = selectedRole;
      const vehicleType = selectedRole === 'chauffeur' ? selectedVehicle : undefined;

      const name =
        clerkUser.fullName ||
        clerkUser.firstName ||
        formData.name ||
        formData.email.split('@')[0] ||
        'Utilisateur';
      const email = clerkUser.primaryEmailAddress?.emailAddress || formData.email;

      // Toujours sauvegarder le rôle choisi dans Clerk metadata
      clerkUser.update({
        unsafeMetadata: {
          role,
          vehicleType: role === 'chauffeur' ? selectedVehicle : undefined,
        },
      }).catch((err: any) => console.error('Failed to save Clerk metadata:', err));

      setupProfile(
        role,
        name,
        email,
        vehicleType,
        clerkUser.id
      );
    }
  }, [clerkUser, showTransition, isRoleSwitch]);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole !== selectedRole) {
      setTransitionRole(newRole);
      setIsRoleSwitch(true);
      setShowTransition(true);
    }
  };

  const handleRoleSwitchComplete = () => {
    setSelectedRole(transitionRole);
    setShowTransition(false);
    setIsRoleSwitch(false);
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (!isLogin && !formData.name) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        // --- Connexion ---
        if (!isSignInLoaded || !signIn) return;
        const result = await signIn.create({
          identifier: formData.email,
          password: formData.password,
        });

        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          setTransitionRole(selectedRole);
          setIsRoleSwitch(false);
          setShowTransition(true);
        }
      } else {
        // --- Inscription ---
        if (!isSignUpLoaded || !signUp) return;
        await signUp.create({
          emailAddress: formData.email,
          password: formData.password,
        });
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true);
      }
    } catch (err: any) {
      const errorMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Une erreur est survenue';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!isSignUpLoaded || !signUp) return;

    setIsLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      if (result.status === 'complete') {
        await setSignUpActive({ session: result.createdSessionId });

        // Afficher la transition animée
        // Le profil sera configuré via le useEffect clerkUser ci-dessus
        setTransitionRole(selectedRole);
        setIsRoleSwitch(false);
        setShowTransition(true);
      }
    } catch (err: any) {
      const errorMessage =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        'Code de vérification invalide';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    router.replace('/(protected)/(tabs)');
  };

  const vehicleOptions = Object.values(VEHICLE_TYPES);

  const codeDigits = verificationCode.split('');

  // --- Écran de vérification email ---
  if (pendingVerification) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.background}>
          {/* Arc décoratif avec images */}
          <View style={styles.arcContainer}>
            <View style={styles.arcImageWrapper}>
              <View style={styles.imageRow}>
                <Image source={AUTH_IMAGES.taxi} style={styles.arcImageLeft} />
                <View style={styles.imageColRight}>
                  <Image source={AUTH_IMAGES.transport} style={styles.arcImageTopRight} />
                  <Image source={AUTH_IMAGES.passengers} style={styles.arcImageBottomRight} />
                </View>
              </View>
              {/* Gradient overlay */}
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.30)', 'rgba(0, 0, 0, 0.60)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.arcOverlay}
              />
            </View>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.flex1}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.verificationScrollContent}
              keyboardShouldPersistTaps="handled">
              {/* Icon */}
              <View style={styles.verificationIconContainer}>
                <View style={styles.verificationIconCircle}>
                  <Ionicons name="mail-outline" size={36} color={COLORS.white} />
                </View>
              </View>

              {/* Title */}
              <Text style={styles.verificationTitle}>Vérification email</Text>
              <Text style={styles.verificationSubtitle}>
                Un code a été envoyé à{'\n'}
                <Text style={styles.verificationEmail}>{formData.email}</Text>
              </Text>

              {/* Card */}
              <View style={styles.card}>
                {/* Accent bar top */}
                <LinearGradient
                  colors={[COLORS.primary, '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardAccentBar}
                />
                {/* 6 digit boxes */}
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => verificationInputRef.current?.focus()}
                  style={styles.codeBoxesRow}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.codeBox,
                        codeDigits[i] ? styles.codeBoxFilled : null,
                        i === codeDigits.length && styles.codeBoxActive,
                      ]}>
                      <Text style={styles.codeBoxText}>{codeDigits[i] || ''}</Text>
                    </View>
                  ))}
                </TouchableOpacity>

                {/* Hidden input */}
                <TextInput
                  ref={verificationInputRef}
                  value={verificationCode}
                  onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.hiddenInput}
                  autoFocus
                />

                {/* Submit button */}
                <TouchableOpacity
                  onPress={handleVerifyEmail}
                  disabled={isLoading || verificationCode.length < 6}
                  style={isLoading || verificationCode.length < 6 ? styles.buttonDisabled : undefined}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButton}>
                    <Text style={styles.submitText}>
                      {isLoading ? 'Vérification...' : 'Vérifier'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Resend */}
                <TouchableOpacity
                  onPress={() => {
                    if (signUp) {
                      signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                      Alert.alert('Succès', 'Un nouveau code a été envoyé');
                    }
                  }}
                  style={styles.resendButton}>
                  <Text style={styles.resendText}>Renvoyer le code</Text>
                </TouchableOpacity>

                {/* Back */}
                <TouchableOpacity
                  onPress={() => {
                    setPendingVerification(false);
                    setVerificationCode('');
                  }}
                  style={styles.backButton}>
                  <Ionicons name="arrow-back" size={16} color={COLORS.gray[500]} />
                  <Text style={styles.backText}>Retour</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

        <ModeTransition
          visible={showTransition}
          role={selectedRole}
          onComplete={handleTransitionComplete}
          quick={false}
        />
      </SafeAreaView>
    );
  }

  // --- Écran principal login/register ---
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.background}>
        {/* Arc décoratif avec images */}
        <View style={styles.arcContainer} pointerEvents="none">
          <View style={styles.arcImageWrapper}>
            <View style={styles.imageRow}>
              <Image source={AUTH_IMAGES.taxi} style={styles.arcImageLeft} />
              <View style={styles.imageColRight}>
                <Image source={AUTH_IMAGES.transport} style={styles.arcImageTopRight} />
                <Image source={AUTH_IMAGES.passengers} style={styles.arcImageBottomRight} />
              </View>
            </View>
            {/* Gradient overlay */}
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.30)', 'rgba(0, 0, 0, 0.60)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.arcOverlay}
              pointerEvents="none"
            />
          </View>
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex1}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.logo}>ZopGo</Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Bon retour parmi nous' : 'Créez votre compte'}
              </Text>
            </View>

            {/* Card */}
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                {/* Accent bar top */}
                <LinearGradient
                  colors={[COLORS.primary, '#7C3AED']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.cardAccentBar}
                />
                {/* Sélecteur de rôle */}
                <View style={styles.roleSection}>
                  <Text style={styles.sectionLabel}>Je suis</Text>
                  <View style={styles.roleRow}>
                    <TouchableOpacity
                      onPress={() => handleRoleChange('client')}
                      style={[
                        styles.rolePill,
                        selectedRole === 'client' ? styles.rolePillActive : styles.rolePillInactive,
                      ]}>
                      <Ionicons
                        name="person"
                        size={20}
                        color={selectedRole === 'client' ? COLORS.primary : COLORS.gray[400]}
                      />
                      <Text
                        style={[
                          styles.rolePillText,
                          selectedRole === 'client' ? styles.rolePillTextActive : styles.rolePillTextInactive,
                        ]}>
                        Client
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRoleChange('chauffeur')}
                      style={[
                        styles.rolePill,
                        selectedRole === 'chauffeur' ? styles.rolePillActive : styles.rolePillInactive,
                      ]}>
                      <Ionicons
                        name="car"
                        size={20}
                        color={selectedRole === 'chauffeur' ? COLORS.primary : COLORS.gray[400]}
                      />
                      <Text
                        style={[
                          styles.rolePillText,
                          selectedRole === 'chauffeur' ? styles.rolePillTextActive : styles.rolePillTextInactive,
                        ]}>
                        Chauffeur
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sélecteur de véhicule (chauffeur) */}
                {selectedRole === 'chauffeur' && (
                  <View style={styles.vehicleSection}>
                    <Text style={styles.sectionLabel}>Mon véhicule</Text>
                    <View style={styles.vehicleRow}>
                      {vehicleOptions.map((vehicle) => (
                        <TouchableOpacity
                          key={vehicle.type}
                          onPress={() => setSelectedVehicle(vehicle.type)}
                          style={[
                            styles.vehicleChip,
                            selectedVehicle === vehicle.type
                              ? styles.vehicleChipActive
                              : styles.vehicleChipInactive,
                          ]}>
                          <Text style={styles.vehicleIcon}>{vehicle.icon}</Text>
                          <Text
                            style={[
                              styles.vehicleLabel,
                              selectedVehicle === vehicle.type
                                ? styles.vehicleLabelActive
                                : styles.vehicleLabelInactive,
                            ]}>
                            {vehicle.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Name field (only for register) */}
                {!isLogin && (
                  <View style={styles.fieldGroup}>
                    <View
                      style={[
                        styles.inputContainer,
                        focusedField === 'name' && styles.inputFocused,
                      ]}>
                      <Ionicons name="person-outline" size={20} color={COLORS.gray[400]} />
                      <TextInput
                        placeholder="Nom complet"
                        placeholderTextColor={COLORS.gray[400]}
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        style={styles.input}
                      />
                    </View>
                  </View>
                )}

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === 'email' && styles.inputFocused,
                    ]}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.gray[400]} />
                    <TextInput
                      placeholder="votre.email@example.com"
                      placeholderTextColor={COLORS.gray[400]}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      style={styles.input}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === 'password' && styles.inputFocused,
                    ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />
                    <TextInput
                      placeholder="Mot de passe"
                      placeholderTextColor={COLORS.gray[400]}
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      secureTextEntry={!showPassword}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      style={styles.input}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color={COLORS.gray[400]}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password (only for register) */}
                {!isLogin && (
                  <View style={styles.fieldGroup}>
                    <View
                      style={[
                        styles.inputContainer,
                        focusedField === 'confirmPassword' && styles.inputFocused,
                      ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />
                      <TextInput
                        placeholder="Confirmer le mot de passe"
                        placeholderTextColor={COLORS.gray[400]}
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                        secureTextEntry={!showConfirmPassword}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        style={styles.input}
                      />
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons
                          name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={COLORS.gray[400]}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={[styles.submitTouchable, isLoading && styles.buttonDisabled]}>
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.submitButton}>
                    <Text style={styles.submitText}>
                      {isLoading ? 'Chargement...' : isLogin ? 'Se connecter' : 'Créer le compte'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Separator */}
                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>ou</Text>
                  <View style={styles.separatorLine} />
                </View>

                {/* Toggle */}
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.toggleButton}>
                  <Text style={styles.toggleText}>
                    {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                    <Text style={styles.toggleTextBold}>
                      {isLogin ? 'Créer un compte' : 'Se connecter'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Mode Transition Overlay */}
        <ModeTransition
          visible={showTransition}
          role={isRoleSwitch ? transitionRole : selectedRole}
          onComplete={isRoleSwitch ? handleRoleSwitchComplete : handleTransitionComplete}
          quick={isRoleSwitch}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
  },
  flex1: {
    flex: 1,
  },
  arcContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  arcImageWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  imageRow: {
    flexDirection: 'row',
    flex: 1,
  },
  arcImageLeft: {
    width: SCREEN_WIDTH * 0.55,
    height: '100%',
    resizeMode: 'cover',
  },
  imageColRight: {
    flex: 1,
  },
  arcImageTopRight: {
    width: '100%',
    height: '50%',
    resizeMode: 'cover',
  },
  arcImageBottomRight: {
    width: '100%',
    height: '50%',
    resizeMode: 'cover',
  },
  arcOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  verificationScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 32,
    alignItems: 'center',
    zIndex: 1,
  },
  logo: {
    fontSize: 40,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cardContainer: {
    paddingHorizontal: 20,
    zIndex: 1,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.93)',
    borderRadius: 24,
    padding: 24,
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 12,
    overflow: 'hidden',
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  roleSection: {
    marginBottom: 20,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
  },
  rolePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
  },
  rolePillActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}18`,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  rolePillInactive: {
    borderColor: COLORS.gray[200],
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  rolePillText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rolePillTextActive: {
    color: COLORS.primary,
  },
  rolePillTextInactive: {
    color: COLORS.gray[500],
  },
  vehicleSection: {
    marginBottom: 20,
  },
  vehicleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  vehicleChipActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}18`,
  },
  vehicleChipInactive: {
    borderColor: COLORS.gray[200],
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  vehicleIcon: {
    fontSize: 16,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleLabelActive: {
    color: COLORS.primary,
  },
  vehicleLabelInactive: {
    color: COLORS.gray[500],
  },
  fieldGroup: {
    marginBottom: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.gray[200],
  },
  inputFocused: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.gray[900],
    marginLeft: 12,
  },
  submitTouchable: {
    marginTop: 6,
  },
  submitButton: {
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  submitText: {
    color: COLORS.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: COLORS.gray[500],
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  toggleButton: {
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
  toggleTextBold: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  // Verification screen
  verificationIconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  verificationIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verificationTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  verificationSubtitle: {
    fontSize: 15,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verificationEmail: {
    fontWeight: '700',
    color: COLORS.white,
  },
  codeBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  codeBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    backgroundColor: COLORS.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  codeBoxFilled: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.primary,
  },
  codeBoxActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
  },
  codeBoxText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 0,
    width: 0,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  backText: {
    fontSize: 14,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
});
