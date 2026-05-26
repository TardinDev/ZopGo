import { useState, useEffect, useRef, useMemo } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp, FadeIn, LinearTransition } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSignIn, useSignUp, useUser } from '@clerk/clerk-expo';
import { useAuthStore, VEHICLE_TYPES, ACCOMMODATION_TYPES } from '../stores/authStore';
import { UserRole, VehicleType, AccommodationType } from '../types';

// Clerk second factor types (not exported by @clerk/clerk-expo)
interface ClerkSecondFactor {
  strategy: string;
  emailAddressId?: string;
  phoneNumberId?: string;
}

import { friendlyAuthError, ClerkError } from '../lib/clerkErrors';
import { ModeTransition } from '../components/ui';
import { COLORS } from '../constants/colors';

const SPLASH_IMAGE = require('../../assets/zopgo_wallpaper_android_20x9_1080x2400.jpg');

// Brand color (ZopGo blue). Replaces the previous green ACCENT so the
// boarding-pass aesthetic stays consistent with the detail screens and
// onboarding gates. Gold/Violet keep their per-role meaning.
const ACCENT = COLORS.primary;
const GOLD = '#E8A832';
const VIOLET = '#8B5CF6';
// Agence brand color — a deep teal that reads as "transport company" without
// fighting the other role accents (blue=client, gold=transporteur, violet=hebergeur).
const TEAL = '#0D9488';

