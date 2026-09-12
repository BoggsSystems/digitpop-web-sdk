import {
  DigitPopClient
} from "../chunk-ZRRAVYRJ.mjs";

// src/react/DigitPopProvider.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { jsx } from "react/jsx-runtime";
var DigitPopContext = createContext({
  client: null,
  isReady: false,
  walletBalance: null,
  refreshBalance: async () => {
  },
  openGateway: () => {
  },
  closeGateway: () => {
  }
});
var DigitPopProvider = ({ config, children }) => {
  const [walletBalance, setWalletBalance] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const client = useMemo(() => {
    try {
      return new DigitPopClient(config);
    } catch (err) {
      console.error("[DigitPop SDK Provider] Initialization error:", err);
      return null;
    }
  }, [config.publicKey, config.userId, config.environment, config.apiUrl]);
  const refreshBalance = async () => {
    if (!client) return;
    try {
      const b = await client.getWalletBalance();
      setWalletBalance(b);
    } catch (err) {
      console.warn("[DigitPop SDK Provider] Failed to refresh wallet balance:", err);
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
  const value = useMemo(
    () => ({
      client,
      isReady,
      walletBalance,
      refreshBalance,
      openGateway: (opts) => client?.openGateway(opts),
      closeGateway: () => client?.closeGateway()
    }),
    [client, isReady, walletBalance]
  );
  return /* @__PURE__ */ jsx(DigitPopContext.Provider, { value, children });
};
var useDigitPop = () => {
  const ctx = useContext(DigitPopContext);
  if (!ctx) {
    throw new Error("useDigitPop must be used within a <DigitPopProvider>");
  }
  return ctx;
};

// src/react/DigitPopGateway.tsx
import { useEffect as useEffect2 } from "react";
var DigitPopGateway = ({
  isOpen,
  onClose,
  ...gatewayOptions
}) => {
  const { openGateway, closeGateway } = useDigitPop();
  useEffect2(() => {
    if (isOpen) {
      openGateway({
        ...gatewayOptions,
        onClose: () => {
          if (onClose) onClose();
        }
      });
    } else {
      closeGateway();
    }
    return () => {
      closeGateway();
    };
  }, [isOpen]);
  return null;
};
export {
  DigitPopGateway,
  DigitPopProvider,
  useDigitPop
};
//# sourceMappingURL=index.mjs.map