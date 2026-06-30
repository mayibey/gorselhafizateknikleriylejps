// aes-js resmi tip paketi yok — saf-JS AES (CTR) için minimal bildirim.
declare module 'aes-js' {
  export class Counter {
    constructor(initialValue?: number | Uint8Array);
  }
  namespace ModeOfOperation {
    class ctr {
      constructor(key: Uint8Array | number[], counter?: Counter);
      encrypt(plaintext: Uint8Array | number[]): Uint8Array;
      decrypt(ciphertext: Uint8Array | number[]): Uint8Array;
    }
  }
  const _default: {
    Counter: typeof Counter;
    ModeOfOperation: { ctr: typeof ModeOfOperation.ctr };
  };
  export default _default;
}