export default function AuthScreen() {
  const { signIn, setActive, isLoaded: isSignInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: isSignUpLoaded } = useSignUp();
  const { user: clerkUser } = useUser();
  const { setupProfile, promoteToAgence, supabaseProfileId } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pendingSecondFactor, setPendingSecondFactor] = useState(false);
  const [secondFactorStrategy, setSecondFactorStrategy] = useState<'totp' | 'phone_code' | 'email_code'>('totp');
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });
  const [selectedRole, setSelectedRole] = useState<UserRole>('client');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('voiture');
  const [selectedAccommodation, setSelectedAccommodation] = useState<AccommodationType>('hotel');
  // Agency invitation flow: code typed at signup + the agency name returned by
  // the validate-and-claim RPC. The actual claim is deferred until the local
  // profile finishes syncing (we need supabaseProfileId from authStore).
  const [agencyCode, setAgencyCode] = useState('');
  const [pendingAgencyClaim, setPendingAgencyClaim] = useState<string | null>(null);
  const [agencyClaimError, setAgencyClaimError] = useState<string | null>(null);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionRole, setTransitionRole] = useState<UserRole>('client');
  const [isRoleSwitch, setIsRoleSwitch] = useState(false);
  const hasSetupProfile = useRef(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewResetPassword, setShowNewResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  // Auto-dismiss the friendly error banner after a few seconds.
  useEffect(() => {
    if (!authErrorMsg) return;
    const t = setTimeout(() => setAuthErrorMsg(null), 5000);
    return () => clearTimeout(t);
  }, [authErrorMsg]);

  // Agency promotion runs as a chaser after the base profile syncs.
  // `setupProfile` is fire-and-forget so we wait for supabaseProfileId to
  // appear, then call the SECURITY DEFINER claim function. On success the
  // store updates role → 'agence' locally and the transition animation
  // (or the protected layout) routes the user into the agence experience.
  useEffect(() => {
    if (!pendingAgencyClaim || !supabaseProfileId) return;
    const code = pendingAgencyClaim;
    setPendingAgencyClaim(null);
    (async () => {
      const result = await promoteToAgence(code);
      if (result.ok) {
        // Persist the promotion in Clerk metadata so cold-starts hydrate
        // with role='agence' immediately rather than briefly flashing the
        // chauffeur tabs while waiting for the Supabase profile sync.
        if (clerkUser) {
          clerkUser
            .update({ unsafeMetadata: { ...(clerkUser.unsafeMetadata || {}), role: 'agence' } })
            .catch((err: unknown) => {
              if (__DEV__) console.warn('[promoteToAgence] Clerk metadata update failed', err);
            });
        }
      } else {
        setAgencyClaimError(result.message);
        Alert.alert(
          'Code agence invalide',
          `${result.message}\n\nTon compte est créé en tant que transporteur — tu peux réessayer plus tard depuis ton profil.`
        );
      }
    })();
  }, [pendingAgencyClaim, supabaseProfileId, promoteToAgence, clerkUser]);

  const nameRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);
  const verificationInputRef = useRef<TextInput>(null);
  const secondFactorInputRef = useRef<TextInput>(null);
  const resetCodeInputRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);

  // Focus le champ de vérification dès qu'on arrive sur cet écran
  useEffect(() => {
    if (pendingVerification || pendingSecondFactor || pendingPasswordReset) {
      const timer = setTimeout(() => {
        if (pendingSecondFactor) {
          secondFactorInputRef.current?.focus();
        } else if (pendingPasswordReset) {
          resetCodeInputRef.current?.focus();
        } else {
          verificationInputRef.current?.focus();
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [pendingVerification, pendingSecondFactor, pendingPasswordReset]);

  // Après auth, clerkUser se met à jour → configurer le profil + sauvegarder metadata
  useEffect(() => {
    if (!clerkUser || !showTransition || isRoleSwitch) return;

    // 'agence' starts life as a 'chauffeur' profile both in Clerk metadata
    // and in the local store; the promoteToAgence chaser flips it to
    // 'agence' once the invitation code is claimed server-side. This keeps
    // the DB in a valid state if the code claim fails (user simply stays
    // a regular transporteur instead of dangling as an "unclaimed agence").
    const baseRole: UserRole = selectedRole === 'agence' ? 'chauffeur' : selectedRole;

    // Sauvegarder le rôle choisi dans Clerk metadata (idempotent)
    clerkUser.update({
      unsafeMetadata: {
        role: baseRole,
        vehicleType: baseRole === 'chauffeur' ? selectedVehicle : undefined,
        accommodationType: baseRole === 'hebergeur' ? selectedAccommodation : undefined,
      },
    }).catch((err: unknown) => { if (__DEV__) console.error('Failed to save Clerk metadata:', err); });

    // Configurer le profil local uniquement si pas déjà fait
    // (sign-up le fait directement dans handleVerifyEmail pour éviter la race condition)
    if (hasSetupProfile.current) return;
    hasSetupProfile.current = true;

    const vehicleType = baseRole === 'chauffeur' ? selectedVehicle : undefined;
    const accommodationType = baseRole === 'hebergeur' ? selectedAccommodation : undefined;
    const name =
      clerkUser.fullName ||
      clerkUser.firstName ||
      formData.name ||
      formData.email.split('@')[0] ||
      'Utilisateur';
    const email = clerkUser.primaryEmailAddress?.emailAddress || formData.email;

    setupProfile(baseRole, name, email, vehicleType, clerkUser.id, accommodationType);

    // Defer the agency claim until supabaseProfileId is set by setupProfile's
    // background sync — the useEffect watching pendingAgencyClaim picks it up.
    if (selectedRole === 'agence' && agencyCode.trim()) {
      setPendingAgencyClaim(agencyCode.trim());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkUser, showTransition, isRoleSwitch]);

  // Force de mot de passe (pour inscription)
  const passwordStrength = useMemo(() => {
    const pwd = formData.password;
    if (!pwd) return { score: 0, label: '', color: COLORS.gray[300] };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (pwd.length >= 12) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
    const labels = ['Faible', 'Faible', 'Moyen', 'Bon', 'Fort', 'Excellent'];
    const colors = ['#EF4444', '#EF4444', '#F59E0B', '#EAB308', '#10B981', '#059669'];
    return { score, label: labels[score], color: colors[score] };
  }, [formData.password]);

  const handleRoleChange = (newRole: UserRole) => {
    if (newRole !== selectedRole) {
      if (Platform.OS === 'ios') {
        Haptics.selectionAsync().catch(() => {});
      }
      setTransitionRole(newRole);
      setIsRoleSwitch(true);
      setShowTransition(true);
    }
  };

  const handleToggleMode = () => {
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync().catch(() => {});
    }
    setIsLogin(!isLogin);
    setAuthErrorMsg(null);
  };

  const handleRoleSwitchComplete = () => {
    setSelectedRole(transitionRole);
    setShowTransition(false);
    setIsRoleSwitch(false);
  };

  const handleSubmit = async () => {
    setAuthErrorMsg(null);
    const email = formData.email.trim();
    const notifyError = () => {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    };
    if (!email || !formData.password) {
      notifyError();
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    if (!isLogin && !formData.name.trim()) {
      notifyError();
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }
    if (!isLogin && formData.password !== formData.confirmPassword) {
      notifyError();
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (!isLogin && selectedRole === 'agence' && !agencyCode.trim()) {
      notifyError();
      Alert.alert(
        'Code requis',
        "Le rôle Agence nécessite un code d'invitation. Si tu n'en as pas, choisis un autre rôle ou contacte ZopGo."
      );
      return;
    }
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }

    if (isLogin && (!isSignInLoaded || !signIn)) {
      Alert.alert('Erreur', 'Le service d\'authentification n\'est pas encore prêt. Réessayez.');
      return;
    }
    if (!isLogin && (!isSignUpLoaded || !signUp)) {
      Alert.alert('Erreur', 'Le service d\'authentification n\'est pas encore prêt. Réessayez.');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        // --- Connexion ---
        const result = await signIn!.create({
          identifier: email,
          password: formData.password,
        });

        if (result.status === 'complete') {
          await setActive!({ session: result.createdSessionId });
          setTransitionRole(selectedRole);
          setIsRoleSwitch(false);
          setShowTransition(true);
        } else if (result.status === 'needs_second_factor') {
          // 2FA requis — déterminer la stratégie disponible
          const supported = result.supportedSecondFactors;
          const emailFactor = supported?.find((f: ClerkSecondFactor) => f.strategy === 'email_code');
          const phoneFactor = supported?.find((f: ClerkSecondFactor) => f.strategy === 'phone_code');
          const hasTotp = supported?.some((f: ClerkSecondFactor) => f.strategy === 'totp');

          if (emailFactor && 'emailAddressId' in emailFactor) {
            setSecondFactorStrategy('email_code');
            await signIn!.prepareSecondFactor({
              strategy: 'email_code',
              emailAddressId: emailFactor.emailAddressId,
            } as Parameters<NonNullable<typeof signIn>['prepareSecondFactor']>[0]);
          } else if (phoneFactor) {
            setSecondFactorStrategy('phone_code');
            await signIn!.prepareSecondFactor({ strategy: 'phone_code' });
          } else if (hasTotp) {
            setSecondFactorStrategy('totp');
          }

          setVerificationCode('');
          setPendingSecondFactor(true);
        } else {
          Alert.alert('Erreur', `Authentification incomplète (${result.status}). Veuillez réessayer.`);
        }
      } else {
        // --- Inscription ---
        await signUp!.create({
          emailAddress: email,
          password: formData.password,
          firstName: formData.name.trim().split(' ')[0],
          lastName: formData.name.trim().split(' ').slice(1).join(' ') || undefined,
        });
        await signUp!.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true);
      }
    } catch (err: unknown) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      setAuthErrorMsg(friendlyAuthError(err as ClerkError));
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
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        await setSignUpActive({ session: result.createdSessionId });

        // Configurer le profil immédiatement avec les données du formulaire
        // (ne pas attendre le useEffect clerkUser qui a une race condition)
        const userId = result.createdUserId || Date.now().toString();
        const name = formData.name || formData.email.split('@')[0] || 'Utilisateur';
        // Agence flow: create the profile as 'chauffeur' first; the
        // promoteToAgence chaser (triggered by the pendingAgencyClaim
        // useEffect once supabaseProfileId is ready) flips role + adds the
        // agency name once the invitation code is validated server-side.
        const baseRole: UserRole = selectedRole === 'agence' ? 'chauffeur' : selectedRole;
        const vehicleType = baseRole === 'chauffeur' ? selectedVehicle : undefined;
        const accommodationType = baseRole === 'hebergeur' ? selectedAccommodation : undefined;
        hasSetupProfile.current = true;
        setupProfile(baseRole, name, formData.email, vehicleType, userId, accommodationType);

        if (selectedRole === 'agence' && agencyCode.trim()) {
          setPendingAgencyClaim(agencyCode.trim());
        }

        // Le metadata Clerk sera sauvegardé par le useEffect quand clerkUser sera disponible

        setTransitionRole(selectedRole);
        setIsRoleSwitch(false);
        setShowTransition(true);
      }
    } catch (err: unknown) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      const clerkErr = err as ClerkError;
      const errorMessage =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        'Code de vérification invalide';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySecondFactor = async () => {
    if (!isSignInLoaded || !signIn) return;

    setIsLoading(true);
    try {
      const result = await signIn.attemptSecondFactor({
        strategy: secondFactorStrategy,
        code: verificationCode,
      });

      if (result.status === 'complete') {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        await setActive!({ session: result.createdSessionId });
        setPendingSecondFactor(false);
        setVerificationCode('');
        // Profile will be setup by the useEffect when clerkUser becomes available
        setTransitionRole(selectedRole);
        setIsRoleSwitch(false);
        setShowTransition(true);
      } else {
        Alert.alert('Erreur', `Statut inattendu: ${result.status}`);
      }
    } catch (err: unknown) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      const clerkErr = err as ClerkError;
      const errorMessage =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        'Code de vérification invalide';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Mot de passe oublié ---
  const handleForgotPassword = async () => {
    const email = formData.email.trim();
    if (!email) {
      Alert.alert('Erreur', 'Veuillez d\'abord entrer votre email');
      return;
    }
    if (!isSignInLoaded || !signIn) {
      Alert.alert('Erreur', 'Le service d\'authentification n\'est pas encore prêt.');
      return;
    }

    setIsLoading(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      });
      setVerificationCode('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPendingPasswordReset(true);
      Alert.alert('Code envoyé', `Un code de réinitialisation a été envoyé à ${email}. Vérifiez aussi vos spams.`);
    } catch (err: unknown) {
      const clerkErr = err as ClerkError;
      const errorMessage =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        'Une erreur est survenue';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Vérifie le code ET change le mot de passe en un seul appel
  const handleResetPassword = async () => {
    if (verificationCode.length < 6) {
      Alert.alert('Erreur', 'Veuillez entrer le code à 6 chiffres');
      return;
    }
    if (!newPassword) {
      Alert.alert('Erreur', 'Veuillez entrer un nouveau mot de passe');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }
    if (!isSignInLoaded || !signIn) return;

    setIsLoading(true);
    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: verificationCode,
        password: newPassword,
      });

      if (result.status === 'complete') {
        if (Platform.OS === 'ios') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        await setActive!({ session: result.createdSessionId });
        setPendingPasswordReset(false);
        setNewPassword('');
        setConfirmNewPassword('');
        setVerificationCode('');
        setTransitionRole(selectedRole);
        setIsRoleSwitch(false);
        setShowTransition(true);
      } else if (result.status === 'needs_second_factor') {
        setPendingPasswordReset(false);
        setNewPassword('');
        setConfirmNewPassword('');
        const supported = result.supportedSecondFactors;
        const emailFactor = supported?.find((f: ClerkSecondFactor) => f.strategy === 'email_code');
        const phoneFactor = supported?.find((f: ClerkSecondFactor) => f.strategy === 'phone_code');
        const hasTotp = supported?.some((f: ClerkSecondFactor) => f.strategy === 'totp');
        if (emailFactor && 'emailAddressId' in emailFactor) {
          setSecondFactorStrategy('email_code');
          await signIn.prepareSecondFactor({
            strategy: 'email_code',
            emailAddressId: emailFactor.emailAddressId,
          } as Parameters<NonNullable<typeof signIn>['prepareSecondFactor']>[0]);
        } else if (phoneFactor) {
          setSecondFactorStrategy('phone_code');
          await signIn.prepareSecondFactor({ strategy: 'phone_code' });
        } else if (hasTotp) {
          setSecondFactorStrategy('totp');
        }
        setVerificationCode('');
        setPendingSecondFactor(true);
      }
    } catch (err: unknown) {
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      const clerkErr = err as ClerkError;
      const errorMessage =
        clerkErr?.errors?.[0]?.longMessage ||
        clerkErr?.errors?.[0]?.message ||
        'Code invalide ou mot de passe trop faible';
      Alert.alert('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransitionComplete = () => {
    setShowTransition(false);
    router.replace('/(protected)/(tabs)');
  };

  // 'camionnette' is retained in VEHICLE_TYPES for legacy DB rows but is no
  // longer offered at signup — filter it out of the visible options.
  const vehicleOptions = Object.values(VEHICLE_TYPES).filter((v) => v.type !== 'camionnette');
  const accommodationOptions = Object.values(ACCOMMODATION_TYPES);

  const codeDigits = verificationCode.split('');

  // --- Écran de réinitialisation du mot de passe ---
  if (pendingPasswordReset) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Image source={SPLASH_IMAGE} style={styles.bgImage} />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.75)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex1}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.verificationScrollContent}
            keyboardShouldPersistTaps="handled">
            <Text style={styles.verificationTitle}>Réinitialisation</Text>
            <Text style={styles.verificationSubtitle}>
              Un code a été envoyé à{'\n'}
              <Text style={styles.verificationEmail}>{formData.email.trim()}</Text>
            </Text>

            <View style={styles.card}>
              <LinearGradient
                colors={[ACCENT, GOLD]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardAccentBar}
              />

              {/* Code — hidden input + visual boxes */}
              <Text style={styles.sectionLabel}>Code de vérification</Text>
              <Pressable
                onPress={() => resetCodeInputRef.current?.focus()}
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
              <TextInput
                ref={resetCodeInputRef}
                value={verificationCode}
                onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={styles.hiddenInput}
              />

              {/* Nouveau mot de passe */}
              <Text style={[styles.sectionLabel, { marginTop: 16 }]}>Nouveau mot de passe</Text>
              <View style={styles.fieldGroup}>
                <Pressable
                  onPress={() => newPasswordRef.current?.focus()}
                  style={[
                    styles.inputContainer,
                    focusedField === 'newPassword' && styles.inputFocused,
                  ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />
                  <TextInput
                    ref={newPasswordRef}
                    placeholder="Nouveau mot de passe"
                    placeholderTextColor={COLORS.gray[400]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewResetPassword}
                    onFocus={() => setFocusedField('newPassword')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => setShowNewResetPassword(!showNewResetPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons
                      name={showNewResetPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.gray[400]}
                    />
                  </TouchableOpacity>
                </Pressable>
              </View>

              <View style={styles.fieldGroup}>
                <Pressable
                  style={[
                    styles.inputContainer,
                    focusedField === 'confirmNewPassword' && styles.inputFocused,
                  ]}>
                  <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray[400]} />
                  <TextInput
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor={COLORS.gray[400]}
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    secureTextEntry={!showConfirmResetPassword}
                    onFocus={() => setFocusedField('confirmNewPassword')}
                    onBlur={() => setFocusedField(null)}
                    style={styles.input}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <Ionicons
                      name={showConfirmResetPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.gray[400]}
                    />
                  </TouchableOpacity>
                </Pressable>
              </View>

              {/* Bouton réinitialiser */}
              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={isLoading}
                activeOpacity={0.85}
                style={isLoading ? styles.buttonDisabled : undefined}>
                <LinearGradient
                  colors={[ACCENT, '#065F46']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButton}>
                  {isLoading ? (
                    <View style={styles.submitLoadingRow}>
                      <ActivityIndicator color={COLORS.white} size="small" />
                      <Text style={styles.submitText}>Chargement...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitText}>Réinitialiser</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Renvoyer le code */}
              <TouchableOpacity
                onPress={() => {
                  setPendingPasswordReset(false);
                  setVerificationCode('');
                  setTimeout(() => handleForgotPassword(), 100);
                }}
                style={styles.resendButton}>
                <Text style={styles.resendText}>Renvoyer le code</Text>
              </TouchableOpacity>

              {/* Retour */}
              <TouchableOpacity
                onPress={() => {
                  setPendingPasswordReset(false);
                  setVerificationCode('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                style={styles.backButton}>
                <Ionicons name="arrow-back" size={16} color={COLORS.gray[500]} />
                <Text style={styles.backText}>Retour à la connexion</Text>
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

  // --- Écran de vérification 2FA ---
  if (pendingSecondFactor) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <Image source={SPLASH_IMAGE} style={styles.bgImage} />
          <LinearGradient
            colors={['rgba(0, 0, 0, 0.05)', 'rgba(0, 0, 0, 0.35)', 'rgba(0, 0, 0, 0.75)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.flex1}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.verificationScrollContent}
            keyboardShouldPersistTaps="handled">
            <Text style={styles.verificationTitle}>Vérification 2FA</Text>
            <Text style={styles.verificationSubtitle}>
              {secondFactorStrategy === 'email_code'
                ? `Un code a été envoyé à\n`
                : secondFactorStrategy === 'phone_code'
                ? 'Un code a été envoyé par SMS\nà votre numéro de téléphone'
                : 'Entrez le code à 6 chiffres de votre\napp (Google Authenticator, Authy...)'}
            </Text>
            {secondFactorStrategy === 'email_code' && (
              <Text style={[styles.verificationSubtitle, { marginTop: -20 }]}>
                <Text style={styles.verificationEmail}>{formData.email.trim()}</Text>
              </Text>
            )}

            <View style={styles.card}>
              <LinearGradient
                colors={[ACCENT, GOLD]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.cardAccentBar}
              />

              {/* Visual code boxes */}
              <Pressable
                onPress={() => secondFactorInputRef.current?.focus()}
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

              <TextInput
                ref={secondFactorInputRef}
                value={verificationCode}
                onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={styles.hiddenInput}
              />

              <TouchableOpacity
                onPress={handleVerifySecondFactor}
                disabled={isLoading || verificationCode.length < 6}
                activeOpacity={0.85}
                style={isLoading || verificationCode.length < 6 ? styles.buttonDisabled : undefined}>
                <LinearGradient
                  colors={[ACCENT, '#065F46']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButton}>
                  {isLoading ? (
                    <View style={styles.submitLoadingRow}>
                      <ActivityIndicator color={COLORS.white} size="small" />
                      <Text style={styles.submitText}>Vérification...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitText}>Vérifier</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {(secondFactorStrategy === 'phone_code' || secondFactorStrategy === 'email_code') && (
                <TouchableOpacity
                  onPress={async () => {
                    if (signIn) {
                      try {
                        const factor = signIn.supportedSecondFactors?.find(
                          (f: ClerkSecondFactor) => f.strategy === 'email_code'
                        ) as ClerkSecondFactor | undefined;
                        await signIn.prepareSecondFactor({
                          strategy: secondFactorStrategy,
                          ...(secondFactorStrategy === 'email_code' && factor?.emailAddressId ? {
                            emailAddressId: factor.emailAddressId,
                          } : {}),
                        } as Parameters<NonNullable<typeof signIn>['prepareSecondFactor']>[0]);
                        Alert.alert('Succès', 'Un nouveau code a été envoyé');
                      } catch {
                        Alert.alert('Erreur', 'Impossible de renvoyer le code');
                      }
                    }
                  }}
                  style={styles.resendButton}>
                  <Text style={styles.resendText}>Renvoyer le code</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => {
                  setPendingSecondFactor(false);
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

              <TextInput
                ref={verificationInputRef}
                value={verificationCode}
                onChangeText={(text) => setVerificationCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                style={styles.hiddenInput}
              />

              {/* Submit button */}
              <TouchableOpacity
                onPress={handleVerifyEmail}
                disabled={isLoading || verificationCode.length < 6}
                activeOpacity={0.85}
                style={isLoading || verificationCode.length < 6 ? styles.buttonDisabled : undefined}>
                <LinearGradient
                  colors={[ACCENT, '#065F46']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButton}>
                  {isLoading ? (
                    <View style={styles.submitLoadingRow}>
                      <ActivityIndicator color={COLORS.white} size="small" />
                      <Text style={styles.submitText}>Vérification...</Text>
                    </View>
                  ) : (
                    <Text style={styles.submitText}>Vérifier</Text>
                  )}
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
            {/* Card */}
            <Animated.View
              entering={FadeInUp.duration(600).delay(100).springify().damping(18)}
              style={styles.cardContainer}>
              <Animated.View
                layout={LinearTransition.springify().damping(22)}
                style={styles.card}>
                {/* Boarding-pass brand strip — solid color per selected role */}
                <View
                  style={[
                    styles.brandStrip,
                    {
                      backgroundColor:
                        selectedRole === 'chauffeur'
                          ? GOLD
                          : selectedRole === 'hebergeur'
                          ? VIOLET
                          : selectedRole === 'agence'
                          ? TEAL
                          : ACCENT,
                    },
                  ]}>
                  <Text style={styles.brandStripTitle}>ZOPGO PASS</Text>
                  <Text style={styles.brandStripCaption}>
                    {isLogin ? 'Embarquement' : 'Inscription'}
                  </Text>
                </View>
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
                        size={16}
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
                        size={16}
                        color={selectedRole === 'chauffeur' ? GOLD : COLORS.gray[400]}
                      />
                      <Text
                        style={[
                          styles.rolePillText,
                          selectedRole === 'chauffeur' ? styles.rolePillTextActiveChauffeur : styles.rolePillTextInactive,
                        ]}>
                        Transporteur
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRoleChange('hebergeur')}
                      style={[
                        styles.rolePill,
                        selectedRole === 'hebergeur' ? styles.rolePillActiveHebergeur : styles.rolePillInactive,
                      ]}>
                      <Ionicons
                        name="bed"
                        size={16}
                        color={selectedRole === 'hebergeur' ? VIOLET : COLORS.gray[400]}
                      />
                      <Text
                        style={[
                          styles.rolePillText,
                          selectedRole === 'hebergeur' ? styles.rolePillTextActiveHebergeur : styles.rolePillTextInactive,
                        ]}>
                        Hébergeur
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleRoleChange('agence')}
                      style={[
                        styles.rolePill,
                        selectedRole === 'agence' ? styles.rolePillActiveAgence : styles.rolePillInactive,
                      ]}>
                      <Ionicons
                        name="business"
                        size={16}
                        color={selectedRole === 'agence' ? TEAL : COLORS.gray[400]}
                      />
                      <Text
                        style={[
                          styles.rolePillText,
                          selectedRole === 'agence' ? styles.rolePillTextActiveAgence : styles.rolePillTextInactive,
                        ]}>
                        Agence
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Champ code d'invitation agence */}
                {selectedRole === 'agence' && !isLogin && (
                  <View style={styles.agencyCodeSection}>
                    <Text style={styles.sectionLabel}>Code d&apos;invitation agence</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        focusedField === 'agencyCode' && styles.inputFocused,
                        agencyClaimError && styles.inputError,
                      ]}>
                      <Ionicons name="key" size={16} color={TEAL} />
                      <TextInput
                        style={styles.input}
                        placeholder="ZOPGO-AGENCE-XXXX"
                        placeholderTextColor={COLORS.gray[400]}
                        value={agencyCode}
                        onChangeText={(t) => {
                          setAgencyCode(t.toUpperCase());
                          if (agencyClaimError) setAgencyClaimError(null);
                        }}
                        onFocus={() => setFocusedField('agencyCode')}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="characters"
                        autoCorrect={false}
                      />
                    </View>
                    <Text style={styles.agencyCodeHint}>
                      Le code t&apos;a été remis par ZopGo lors de la signature du partenariat. Il ne peut servir qu&apos;une seule fois.
                    </Text>
                    {agencyClaimError && (
                      <Text style={styles.agencyCodeError}>{agencyClaimError}</Text>
                    )}
                  </View>
                )}

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

                {/* Sélecteur de type d'hébergement (hébergeur) */}
                {selectedRole === 'hebergeur' && (
                  <View style={styles.vehicleSection}>
                    <Text style={styles.sectionLabel}>{"Type d'hébergement"}</Text>
                    <View style={styles.vehicleRow}>
                      {accommodationOptions.map((accommodation) => (
                        <TouchableOpacity
                          key={accommodation.type}
                          onPress={() => setSelectedAccommodation(accommodation.type)}
                          style={[
                            styles.vehicleChip,
                            selectedAccommodation === accommodation.type
                              ? styles.accommodationChipActive
                              : styles.vehicleChipInactive,
                          ]}>
                          <Text style={styles.vehicleIcon}>{accommodation.icon}</Text>
                          <Text
                            style={[
                              styles.vehicleLabel,
                              selectedAccommodation === accommodation.type
                                ? styles.accommodationLabelActive
                                : styles.vehicleLabelInactive,
                            ]}>
                            {accommodation.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Boarding-pass perforation: separates "WHO" (role) from
                    "credentials" (email/password) like a ticket coupon. */}
                <View style={styles.perforationRow}>
                  {Array.from({ length: 24 }).map((_, i) => (
                    <View key={i} style={styles.perfDash} />
                  ))}
                </View>

                {/* Friendly error banner — sad icon + warm message */}
                {authErrorMsg && (
                  <Animated.View
                    entering={FadeInDown.springify().damping(15)}
                    style={styles.errorBanner}>
                    <Pressable
                      onPress={() => setAuthErrorMsg(null)}
                      style={styles.errorBannerInner}>
                      <View style={styles.errorIconWrap}>
                        <Ionicons name="sad-outline" size={28} color="#EF4444" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.errorTitle}>Aïe…</Text>
                        <Text style={styles.errorMessage}>{authErrorMsg}</Text>
                      </View>
                      <Ionicons name="close" size={18} color="#B91C1C" />
                    </Pressable>
                  </Animated.View>
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
                      <Ionicons name="person-outline" size={18} color={COLORS.gray[400]} />
                      <TextInput
                        ref={nameRef}
                        placeholder="Nom complet"
                        placeholderTextColor={COLORS.gray[400]}
                        value={formData.name}
                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        autoCapitalize="words"
                        autoComplete="name"
                        textContentType="name"
                        returnKeyType="next"
                        onSubmitEditing={() => emailRef.current?.focus()}
                        blurOnSubmit={false}
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
                    <Ionicons name="mail-outline" size={18} color={COLORS.gray[400]} />
                    <TextInput
                      ref={emailRef}
                      placeholder="votre.email@example.com"
                      placeholderTextColor={COLORS.gray[400]}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                      blurOnSubmit={false}
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
                    <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray[400]} />
                    <TextInput
                      ref={passwordRef}
                      placeholder="Mot de passe"
                      placeholderTextColor={COLORS.gray[400]}
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      textContentType={isLogin ? 'password' : 'newPassword'}
                      returnKeyType={isLogin ? 'done' : 'next'}
                      onSubmitEditing={() => {
                        if (isLogin) {
                          handleSubmit();
                        } else {
                          confirmPasswordRef.current?.focus();
                        }
                      }}
                      blurOnSubmit={isLogin}
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

                {/* Password strength (sign-up only) */}
                {!isLogin && formData.password.length > 0 && (
                  <Animated.View
                    entering={FadeIn.duration(200)}
                    style={styles.strengthContainer}>
                    <View style={styles.strengthBarTrack}>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <View
                          key={i}
                          style={[
                            styles.strengthSegment,
                            {
                              backgroundColor:
                                i < passwordStrength.score
                                  ? passwordStrength.color
                                  : COLORS.gray[200],
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                      {passwordStrength.label}
                    </Text>
                  </Animated.View>
                )}

                {/* Confirm Password (only for register) */}
                {!isLogin && (
                  <View style={styles.fieldGroup}>
                    <Pressable
                      onPress={() => confirmPasswordRef.current?.focus()}
                      style={[
                        styles.inputContainer,
                        focusedField === 'confirmPassword' && styles.inputFocused,
                      ]}>
                      <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray[400]} />
                      <TextInput
                        ref={confirmPasswordRef}
                        placeholder="Confirmer le mot de passe"
                        placeholderTextColor={COLORS.gray[400]}
                        value={formData.confirmPassword}
                        onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="new-password"
                        textContentType="newPassword"
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
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

                {/* Forgot password (login only) */}
                {isLogin && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    disabled={isLoading}
                    style={styles.forgotPasswordButton}>
                    <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                  </TouchableOpacity>
                )}

                {/* Submit Button — solid brand blue with arrow node (boarding-pass CTA) */}
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={isLoading}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={isLogin ? 'Se connecter' : 'Créer le compte'}
                  accessibilityState={{ disabled: isLoading }}
                  style={[styles.submitTouchable, isLoading && styles.buttonDisabled]}>
                  <View style={styles.submitButton}>
                    {isLoading ? (
                      <View style={styles.submitLoadingRow}>
                        <ActivityIndicator color={COLORS.white} size="small" />
                        <Text style={styles.submitText}>CHARGEMENT…</Text>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.submitText}>
                          {(isLogin ? 'Se connecter' : 'Créer le compte').toUpperCase()}
                        </Text>
                        <View style={styles.submitArrowCircle}>
                          <Ionicons name="arrow-forward" size={16} color={ACCENT} />
                        </View>
                      </>
                    )}
                  </View>
                </TouchableOpacity>

                {/* Separator */}
                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>ou</Text>
                  <View style={styles.separatorLine} />
                </View>

                {/* Toggle */}
                <TouchableOpacity onPress={handleToggleMode} style={styles.toggleButton}>
                  <Text style={styles.toggleText}>
                    {isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? '}
                    <Text style={styles.toggleTextBold}>
                      {isLogin ? 'Créer un compte' : 'Se connecter'}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            </Animated.View>
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
    paddingBottom: 12,
  },
  verificationScrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    paddingBottom: 8,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 2,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  cardContainer: {
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 22,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 14,
    overflow: 'hidden',
    boxShadow: '0 16px 36px rgba(0, 0, 0, 0.22)',
  },
  // Legacy gradient strip — still used by the verification / 2FA /
  // password-reset modal cards (those screens haven't been re-skinned
  // yet). Kept here so they compile.
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
  brandStrip: {
    marginHorizontal: -14,
    marginTop: -14,
    marginBottom: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandStripTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1.6,
  },
  brandStripCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.92)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -2,
    marginVertical: 10,
  },
  perfDash: {
    flex: 1,
    height: 1.5,
    marginRight: 4,
    borderRadius: 0.75,
    backgroundColor: '#E5E7EB',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray[700],
    marginBottom: 6,
  },
  roleSection: {
    marginBottom: 10,
  },
  roleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 2,
  },
  rolePillActive: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(33, 98, 254, 0.12)',
    boxShadow: `0 2px 6px ${ACCENT}26`,
  },
  rolePillInactive: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  rolePillTextActive: {
    color: ACCENT,
  },
  rolePillActiveChauffeur: {
    borderColor: GOLD,
    backgroundColor: 'rgba(232, 168, 50, 0.15)',
    boxShadow: `0 2px 6px ${GOLD}26`,
  },
  rolePillTextActiveChauffeur: {
    color: GOLD,
  },
  rolePillActiveHebergeur: {
    borderColor: VIOLET,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    boxShadow: `0 2px 6px ${VIOLET}26`,
  },
  rolePillTextActiveHebergeur: {
    color: VIOLET,
  },
  rolePillActiveAgence: {
    borderColor: TEAL,
    backgroundColor: 'rgba(13, 148, 136, 0.15)',
    boxShadow: `0 2px 6px ${TEAL}26`,
  },
  rolePillTextActiveAgence: {
    color: TEAL,
  },
  rolePillTextInactive: {
    color: COLORS.gray[500],
  },
  agencyCodeSection: {
    marginBottom: 10,
  },
  agencyCodeHint: {
    marginTop: 6,
    fontSize: 11,
    color: COLORS.gray[500],
    lineHeight: 15,
  },
  agencyCodeError: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  vehicleSection: {
    marginBottom: 10,
  },
  vehicleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  vehicleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  vehicleChipActive: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(33, 98, 254, 0.12)',
  },
  vehicleChipInactive: {
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  vehicleIcon: {
    fontSize: 14,
  },
  vehicleLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  vehicleLabelActive: {
    color: ACCENT,
  },
  vehicleLabelInactive: {
    color: COLORS.gray[500],
  },
  accommodationChipActive: {
    borderColor: VIOLET,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  accommodationLabelActive: {
    color: VIOLET,
  },
  errorBanner: {
    marginBottom: 12,
  },
  errorBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  errorIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#991B1B',
  },
  errorMessage: {
    fontSize: 13,
    color: '#7F1D1D',
    marginTop: 2,
  },
  fieldGroup: {
    marginBottom: 7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  inputFocused: {
    borderColor: ACCENT,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    boxShadow: `0 0 8px ${ACCENT}26`,
  },
  inputError: {
    borderColor: '#DC2626',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.gray[900],
    marginLeft: 10,
  },
  submitTouchable: {
    marginTop: 6,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    borderRadius: 16,
    borderCurve: 'continuous',
    paddingVertical: 14,
    paddingHorizontal: 16,
    boxShadow: `0 8px 18px ${ACCENT}66`,
  },
  submitLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  submitText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginRight: 12,
  },
  submitArrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthContainer: {
    marginTop: -4,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  strengthBarTrack: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 4,
  },
  strengthSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
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
    fontSize: 13,
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
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: 1,
    width: 1,
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 4,
    paddingVertical: 2,
  },
  forgotPasswordText: {
    fontSize: 12,
    fontWeight: '600',
    color: ACCENT,
  },
});
