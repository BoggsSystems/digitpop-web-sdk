import React from 'react';
import { a as DigitPopClient, W as WalletBalance, D as DigitPopConfig, O as OpenGatewayOptions } from '../DigitPopClient-DIASkMHd.mjs';

interface DigitPopContextValue {
    client: DigitPopClient | null;
    isReady: boolean;
    walletBalance: WalletBalance | null;
    refreshBalance: () => Promise<void>;
    openGateway: (options?: Parameters<DigitPopClient['openGateway']>[0]) => void;
    closeGateway: () => void;
}
interface DigitPopProviderProps {
    config: DigitPopConfig;
    children: React.ReactNode;
}
declare const DigitPopProvider: React.FC<DigitPopProviderProps>;
declare const useDigitPop: () => DigitPopContextValue;

interface DigitPopGatewayProps extends OpenGatewayOptions {
    isOpen: boolean;
}
declare const DigitPopGateway: React.FC<DigitPopGatewayProps>;

export { type DigitPopContextValue, DigitPopGateway, type DigitPopGatewayProps, DigitPopProvider, type DigitPopProviderProps, useDigitPop };
