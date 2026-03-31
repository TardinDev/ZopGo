#!/bin/bash

# Script pour configurer les secrets EAS Build
# Usage: ./scripts/setup-eas-secrets.sh

set -e

echo "🔐 Configuration des secrets EAS Build pour ZopGo"
echo "=================================================="
echo ""

# Vérifier si EAS CLI est installé
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI n'est pas installé. Installation..."
    npm install -g eas-cli
fi

# Vérifier si l'utilisateur est connecté
echo "🔍 Vérification de la connexion EAS..."
if ! eas whoami &> /dev/null; then
    echo "📝 Connexion à EAS..."
    eas login
fi

echo ""
echo "📋 Vérification des secrets existants..."
echo "========================================"
eas secret:list

echo ""
echo "🔑 Configuration des secrets manquants..."
echo "=========================================="

# Fonction pour créer ou mettre à jour un secret
configure_secret() {
    local secret_name=$1
    local secret_description=$2
    local is_required=$3

    echo ""
    echo "📝 $secret_description"

    # Vérifier si le secret existe déjà
    if eas secret:list | grep -q "$secret_name"; then
        read -p "Le secret '$secret_name' existe déjà. Voulez-vous le mettre à jour? (o/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Oo]$ ]]; then
            read -p "Nouvelle valeur pour $secret_name: " secret_value
            if [ ! -z "$secret_value" ]; then
                eas secret:delete --scope project --name "$secret_name" --non-interactive
                eas secret:create --scope project --name "$secret_name" --value "$secret_value"
                echo "✅ Secret '$secret_name' mis à jour"
            fi
        else
            echo "⏭️  Secret '$secret_name' ignoré"
        fi
    else
        if [ "$is_required" = "true" ]; then
            echo "⚠️  OBLIGATOIRE - L'app crashera sans ce secret !"
        fi

        read -p "Valeur pour $secret_name (laissez vide pour ignorer): " secret_value

        if [ ! -z "$secret_value" ]; then
            eas secret:create --scope project --name "$secret_name" --value "$secret_value"
            echo "✅ Secret '$secret_name' créé"
        else
            if [ "$is_required" = "true" ]; then
                echo "❌ ERREUR: Ce secret est OBLIGATOIRE !"
                return 1
            else
                echo "⏭️  Secret '$secret_name' ignoré"
            fi
        fi
    fi
}

# Configurer les secrets
configure_secret "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" "Clé Clerk (pk_live_... pour production)" "true"
configure_secret "EXPO_PUBLIC_SUPABASE_URL" "URL Supabase" "true"
configure_secret "EXPO_PUBLIC_SUPABASE_ANON_KEY" "Clé anonyme Supabase" "true"
configure_secret "EXPO_PUBLIC_GEMINI_API_KEY" "Clé API Google Gemini (optionnel)" "false"

echo ""
echo "📋 Secrets configurés :"
echo "======================="
eas secret:list

echo ""
echo "✅ Configuration terminée !"
echo ""
echo "🚀 Vous pouvez maintenant builder l'app :"
echo "   - Preview APK : eas build --profile preview --platform android"
echo "   - Production AAB : eas build --profile production --platform android"
