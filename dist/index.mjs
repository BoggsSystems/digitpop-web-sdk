import {
  ApiClient,
  DigitPopClient,
  GatewayModal,
  WebSocketClient
} from "./chunk-ZRRAVYRJ.mjs";

// src/index.ts
function createDigitPop(config) {
  return new DigitPopClient(config);
}
if (typeof window !== "undefined") {
  window.DigitPopSDK = {
    DigitPopClient,
    createDigitPop
  };
}
var src_default = DigitPopClient;
export {
  ApiClient,
  DigitPopClient,
  GatewayModal,
  WebSocketClient,
  createDigitPop,
  src_default as default
};
//# sourceMappingURL=index.mjs.map