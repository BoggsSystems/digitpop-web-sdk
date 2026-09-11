import { describe, it, expect } from 'vitest';
import { DigitPopClient, createDigitPop } from '../src/index';

describe('DigitPop Web Monetization SDK', () => {
  it('throws an error if initialized without a publicKey', () => {
    expect(() => {
      new DigitPopClient({ publicKey: '', userId: 'usr_test_123' });
    }).toThrowError(/publicKey.*required/);
  });

  it('throws an error if initialized without a userId', () => {
    expect(() => {
      new DigitPopClient({ publicKey: 'dp_pub_live_9cc2ef63ae224a66', userId: '' });
    }).toThrowError(/userId.*required/);
  });

  it('initializes cleanly with valid publisher credentials', () => {
    const client = new DigitPopClient({
      publicKey: 'dp_pub_live_9cc2ef63ae224a66',
      userId: 'cand_jeff_001',
      environment: 'staging',
      userMetadata: {
        email: 'jeff_boggs@hotmail.com',
        fullName: 'Jeff Boggs',
      },
    });

    expect(client).toBeDefined();
    expect(client.config.publicKey).toBe('dp_pub_live_9cc2ef63ae224a66');
    expect(client.config.environment).toBe('staging');
    expect(client.api.getBaseUrl()).toBe('https://digitpop-server-staging.up.railway.app');
  });

  it('createDigitPop helper instantiates client correctly', () => {
    const client = createDigitPop({
      publicKey: 'dp_pub_live_9cc2ef63ae224a66',
      userId: 'cand_test_999',
    });

    expect(client).toBeInstanceOf(DigitPopClient);
    expect(client.config.userId).toBe('cand_test_999');
  });

  it('honors custom API URL overrides', () => {
    const client = new DigitPopClient({
      publicKey: 'dp_pub_live_test',
      userId: 'usr_1',
      apiUrl: 'https://custom-gateway.internal.net',
    });

    expect(client.api.getBaseUrl()).toBe('https://custom-gateway.internal.net');
  });
});
