<template>
  <div v-if="loading">
    Please wait...
  </div>
  <div v-else style="display: flex; flex-direction: column; align-items: center">
    Welcome!
    <button @click="refreshBalances()" style="width: 100px">Refresh Balances</button>
    <div style="width: 500px; overflow-wrap: break-word">
      # of tokens: {{ balance }}
    </div>
      <div style="width: 500px; overflow-wrap: break-word">
          # of wrapped tokens: {{  encryptedBalance }}
      </div>
    <button @click="wrap(10)" style="width: 100px">Wrap 10</button>
    <button @click="unwrap(10)" style="width: 100px">Unwrap 10</button>
    <button @click="sendToContract(10)" style="width: 100px">Transfer 10</button>
  </div>
</template>

<script lang="ts">
import {defineComponent, ref} from 'vue';
import { BrowserProvider, ethers } from 'ethers';
import {FhevmInstance} from 'fhevmjs';
import DeployedContract from "../contracts/deployments/localfhenix/WrappingERC20.json";
import {WrappingERC20__factory} from "../contracts/types";

let provider : BrowserProvider;

export default defineComponent({
    name: 'App',
    components: {},
    setup() {
        const instance = ref<FhevmInstance | undefined>(undefined);
        return {instance};
    },
    data() {
        return {
            loading: true,
            encryptedBalance: 0,
            balance: '0',
        };
    },
    mounted() {
        let self = this;
        const initInstance = async () => {

            const chainIdHex = await window.ethereum.request({method: 'eth_chainId'});
            const thisProvider = new ethers.BrowserProvider(window.ethereum)

            let publicKey = localStorage.getItem('fhepubkey');
            if (!publicKey || publicKey === "0x") {
                publicKey = await thisProvider.call({from: null, to: '0x0000000000000000000000000000000000000044'});
                if (publicKey) {
                    localStorage.setItem('fhepubkey', publicKey);
                }
            }
            const chainId = parseInt(chainIdHex, 16);
            return window.fhevm.createInstance({chainId, publicKey});
        };

        this.loadScript('static/fhevm.min.js', () => {
            window.fhevm.initFhevm().then(async () => {
                this.loading = false;
                self.instance = await initInstance();

                this.refreshBalances();

            }).catch((err: any) => {
                console.log(err);
            });
        });
    },
    methods: {
        async wrap (input: number) {
            if (!this.instance) {
                alert("fhe not initialized");
                return;
            }
            const thisProvider = new ethers.BrowserProvider(window.ethereum)
            let signer = await thisProvider.getSigner();
            // @ts-ignore
            const werc20 = WrappingERC20__factory.connect(DeployedContract.address, signer)
            await werc20.wrap(input)
            this.refreshBalances();
        },
        async unwrap (input: number) {
            if (!this.instance) {
                alert("fhe not initialized");
                return;
            }
            const thisProvider = new ethers.BrowserProvider(window.ethereum)

            let signer = await thisProvider.getSigner();
            // @ts-ignore
            const werc20 = WrappingERC20__factory.connect(DeployedContract.address, signer)
            await werc20.unwrap(input);
            this.refreshBalances();
        },

        async sendToContract (input: number) {
            if (!this.instance) {
                alert("fhe not initialized");
                return;
            }
            const thisProvider = new ethers.BrowserProvider(window.ethereum)

            let signer = await thisProvider.getSigner();
            // @ts-ignore
            const werc20 = WrappingERC20__factory.connect(DeployedContract.address, signer)

            let encToSend = await this.instance.encrypt32(input);

            // for example purposes just send to the contract
            await werc20.transferEncrypted(DeployedContract.address, encToSend);
            this.refreshBalances();
        },

        async refreshBalances() {
            await this.getBalance();
            await this.getEncryptedBalance();
        },

        async getBalance() {
            const thisProvider = new ethers.BrowserProvider(window.ethereum)
            let signer = await thisProvider.getSigner();
            // @ts-ignore
            const werc20 = WrappingERC20__factory.connect(DeployedContract.address, signer)
            try {
                let address = await signer.getAddress();
                console.log(`address: ${address}`)
                let balanceFromChain = await werc20.balanceOf(address);
                console.log(`balance: ${balanceFromChain}`)
                this.balance = (await werc20.balanceOf(await signer.getAddress())).toString()
            } catch (e) {
                console.log(`failed to query balance: ${e}`)
                this.balance = '0'
            }
        },

        async getEncryptedBalance(): Promise<number> {
            const thisProvider = new ethers.BrowserProvider(window.ethereum)
            let signer = await thisProvider.getSigner();
            let contractAddress = DeployedContract.address;
            // @ts-ignore
            const werc20 = WrappingERC20__factory.connect(contractAddress, signer)

            if (this.instance) {
                let publicKey = this.instance.getTokenSignature(contractAddress)?.publicKey;
                if (!publicKey) {
                    publicKey = await this.instance.generateToken({verifyingContract: contractAddress}).publicKey;
                }
                try {
                    let encBalance = await werc20.balanceOfEncrypted(publicKey);

                    this.encryptedBalance = this.instance.decrypt(contractAddress, encBalance);
                } catch (e) {

                }
            }

            return 0
        }
    },
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
