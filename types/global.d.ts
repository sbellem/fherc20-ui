import type { initFhevm, createInstance, createTFHEKey } from 'fhevmjs/lib/web';

declare global {
  interface Window {
    fhevm: {
      initFhevm: typeof initFhevm;
      createInstance: typeof createInstance;
      createTFHEKey: typeof createTFHEKey;
    };
    ethereum: any;
  }
}
