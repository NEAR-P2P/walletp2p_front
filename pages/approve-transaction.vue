<template>
  <div id="approve-transaction" class="d-flex flex-column">
    <!-- <v-alert v-if="error" class="mt-12" type="error">
      {{ error }}
    </v-alert> -->
    <modalInfo
      activator="#more-information-btn"
      title="Detalles de la transacción"
      content-class="approve-transaction-info-modal"
    >
      <v-card class="btn-outlined mb-4 px-4 py-2" style="--bg: var(--secondary); --br: 15px; --ls: normal; --fs: 12px; --fw: 600">
        <h6 class="mb-3" style="--fs: 15px">Tarifas de red</h6>

        <div class="space" style="gap: 20px;">
          <span>Tarifas estimadas</span>
          <span style="--fw: 400">&lt; 0.00001 NEAR</span>
        </div>

        <div class="space" style="gap: 20px;">
          <span>Límite de tarifa</span>
          <span style="--fw: 400">300 Tgas</span>
        </div>
      </v-card>


      <v-card class="btn-outlined px-4 py-2" style="--bg: var(--secondary); --br: 15px; --ls: normal; --fs: 12px; --fw: 600">
        <h6 class="mb-3" style="--fs: 15px">Detalles del contrato</h6>

        <section class="d-flex flex-column" style="gap: 20px;">
          <aside
            v-for="(item, i) in transactionDetails.contract" :key="i"
            class="d-flex flex-column"
            style="gap: 10px;"
          >
            <div class="space" style="gap: 20px;">
              <span>Para contrato</span>
              <a
                href="" target="_blank"
                class="center"
                style="font-size: 12px; gap: 6px;">
                {{ item.account }}
                <img src="@/assets/sources/icons/link.svg" alt="link icon" style="width: 15px;">
              </a>
            </div>

            <div class="space" style="gap: 20px;">
              <span>Función:</span>
              <v-select
                v-model="item.function"
                :items="item.listFunctions"
                hide-details solo
                :menu-props="{ contentClass: 'aprove-transaction-info-menu' }"
              />
            </div>
          </aside>
        </section>
      </v-card>
    </modalInfo>

    <Header
      top-text="APROBAR"
      top-text-dir="rtl"
      bottom-text="TRANSACCIÓN"
      bottom-text-dir="ltr"
    ></Header>

    <v-btn
      class="btn-outlined mx-auto"
      style="--bg: var(--secondary); --h: 34px; margin-top: 3px;"
    >
      <img src="@/assets/sources/icons/language-blue.svg">
      <h5 class="mb-0">{{ token.domain }}</h5>
    </v-btn>


    <section class="d-flex flex-column center" style="height: 245px; margin-block: 25px;">
      <h2 class="ma-0">{{ attachedDeposit }} <span>NEAR</span></h2>
      <span>${{ deposit_usd }}</span>
    </section>


    <v-card
      min-height="45"
      class="btn-outlined justify-space-between align-center flex-wrap"
      style="margin-bottom: 12px;"
    >
      <label>DE</label>

      <div class="d-flex flex-column tend">
        <span
          style="--fw: 700"
        >{{ from }}</span>

        <span
          class="ml-auto"
          style="--fw: 500; color: #7C7B7F !important"
        >{{ balance }} near</span>
      </div>
    </v-card>

    <v-card
      min-height="45"
      class="btn-outlined justify-space-between align-center flex-wrap"
    >
      <div class="acenter" style="gap: 8px;">
        <label>TARIFA ESTIMADA</label>
        <img src="@/assets/sources/icons/warning-blue.svg" alt="info icon">
      </div>

      <div class="d-flex flex-column tend ml-auto" style="--fw: 400">
        <span>&lt;0.000001 NEAR</span>
        <span>&lt; $0.01</span>
      </div>
    </v-card>


    <a
      id="more-information-btn"
      class="tcenter my-6 mx-auto"
      style="
        --fw: 700;
        max-width: max-content;
        font-size: 9px;
        letter-spacing: 0.27px;
      "
    >+ MÁS INFORMACIÓN</a>


    <aside class="d-flex justify-space-between" style="gap: 12px;">
      <v-btn
        class="btn-outlined flex-grow-1"
        style="--bg: var(--secondary)"
        :loading="loading"
        @click="cancel()"
      >
        CANCELAR
      </v-btn>

      <v-btn
        class="btn flex-grow-1"
        :loading="loading"
        @click="approved()"
      >
        APROBAR
      </v-btn>
    </aside>
    
  </div>
