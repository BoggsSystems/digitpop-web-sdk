import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { DigitPopClient } from '../core/DigitPopClient';
import { DigitPopConfig, WalletBalance } from '../types';

export interface DigitPopContextValue {
  client: DigitPopClient | null;
  isReady: boolean;
  walletBalance: WalletBalance | null;
  refreshBalance: () => Promise<void>;
  openGateway: (options?: Parameters<DigitPopClient['openGateway']>[0]) => void;
  closeGateway: () => void;
}

const DigitPopContext = createContext<DigitPopContextValue>({
  client: null,
  isReady: false,
  walletBalance: null,
  refreshBalance: async () => {},
  openGateway: () => {},
  closeGateway: () => {},
});

export interface DigitPopProviderProps {
  config: DigitPopConfig;
  children: React.ReactNode;
}

export const DigitPopProvider: React.FC<DigitPopProviderProps> = ({ config, children }) => {
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isReady, setIsReady] = useState(false);

  const client = useMemo(() => {
    try {
      return new DigitPopClient(config);
    } catch (err) {
      console.error('[DigitPop SDK Provider] Initialization error:', err);
      return null;
    }
  }, [config.publicKey, config.userId, config.environment, config.apiUrl]);

  const refreshBalance = async () => {
    if (!client) return;
    try {
      const b = await client.getWalletBalance();
      setWalletBalance(b);
    } catch (err) {
      console.warn('[DigitPop SDK Provider] Failed to refresh wallet balance:', err);
    }
  };

  useEffect(() => {
    if (client) {
      setIsReady(true);
      refreshBalance();
    }
    return () => {
      if (client) client.destroy();
    };
  }, [client]);

  const value = useMemo<DigitPopContextValue>(
    () => ({
      client,
      isReady,
      walletBalance,
      refreshBalance,
      openGateway: (opts) => client?.openGateway(opts),
      closeGateway: () => client?.closeGateway(),
    }),
    [client, isReady, walletBalance]
  );

  return <DigitPopContext.Provider value={value}>{children}</DigitPopContext.Provider>;
};

export const useDigitPop = (): DigitPopContextValue => {
  const ctx = useContext(DigitPopContext);
  if (!ctx) {
    throw new Error('useDigitPop must be used within a <DigitPopProvider>');
  }
  return ctx;
};
