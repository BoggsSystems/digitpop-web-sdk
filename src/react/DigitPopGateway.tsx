import React, { useEffect } from 'react';
import { useDigitPop } from './DigitPopProvider';
import { OpenGatewayOptions } from '../types';

export interface DigitPopGatewayProps extends OpenGatewayOptions {
  isOpen: boolean;
}

export const DigitPopGateway: React.FC<DigitPopGatewayProps> = ({
  isOpen,
  onClose,
  ...gatewayOptions
}) => {
  const { openGateway, closeGateway } = useDigitPop();

  useEffect(() => {
    if (isOpen) {
      openGateway({
        ...gatewayOptions,
        onClose: () => {
          if (onClose) onClose();
        },
      });
    } else {
      closeGateway();
    }
    return () => {
      closeGateway();
    };
  }, [isOpen]);

  return null; // The modal renders cleanly into its own isolated Shadow DOM root
};
