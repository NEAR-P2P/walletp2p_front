<template>
  <div id="home" class="divcol center">
    <modalCryptos 
      ref="modalCryptos"
      :data-tokens=dataTokens
    ></modalCryptos>

    <!-- <v-alert
      v-model="alert"
      class="mt-3"
      close-text="Close Alert"
      shaped
      prominent
      :type="alertType"
      dismissible
    >
      <a :href="hashUrl" target="_blank">{{ hash }}</a>
    </v-alert> -->

    <Header show-append>
      <template #prepend>
        <nuxt-link :to="localePath('/')">
          <img src="@/assets/sources/logos/logo.svg" alt="logo" style="--w: 34px">
        </nuxt-link>
      </template>
    </Header>

    <section id="section-available" style="padding-top: 23px;">
      <div class="space" style="gap: 10px">
        <v-btn
          class="btn-outlined"
          style="--bg: var(--secondary); flex: 1 1"
          @click="$refs.modalCryptos.model = true"
        >
          BALANCES
        </v-btn>

        <v-btn
          class="btn"
          style="flex: 1 1"
          @click="$router.push('/documents')"
        >
          DOCUMENTOS
        </v-btn>
      </div>

      <aside class="container-available">
        <h1 class="p">
          <span style="--fw: 400">$</span>{{ balance }}
          <span class="currency">USD</span>
        </h1>

        <div class="divcol center" style="margin-top: 25px;">
          <h3 class="p">SALDO DISPONIBLE</h3>
          <img src="../assets/sources/icons/warning-blue.svg"  alt="warning icon" style="--w: 25px; --h: 25px; margin-top: 6px" @click="$refs.modalCryptos.model = true">
        </div>
      </aside>

      <aside class="container-btns">
        <div v-for="(item, i) in dataBtns" :key="i">
          <v-btn class="btn-icon" @click="item.action">
            <img :src="item.icon" :alt="item.text">
          </v-btn>

          <span class="text">{{item.text}}</span>
        </div>
      </aside>
    </section>


    <section id="section-explore">
      <div id="section-explore-content">
        <v-btn
          class="btn-outlined"
          @click="openExplorer()"
        >
        explorar <span data-inner>near</span>
        </v-btn>

        <v-btn
          class="btn"
          to="/explore"
        >
        explorar apps
        </v-btn>

        <article class="btn-outlined">
          ¡Gana, acuña y juega! Descubre el ecosistema de aplicaciones NEAR
        </article>

        <img src="@/assets/sources/images/background-explore.svg" alt="explore background">
      </div>
    </section>


    <section id="section-recent-activity" class="mb-10">
      <div id="section-recent-activity__wrapper">
        <h1 class="p">actividad <br>reciente</h1>

        <div class="divcol" style="gap: 20px; cursor: pointer">
            <ActivityCard
              v-for="(item, i) in dataActivity" :key="i"
              :type="item.type"
              :account="item.account"
              :coin="item.coin"
              :amount="item.amount"
              :date="item.date"
              :text2="item.text2"
              :hash="item.hash"
              @click.native="navigateToExternalLink(linkExplorerDetail+'txns/'+item.hash)"
            />
        </div>

        <v-btn
          :href="linkExplorer" target="_blank"
          class="btn mb-10"
        >
          ver todos
        </v-btn>
      </div>
    </section>


    <div class="text-center">
      <v-bottom-sheet
        v-model="sheet"
        inset
      >
        <v-sheet
          class="text-center"
          height="200px"
        >
          <v-btn
            class="mt-6"
            text
            color="error"
            @click="sheet = !sheet"
          >
            cerrar
          </v-btn>
          <div class="my-3" style="font-size:20px; font-weight: 900;">
            Esta opción estará disponible próximamente
          </div>
        </v-sheet>
      </v-bottom-sheet>
    </div>


  <v-row justify="center">
    <v-dialog
      v-model="revived"
      scrollable
      width="400"
    >
      <v-card class="rounded-xl">
        <v-card-title>Recibir</v-card-title>
        <v-divider></v-divider>
        <v-card-text style="height: 300px;">
          <v-row
            class="mt-3"
            justify="center"
          >
            <p>
              <vue-qr :text="address" :logo-src="logoWallet" qid="addressQr"></vue-qr>
            </p>
            <p>
              <span class="mr-4">Dirección: <strong>{{ address }}</strong></span>
              <v-btn
                class="btn-icon"
                @click="fnCopie(address)"
              >
              <v-icon v-if="copie">mdi-check</v-icon>
              <img v-if="!copie" src="@/assets/sources/icons/copy.svg" alt="copy to clipboard" style="--w: 15px">
              </v-btn>
            </p>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pt-3 pb-3">
          <v-spacer></v-spacer>
          <v-btn
            class="btn-outlined"
            width="100"
            style="--bg: var(--secondary); --b-color: var(--primary); --c: var(--primary)"
            variant="text"
            @click="revived = false"
          >
            Cerrar
          </v-btn>
          <v-spacer></v-spacer>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>



    
  </div>
