import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
  Image,
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

const SPLASH_IMAGE = require('../../assets/splashScreen.jpg');

// Couleurs harmonisées avec l'illustration ZopGo
const ACCENT = '#0B8457';       // vert profond (voiture/logo)
const ACCENT_LIGHT = '#10B981'; // vert clair
const GOLD = '#E8A832';         // doré (motifs véhicule)

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

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const verificationInputRef = useRef<TextInput>(null);

  // Focus le champ de vérification dès qu'on arrive sur cet écran
  useEffect(() => {
    if (pendingVerification) {
      const timer = setTimeout(() => {
        verificationInputRef.current?.focus();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pendingVerification]);

  // Après sign-in, clerkUser se met à jour → configurer le profil
  // (Pour sign-up, le profil est déjà configuré dans handleVerifyEmail)
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

      // Sauvegarder le rôle choisi dans Clerk metadata
      clerkUser.update({
        unsafeMetadata: {
          role,
          vehicleType: role === 'chauffeur' ? selectedVehicle : undefined,
        },
      }).catch((err: any) => console.error('Failed to save Clerk metadata:', err));

      setupProfile(role, name, email, vehicleType, clerkUser.id);
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
          firstName: formData.name.split(' ')[0],
          lastName: formData.name.split(' ').slice(1).join(' ') || undefined,
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

        // Configurer le profil immédiatement avec les données du formulaire
        // (ne pas attendre le useEffect clerkUser qui a une race condition)
        const userId = result.createdUserId || Date.now().toString();
        const name = formData.name || formData.email.split('@')[0] || 'Utilisateur';
        const vehicleType = selectedRole === 'chauffeur' ? selectedVehicle : undefined;
        hasSetupProfile.current = true;
        setupProfile(selectedRole, name, formData.email, vehicleType, userId);

        // Sauvegarder le rôle dans Clerk metadata (async, non bloquant)
        if (result.createdUserId) {
          signUp.update?.({
            unsafeMetadata: {
              role: selectedRole,
              vehicleType: selectedRole === 'chauffeur' ? selectedVehicle : undefined,
            },
          }).catch(() => {});
        }

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
        {/* Background layer — completely non-interactive */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Image source={SPLASH_IMAGE} style={styles.bgImage} />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.75)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Content layer — interactive */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex1}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.verificationScrollContent}
            keyboardShouldPersistTaps="handled">
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
                colors={[ACCENT, GOLD]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardAccentBar}
              />
              {/* Visual code boxes */}
              <Pressable
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
              </Pressable>

              {/* Visible text input */}
              <TextInput
                ref={verificationInputRef}
                value={verificationCode}
                onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                placeholder="000000"
                placeholderTextColor={COLORS.gray[300]}
                style={styles.codeInput}
              />

              {/* Submit button */}
              <TouchableOpacity
                onPress={handleVerifyEmail}
                disabled={isLoading || verificationCode.length < 6}
                style={isLoading || verificationCode.length < 6 ? styles.buttonDisabled : undefined}>
                <LinearGradient
                  colors={[ACCENT, '#065F46']}
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
      {/* Background layer — completely non-interactive */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Image source={SPLASH_IMAGE} style={styles.bgImage} />
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.75)']}
          locations={[0, 0.4, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      {/* Content layer — interactive */}
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
              <View style={[styles.card, { borderColor: selectedRole === 'chauffeur' ? GOLD : 'rgba(255, 255, 255, 0.4)' }]}>
                {/* Accent bar top */}
                <LinearGradient
                  colors={selectedRole === 'chauffeur' ? [GOLD, '#D97706'] : [ACCENT, GOLD]}
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
                        color={selectedRole === 'client' ? ACCENT : COLORS.gray[400]}
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
                        selectedRole === 'chauffeur' ? styles.rolePillActiveChauffeur : styles.rolePillInactive,
                      ]}>
                      <Ionicons
                        name="car"
                        size={20}
                        color={selectedRole === 'chauffeur' ? GOLD : COLORS.gray[400]}
                      />
                      <Text
                        style={[
                          styles.rolePillText,
                          selectedRole === 'chauffeur' ? styles.rolePillTextActiveChauffeur : styles.rolePillTextInactive,
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
                    <Pressable
                      onPress={() => nameRef.current?.focus()}
                      style={[
                        styles.inputContainer,
                        focusedField === 'name' && styles.inputFocused,
                      ]}>
                      <Ionicons name="person-outline" size={20} color={COLORS.gray[400]} />
                      <TextInput
                        ref={nameRef}
                        placeholder="Nom complet"
                        placeholderTextColor={COLORS.gray[400]}
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        style={styles.input}
                      />
                    </Pressable>
                  </View>
                )}

                {/* Email */}
                <View style={styles.fieldGroup}>
                  <Pressable
                    onPress={() => emailRef.current?.focus()}
                    style={[
                      styles.inputContainer,
                      focusedField === 'email' && styles.inputFocused,
                    ]}>
                    <Ionicons name="mail-outline" size={20} color={COLORS.gray[400]} />
                    <TextInput
                      ref={emailRef}
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
                  </Pressable>
                </View>

                {/* Password */}
                <View style={styles.fieldGroup}>
                  <Pressable
                    onPress={() => passwordRef.current?.focus()}
                    style={[
                      styles.inputContainer,
                      focusedField === 'password' && styles.inputFocused,
                    ]}>
                    <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />
                    <TextInput
                      ref={passwordRef}
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
                  </Pressable>
                </View>

                {/* Confirm Password (only for register) */}
                {!isLogin && (
                  <View style={styles.fieldGroup}>
                    <Pressable
                      onPress={() => confirmPasswordRef.current?.focus()}
                      style={[
                        styles.inputContainer,
                        focusedField === 'confirmPassword' && styles.inputFocused,
                      ]}>
                      <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />
                      <TextInput
                        ref={confirmPasswordRef}
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
                    </Pressable>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={[styles.submitTouchable, isLoading && styles.buttonDisabled]}>
                  <LinearGradient
                    colors={[ACCENT, '#065F46']}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  flex1: {
    flex: 1,
  },
  bgImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  verificationScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    paddingBottom: 16,
    alignItems: 'center',
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
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    padding: 20,
    paddingTop: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 30,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardAccentBar: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    height: 5,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 12,
  },
  roleSection: {
    marginBottom: 14,
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
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
  },
  rolePillActive: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(11, 132, 87, 0.15)',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  rolePillInactive: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  rolePillText: {
    fontSize: 15,
    fontWeight: '600',
  },
  rolePillTextActive: {
    color: ACCENT,
  },
  rolePillActiveChauffeur: {
    borderColor: GOLD,
    backgroundColor: 'rgba(232, 168, 50, 0.15)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  rolePillTextActiveChauffeur: {
    color: GOLD,
  },
  rolePillTextInactive: {
    color: COLORS.gray[500],
  },
  vehicleSection: {
    marginBottom: 14,
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
    borderColor: ACCENT,
    backgroundColor: 'rgba(11, 132, 87, 0.15)',
  },
  vehicleChipInactive: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  vehicleIcon: {
    fontSize: 16,
  },
  vehicleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  vehicleLabelActive: {
    color: ACCENT,
  },
  vehicleLabelInactive: {
    color: COLORS.gray[500],
  },
  fieldGroup: {
    marginBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  inputFocused: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
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
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
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
    marginVertical: 14,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  separatorText: {
    marginHorizontal: 16,
    fontSize: 13,
    color: COLORS.gray[600],
    fontWeight: '600',
    textTransform: 'lowercase',
  },
  toggleButton: {
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    color: COLORS.gray[600],
  },
  toggleTextBold: {
    fontWeight: '700',
    color: ACCENT,
  },
  // Verification screen
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
    marginBottom: 12,
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
    borderColor: ACCENT,
  },
  codeBoxActive: {
    borderColor: GOLD,
    backgroundColor: COLORS.white,
  },
  codeBoxText: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.gray[900],
  },
  codeInput: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.gray[100],
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    textAlign: 'center',
    letterSpacing: 16,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  resendText: {
    fontSize: 14,
    fontWeight: '600',
    color: GOLD,
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