</template>

<script>
// import * as nearAPI from "near-api-js";
import moment from 'moment';
import utils from '../services/utils';
import localStorageUser from '~/services/local-storage-user';
import { configNear }  from '~/services/nearConfig';
import walletUtils from '@/services/wallet';
import { ALERT_TYPE } from '~/plugins/dictionary';
const nearAPI = require("near-api-js");
const { KeyPair, keyStores, connect } = nearAPI;




export default {
  name: "LimitedPermissions",
  layout: "default-variant-2",
  middleware: ["authenticated"],
  data() {
    return {
      loading: false,
      checks: [
          { text: "Ver la dirección de su cuenta permitida", check: true },
          { text: "Ver el saldo de su cuenta permitida", check: true },
          { text: "Métodos de llamada en el contrato inteligente en nombre de su cuenta permitida", check: true },
          { text: "Esto no permite que la aplicación transfiera tokens.", check: false },
      ],
      from: null,
      attachedDeposit: 0,
      deposit_usd: 0,
      balance: 0,
      token: null,
      error: null,
      transactionDetails: {
          network: "",
          contract: []
      },
    };
  },
  head() {
    const title = 'Connect with NEAR';
    return {
        title,
    };
  },
  mounted() {
    this.token = JSON.parse(sessionStorage.getItem("token"));
    this.loadData();
  },
  methods: {
    async loadData(){
      const from = this.token.from;
      const attachedDeposit = this.token.json.attachedDeposit ? (Number(this.token.json.attachedDeposit) / 1000000000000000000000000) : 0;
      let depositUsd = 0;
      let balance = 0;

      const { near, usd, price } = await walletUtils.getBalance(from);

      if(near && usd && price) {
        depositUsd = price;
        balance = near
      }
      
      this.attachedDeposit = attachedDeposit.toFixed(5);
      this.deposit_usd = (attachedDeposit * depositUsd).toFixed(2);
      this.from = utils.shortenAddress(from);
      this.balance = balance.toFixed(5);
      this.transactionDetails = {
          network: this.token.domain,
          contract: [
              {
                  account: this.token.contract,
                  function: this.token.json.methodName,
                  listFunctions: [this.token.json.methodName]
              },
          ]
      }
    },

    async approved() {
      try {
        this.loading = true
        if(this.balance < this.attachedDeposit) {
          this.loading = false
          this.$alert(ALERT_TYPE.ERROR, { desc: "Su balance no es suficiente" })
          return
        }
        // const token = JSON.parse(sessionStorage.getItem("token"));
        const dataUser = localStorageUser.getAccount(this.token.from);
        const privateKey = dataUser.privateKey;
        const address = dataUser.address;
        // creates a public / private key pair using the provided private key
        // adds the keyPair you created to keyStore
        const myKeyStore = new keyStores.InMemoryKeyStore();
        const keyPairNew = KeyPair.fromString(privateKey);
        await myKeyStore.setKey(process.env.Network, address, keyPairNew);
        const nearConnection = await connect(configNear(myKeyStore));
        const account = await nearConnection.account(address);
        const response = await account.functionCall(this.token.json);
        /*
          {
            contractId: process.env.Network,
            methodName: "create_account",
            args: {
              new_account_id: nickname,
              new_public_key: publicKey,
            },
            gas: "300000000000000",
            attachedDeposit: "10000000000000000000",
          }
        */
        
        const ruta = this.token.success;
        const json = JSON.stringify(
          {
            hash: response?.transaction?.hash,
            date_time: moment().unix()
          }
        )
        const token = window.btoa(json)
        
        sessionStorage.removeItem("token");
        
        // console.log("response: ", json);

        location.replace(ruta+"?response="+token);
      }
      catch (error) {
        this.loading = false
        this.$alert(ALERT_TYPE.ERROR, { desc: error.toString() })
        // console.log("error error: ", error.toString());
      }
    },

    cancel() {
      location.replace(this.token.success);
    },
  },
    
}
</script>

<style src="@/assets/styles/pages/approve-transaction.scss" lang="scss"></style>
