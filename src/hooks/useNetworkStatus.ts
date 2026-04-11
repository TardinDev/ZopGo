import { useEffect, useRef, useState } from 'react';
import Constants from 'expo-constants';

/**
 * Détection de connectivité basée uniquement sur un fetch HEAD périodique
 * vers Supabase. On n'utilise PAS expo-network car NWPathMonitor (iOS) et
 * ConnectivityManager (Android) retournent des faux positifs dans plusieurs
 * cas (simulateur iOS, SecurityException Android, path temporairement non
 * satisfait au démarrage, etc).
 *
 * Politique :
 *  - Démarrage optimiste (on suppose qu'on est en ligne)
 *  - Check toutes les 30s + check immédiat au montage
 *  - Il faut 2 échecs consécutifs pour passer en offline (évite les faux
 *    positifs ponctuels de latence réseau)
 *  - 1 seul succès suffit pour repasser en ligne
 */

const REACHABILITY_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  'https://www.google.com';

const CHECK_INTERVAL_MS = 30_000;
const FETCH_TIMEOUT_MS = 5_000;
const FAILURES_BEFORE_OFFLINE = 2;

/**
 * Fait un vrai fetch HEAD pour vérifier la connectivité.
 * Retourne true si le serveur répond (peu importe le status HTTP),
 * false seulement si le fetch échoue (DNS, timeout, network error).
 */
async function pingReachability(): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    await fetch(REACHABILITY_URL, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const failureCountRef = useRef(0);

  useEffect(() => {
    let cancelled = false;

    async function runCheck() {
      const reachable = await pingReachability();
      if (cancelled) return;

      if (reachable) {
        failureCountRef.current = 0;
        setIsConnected(true);
      } else {
        failureCountRef.current += 1;
        if (failureCountRef.current >= FAILURES_BEFORE_OFFLINE) {
          setIsConnected(false);
        }
      }
    }

    // Premier check après un court délai pour éviter le flash au démarrage
    const initialTimeout = setTimeout(runCheck, 2_000);
    const interval = setInterval(runCheck, CHECK_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return isConnected;
}

/**
 * One-shot check pour les stores avant une requête.
 * Fait un seul fetch HEAD — retourne true si joignable, false sinon.
 */
export async function checkNetwork(): Promise<boolean> {
  return pingReachability();
}
