<template>
  <v-form ref="form" v-model="valid">
  <div id="pick-username" class="divcol center">
    <Header
      ref="header"
      top-text=""
      bottom-text="DIRECCIÓN LEGIBLE"
      description="INGRESE EL NOMBRE DE USUARIO QUE DESEA ESTE NOMBRE JUNTO CON .NEAR SE COVIERTE EN SU DIRECCIÓN PARA RECIBIR PAGOS"
      max-width="283px"
      top-text-dir="rtl"
      bottom-text-dir="ltr"
      bottom-text-indent="1.6ch"
    />

    <section id="pick-username-content">
      <v-text-field
        v-model="accountNear"
        label="usuario / billetera" solo
        style="--margin-message: 1px"
        :error-messages="errorAccount"
        :success-messages="successAccount"
        :suffix="dominioNearInput"
        :rules="required"
        @keyup="verificarAccount(accountNear)"
        
      ></v-text-field>
      <h7 class="mb-4"><strong>Nota:</strong> los unicos caracteres especiales permitidos son guion (-) y guion bajo (_)</h7>
      <!--<p>The following wallet </p>
      <p> 
        <strong>{{ address.substring(0, 20) }} ... {{ address.substring(20, 37) }}</strong> 
        <v-btn
          class="btn-icon"
          style="--size: 35px"
          @click="fnCopie()"
          v-clipboard:copy="address"
        >
          <v-icon v-if="copie">mdi-check</v-icon>
          <img v-if="!copie" width="20px" src="@/assets/sources/icons/copy.svg" alt="copy to clipboard">
        </v-btn>
      </p>
      <p>must have <strong>0.5</strong> NEAR available, to be able to assign a name</p>-->
      <v-btn :loading="loading" class="btn" @click="onCreateName()">VERIFICAR</v-btn>
      <v-btn
        class="btn-outlined mt-10"
        :disable="loading"
        :loading="loading"
        @click="redirect('/')"
      >
        VOLVER
      </v-btn>

      <!--<article class="btn-outlined">
        <img width="36px" src="@/assets/sources/icons/warning.svg" alt="warning icon">

        <p class="p">
          <span>NOTA:</span> Su nombre de usuario servirá como dirección de su billetera, lo que permitirá transferencias fluidas con solo presionar unas pocas teclas.
        </p>
      </article>-->
    </section>


  </div>
</v-form>
</template>

<script>
import axios from 'axios'
import * as nearAPI from "near-api-js";
import localStorageUser from '../services/local-storage-user';
import { configNear } from "@/services/nearConfig";
import { ALERT_TYPE } from '~/plugins/dictionary';
import utils from '~/services/utils';
const { keyStores, Account, Near } = nearAPI;



export default {
  name: "PickUsernamePage",
  layout: "auth-layout",
  middleware: ["authenticated-create-import"],
  data() {
    return {
      valid:false,
      // address: "",
      accountNear: null,
      dominioNearInput: process.env.Network === "testnet" ? "." + process.env.Network : ".near",
      dominioNear: process.env.Network === "testnet" ? "." + process.env.Network : ".near",
      required: [(v) => !!v || "Campo requerido"],
      copie: false,
      errorAccount: null,
      successAccount: null,
      loading: false,
    }
  },
  head() {
    const title = 'Pick a username';
    return {
      title,
    }
  },

  watch: {
    accountNear(val) {
      this.accountNear = val.toLowerCase();
    }
  },

  created() {
    // this.$store.commit('validSession');
  },
  mounted() {
    // this.$store.commit('validSession')
    // this.address = localStorageUser.getCurrentAccount().address; // this.$auth.$storage.getState("address") ?? " ";
  },
  methods: {
    redirect(rute) {
      this.$router.push(utils.routeAction(this.$route.query.action,rute));    
    },

    fnCopie() {
      this.copie = true;
      const timer = setInterval(() => {
        this.copie = false;
        clearInterval(timer)
      }, 1000*2);
      
    },
    onSignUp() {
      localStorage.setItem("auth", true)
      this.$router.push(this.localePath(utils.routeLogin(this.$route.query.action)));
    },
    async verificarAccount(value) {

      if(!value) {
        this.successAccount = null
        this.errorAccount = null
        return false
      }
      
      const accountInput = value + this.dominioNear;

      if((/^[a-z0-9_-]+$/.test(value))) {

        const keyStore = new keyStores.InMemoryKeyStore()
        const near = new Near(configNear(keyStore))
        const account = new Account(near.connection, accountInput)
        
        let response = null
        await account.state()
            .then(() => {
              response = true
              this.successAccount = null
              this.errorAccount = "Account already exists"
            }).catch(() => {
              response = false
              this.successAccount = "This account is valid"
              this.errorAccount = null
            })
        
        return response
        // console.log(response)
        // console.log(this.errorAccount)
      } else {
        this.errorAccount = "Valores no permitidos"
        return false
      }
    
    },

    async onCreateName() {
      try {
        this.loading = true;
        if(!this.$refs.form.validate() || this.errorAccount != null) {
          this.loading = false;
          return
        }
        const newAccount = this.accountNear + this.dominioNear;

        /* if(localStorage.getItem("importEmail") !== undefined && localStorage.getItem("importEmail") !== null) {
          await axios.post(process.env.URL_BACKEND +'/wallet/send-code',
          {email: localStorage.getItem("email")}, {
            headers: {
              'accept': 'application/json',
            },
          }).then(() => {
            localStorage.setItem("importEmailNickname", newAccount)
            this.loading = false;
            // this.$router.push(this.localePath("/verification"))
            this.$router.push(utils.routeAction(this.$route.query.action,"/verification"));
          }).catch(() => {
            throw new Error ("Failed to send the code")
          })
          
            
          this.$router.push(this.localePath("/verification"))
        } else { */
          await axios.post(process.env.URL_BACKEND +'/wallet/create-nickname',
          {
            nickname: newAccount,
            email: sessionStorage.getItem("email"),
            cedula: sessionStorage.getItem("cedula")
          }, {
            headers: {
              'accept': 'application/json',
            },
          }).then((response) => {
            const data = response.data.data;
            
            // remover cuenta antigua para poder agregar nueva cuenta con nicname
            // localStorageUser.removeAccount(localStorageUser.getCurrentAccount().address)

            // agregando nueva cuenta con nicname
            localStorageUser.addNewAccount({
              _address: data.address,
              _publicKey: data.publicKey,
              _privateKey: data.secretKey
            })
        
            localStorage.setItem("seedPhrase", data.seedPhrase);

            
            this.loading = false;

            // this.$router.push(this.localePath("/passphrase-new"))
            // this.$router.push(utils.routeAction(this.$route.query.action,"/passphrase-new"));
            this.$router.push({ path: "/create-wallet-passphrase" });

          }).catch((error) => {
            throw new Error ("Error create nickname: " + error)
          })

        // }
        this.loading = false;
      } catch (error) {
        this.loading = false;
        console.log(error)
        this.$alert(ALERT_TYPE.ERROR, {
          desc: error.toString(),
          timeout: 1000*60
        })
      }
    },
  }
};
</script>

<style src="~/assets/styles/pages/pick-username.scss" lang="scss" />
