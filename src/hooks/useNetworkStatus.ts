import { useEffect, useState } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const state = await Network.getNetworkStateAsync();
        if (mounted) {
          setIsConnected(state.isConnected ?? true);
        }
      } catch {
        // Assume connected if check fails
        if (mounted) setIsConnected(true);
      }
    };

    check();
    // Poll every 10s (expo-network doesn't have a listener API like netinfo)
    const interval = setInterval(check, 10_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return isConnected;
}

/**
 * One-shot check (for use outside React components, e.g. in stores)
 */
export async function checkNetwork(): Promise<boolean> {
  try {
    const state = await Network.getNetworkStateAsync();
    return state.isConnected ?? true;
  } catch {
    return true;
  }
}
