<template>
  <div v-if="loading">
    Please wait...
  </div>
  <div v-else style="display: flex; flex-direction: column; align-items: center">
    Welcome!
    <button @click="encrypt(10)" style="width: 100px">Encrypt</button>
    <div v-if="encryptedNumber !== ''" style="width: 500px; overflow-wrap: break-word">
      {{  encryptedNumber }}
    </div>
    <button @click="decrypt()" style="width: 100px">Decrypt</button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { BrowserProvider } from 'ethers';
import { FhevmInstance } from 'fhevmjs';

const CHAIN_ID = 5432;

var provider : BrowserProvider;

function toHexString(byteArray: Uint8Array) {
  return Array.from(byteArray, byte => {
    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
  }).join('');
}

export default defineComponent({
  name: 'App',
  components: {},
  setup() {
    const instance = ref<FhevmInstance | undefined>(undefined);
    return { instance };
  },
  data() {
    return {
      loading: true,
      encryptedNumber: "",
      decryptNumber: ""
    };
  },
  mounted() {
    var self = this;
    const initInstance = async () => {
      const chainIdHex = await window.ethereum.request({ method: 'eth_chainId' });
      provider = new BrowserProvider((global as any).ethereum);
      let publicKey = localStorage.getItem('fhepubkey');
      if (!publicKey) {
        publicKey = await provider.call({ from: null, to: '0x0000000000000000000000000000000000000044' });
        localStorage.setItem('fhepubkey', publicKey);
      }
      const chainId = parseInt(chainIdHex, 16);
      
      if (chainId !== CHAIN_ID) throw new Error(`Invalid port ${chainId}`);
      return window.fhevm.createInstance({ chainId, publicKey });
    };

    this.loadScript('static/fhevm.min.js', () => {
      window.fhevm.initFhevm().then( async () => {
        this.loading = false;
        self.instance = await initInstance();

      }).catch( (err: any) => {
        console.log(err);
      });
    });
  },
  methods: {
    encrypt(num: number) {
      if (this.instance) {
        this.encryptedNumber = `0x` + toHexString(this.instance.encrypt32(num));
      }
    },
    async decrypt() {
      if (this.instance) {
        try {
          // interact with contract here
        } catch (err) {
          console.log(err);
        }
      }
    },
  }
});
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