</template>


<script>
import axios from 'axios';
import * as nearAPI from "near-api-js";
import VueQr from 'vue-qr'
import moment from 'moment';
import logoWallet from "~/assets/sources/logos/logo.svg";
import tokens from '@/services/tokens';
// import { configNear } from "@/services/nearConfig";
import walletUtils from '@/services/wallet';
const { utils } = nearAPI;


export default {
  name: "HomePage",
  components: {VueQr},
  // middleware: ["authenticated"],
  data() {
    return {
      alert: false,
      alertType: "success",
      hash: null,
      hashUrl: null,
      network: process.env.Network,
      copie: false,
      logoWallet,
      linkExplorer: "",
      linkExplorerDetail: "",
      sheet: false,
      revived: false,
      balance: "0.00",
      balance_near: 0.00,
      address: "",
      dataBtns: [
        {
          icon: require("@/assets/sources/icons/arrow-up.svg"),
          text: "enviar",
          action: () => { this.$router.push({ path: "/send" }) } ,// { this.alert = false; this.transfer = true; this.$refs.formEnvio.resetValidation(); this.$refs.formEnvio.reset(); },
        },
        {
          icon: require("@/assets/sources/icons/swap.svg"),
          text: "cambiar",
          action: () => {this.$router.push({ path: "/swap" })},
        },
        {
          icon: require("@/assets/sources/icons/plus.svg"),
          text: "recargar",
          action: () => { window.open("https://t.me/nearp2p", "_blank") },
        },
        {
          icon: require("@/assets/sources/icons/arrow-down.svg"),
          text: "recibir",
          action: () => { this.$router.push({ path: "/send-qr" }) },// {this.revived = true;},
        },
      ],
      dataActivity: [],
      dataTokens: []
    }
  },
  head() {
    const title = 'Home';
    return {
      title,
    }
  },
  mounted() {
    this.address = localStorage.getItem("address");

    sessionStorage.removeItem("create-import-proccess")

    // localStorage.removeItem("importEmailNickname");
    // localStorage.removeItem("importEmail");
    localStorage.removeItem("seedPhraseLoginNew");
    localStorage.removeItem("seedPhraseLogin");
    localStorage.removeItem("seedPhrase");
    localStorage.removeItem("login");
    // localStorage.removeItem("seedPhraseGenerate");
    localStorage.removeItem("token");
    
    /* if(!localStorage.removeItem("login") === undefined || !localStorage.getItem("privateKey") === undefined) {
      this.$router.push(this.localePath("/login"))
    } */
    
    /* if(localStorage.getItem("loginExternal") !== undefined && localStorage.getItem("loginExternal") !== null) {
      const ruta = localStorage.getItem("loginExternal");
      const json = JSON.stringify({
        wallet: this.address,
        cretaDate: new Date()
      })
      const token = btoa(json)
      localStorage.removeItem("loginExternal");
      location.replace(ruta+"?token="+token);
    } */
    
    this.linkExplorer = process.env.URL_EXPLORER + this.address
    this.linkExplorerDetail = process.env.ROUTER_EXPLORER_NEAR;
    // this.getBalance()
    this.loadTokens()
    // Call getListTokensBalance every 5 minutes
    // Run getListTokensBalance every 5 minutes

    this.recentActivity()
    /* setInterval(() => {
      this.getBalance()
      this.recentActivity()
    }, 1000*10); // se ejecuta cada 10 segundos */
    // eliminando variables de inicio de session
    this.alertSend();
  },
  methods: {
    navigateToExternalLink(url) {
      window.open(url, '_blank');
    },
    async loadTokens() {
      // Check if balance exists in session storage
      const storedBalance = sessionStorage.getItem('balance');

      if (storedBalance) {
        this.balance = storedBalance;
        return;
      }

      const inventory = await tokens.getListTokensBalance();

      if (!inventory) return;

      this.dataTokens = inventory.fts;

      let balance = 0;

      for (const dataToken of this.dataTokens) {
        balance += Number(dataToken.balance_usd);
      }

      this.balance = balance.toFixed(2);

      // Store the calculated balance in session storage
      sessionStorage.setItem('balance', this.balance);
    },
    alertSend() {
      const result = sessionStorage.getItem("send-result");

      if(result) {
        const resultSend = JSON.parse(result);

        // this.hash = resultSend.hash;
        // this.hashUrl = resultSend.hashUrl;
        // this.alertType = resultSend.alertType;

        // this.alert = true;

        this.$alert(resultSend.alertType,{ desc: `<a href="${resultSend.hashUrl} targe="_blank">${resultSend.hash}</a>` })

        sessionStorage.removeItem("send-result");
      }
    },
    openExplorer() {
      window.open(process.env.ROUTER_EXPLORER_NEAR, 'self')
    },

    fnCopie(copy) {
      this.copie = true;
      navigator.clipboard.writeText(copy);
      const timer = setInterval(() => {
        this.copie = false;
        clearInterval(timer)
      }, 1000);
    },

    async getBalance() {
      let balance = 0.00;
      let balanceNear = 0.00;

      const { near, usd } = await walletUtils.getBalance();

      if(near) {
        balance = usd;
        balanceNear = near;
      }

      this.balance = balance.toFixed(2);
      this.balance_near = balanceNear.toFixed(5);

    },

    async recentActivity() {
      const wallet = this.address;
      await axios.get(`${process.env.URL_API_INDEXER}/account/${wallet}/txns?order=desc&page=1&per_page=25`)
      .then((response) => {
        try {
          const data = response.data?.txns;

          if(!data) return
        
          moment.locale('es');
          const dataActivity = data.filter((item) => item.predecessor_account_id !== "system").map((items) => {
            let typeParam = "";
            let amountParam = "";
            let coinParam = "";
            let accountParam = "";
            let text2;

            if(items.actions.length === 1) {
              switch (items.actions[0].action) {
                case "TRANSFER":
                  typeParam = items.predecessor_account_id === wallet ? "sent" : "receive";
                  accountParam = items.predecessor_account_id === wallet ? items.receiver_account_id : items.predecessor_account_id;
                  amountParam = (items.predecessor_account_id === wallet ? "-" : "+")+Number(utils.format.formatNearAmount(BigInt(items.actions_agg.deposit).toString())).toFixed(5);
                  coinParam = "NEAR"
                  break;
                case "CREATE_ACCOUNT":
                  typeParam = "account";
                  accountParam = items.receiver_account_id;
                  break;
                case "ADD_KEY":
                  typeParam = "access";
                  accountParam = items.receiver_account_id;
                  break;
                case "FUNCTION_CALL":
                  typeParam = "function";
                  accountParam = items.receiver_account_id;
                  text2 = items.actions[0].method;
                  break;
                default:
                  typeParam = "access";
                  accountParam = items.receiver_account_id;
                  break;
              }
            } else {
              typeParam = "batch";
              accountParam = items.receiver_account_id
            }

            const res = {
              type: typeParam,
              account: walletUtils.shortenAddress(accountParam),
              coin: coinParam,
              amount: amountParam,
              date: moment(items.block_timestamp/1000000).fromNow(),
              text2,
              hash: items.transaction_hash
            }

            return res
          })

          this.dataActivity = dataActivity.slice(0, 7);

        } catch (error) {
          console.log("error a mapear lista de actividades recientes: ", error)
        }

      })
    }
  }
};
</script>

<style src="~/assets/styles/pages/index.scss" lang="scss" />
