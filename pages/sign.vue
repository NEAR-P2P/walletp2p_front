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
// import {functionCall} from 'near-api-js/lib/transaction'
import BN from 'bn.js';
import * as nearAPI from "near-api-js";
// import { baseDecode } from 'near-api-js/lib/utils/serialize';
// import { PublicKey } from 'near-api-js/lib/utils';
// import { createTransaction /* , functionCall */ } from 'near-api-js/lib/transaction'
import utiles from '../services/utils';
import encryp from '../services/encryp';
import { WalletError } from '../utils/walletError'
import localStorageUser from '~/services/local-storage-user';

import { configNear }  from '~/services/nearConfig';

import walletUtils from '@/services/wallet';
import { ALERT_TYPE } from '~/plugins/dictionary';

// const nearAPI = require('near-api-js');


// const nearAPI = require("near-api-js");
// const { KeyPair, keyStores, connect, WalletConnection, transactions, Account } = nearAPI;
const { utils, transactions } = nearAPI;





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
      token: {},
      error: null,
      transactionDetails: {
          network: "",
          contract: []
      },
      contentClass: {
      type: String,
      default: '',
      loginNear: false
      },
    };
  },
  head() {
    const title = 'Connect with NEAR';
    return {
        title,
    };
  },
  created() {
    if(this.$route.query.token){
      // const tokenString = window.atob(this.$route.query.token);
      const tokenString = encryp.decryp(this.$route.query.token);
      const tokenJSON = JSON.parse(tokenString);
      // sessionStorage.setItem("token", tokenString);
      this.token = tokenJSON
    } else {
      const transactionsList = this.$route.query.transactions.split(',')
        .map((str) => Buffer.from(str, 'base64'))
        .map((buffer) => utils.serialize.deserialize(transactions.SCHEMA, transactions.Transaction, buffer))

      const allActions = transactionsList.flatMap((t) => t.actions);
      const totalAmount = allActions
                .map((a) => (a.transfer && a.transfer.deposit) || (a.functionCall && a.functionCall.deposit) || 0)
                .reduce((totalAmount, amount) => totalAmount.add(new BN(amount)), new BN(0)).toString();
      
      
                console.log(transactionsList, transactionsList[0])

      this.token.from = transactionsList[0].signerId;
      this.token.json = { attachedDeposit: totalAmount };
      this.attachedDeposit = totalAmount;
      this.token.transaction = transactionsList;
      this.token.domain = this.$route.query?.callbackUrl ? this.$route.query?.callbackUrl.split("/")[2] : null;
      this.token.error = this.token.callbackUrl = this.$route.query?.callbackUrl;

      this.loginNear = true;

    }
  },
  mounted() {
    this.loadData();
    
  },
  methods: {
    async loadData(){
      const from = this.token.from;
      let attachedDeposit;
      let depositUsd = 0;
      let balance = 0;

      if(!Array.isArray(this.token?.json)) {
        attachedDeposit = this.token.json?.attachedDeposit ? (Number(this.token.json.attachedDeposit) / 1000000000000000000000000) : 0;
      } else {
        let deposit = 0
        for(const item of this.token?.json) {
          deposit += !item?.attachedDeposit ? 0 : (Number(item?.attachedDeposit) / 1000000000000000000000000);
        }
        attachedDeposit = deposit;
      }

      const { near, usd, price } = await walletUtils.getBalance(from);

      if(near && usd && price) {
        depositUsd = price;
        balance = near
      }
      
      this.attachedDeposit = attachedDeposit.toFixed(5);
      this.deposit_usd = (attachedDeposit * depositUsd).toFixed(2);
      this.from = utiles.shortenAddress(from);
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

    approved() {
      if(this.loginNear) {
        this.approvedNear();
      } else {
        this.approvedMeta();
      }
    },

    async approvedNear() {
      try {
        this.loading = true
        if(Number(this.balance) < Number(this.attachedDeposit)) {
          this.loading = false
          this.$alert(ALERT_TYPE.ERROR, { desc: "Su balance no es suficiente" })
          return
        }
        
        const transactionList = this.token?.transaction

        if(!transactionList)  {
          this.loading = false
          this.$alert(ALERT_TYPE.ERROR, { desc: "No se encontro la transacción" })
          return
        }

        const dataUser = localStorageUser.getAccount(this.token.from);
        const privateKey = dataUser.privateKey;
        const address = dataUser.address;
        
        const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
        const keyPairNew = nearAPI.KeyPair.fromString(privateKey);
        await keyStore.setKey(process.env.Network, address, keyPairNew);
        const near = await nearAPI.connect(configNear(keyStore));
        const account = await near.account(address);

        const transactionHashes = [];
        for (const { receiverId, nonce, blockHash, actions } of transactionList) {
            let status, transaction;
            const recreateTransaction = account.deployMultisig || true;
            if (recreateTransaction) {
                try {
                    ({ status, transaction } = await account.signAndSendTransaction({ receiverId, actions }));
                } catch (error) {
                    if (error.message.includes('Exceeded the prepaid gas')) {
                      this.$alert(ALERT_TYPE.ERROR, { desc: error.message })
                      throw new WalletError(error.message, error.code, { transactionHashes });
                    }
                    throw error;
                }
            } else {
                const [, signedTransaction] = await nearAPI.transactions.signTransaction(receiverId, nonce, actions, blockHash, this.connection.signer, address, process.env.Network);
                ({ status, transaction } = await this.connection.provider.sendTransaction(signedTransaction));
            }

            if (status.Failure !== undefined) {
              this.loading = false
              this.$alert(ALERT_TYPE.ERROR, { desc: `Transaction failure for transaction hash: ${transaction.hash}, receiver_id: ${transaction.receiver_id} .` })
              throw new Error(`Transaction failure for transaction hash: ${transaction.hash}, receiver_id: ${transaction.receiver_id} .`);
            }
            transactionHashes.push({
                hash: transaction.hash,
                nonceString: nonce.toString()
            });
        }

        const hashesMap = transactionHashes.map((item) => {return item.hash});
        const hashes = transactionHashes.length === 1 ? hashesMap[0] : hashesMap;

        this.loading = false

        const callbackUrl = this.token.callbackUrl.split('?')
        let urlParams = "";

        if(callbackUrl.length > 1) {
          urlParams = new URLSearchParams(callbackUrl[1]);
          urlParams.delete("transactionHashes");
          urlParams.delete("transactions");
        }

        const urlParamsFinal = urlParams.toString().trim() === "" ? "" : `&${urlParams.toString()}`;
        const rute = `${callbackUrl[0]}?transactionHashes=${hashes.join('%2C')}${urlParamsFinal}`

        location.replace(rute);
        
      } catch (error) {
        this.loading = false
        this.$alert(ALERT_TYPE.ERROR, { desc: error.toString() })
        // console.log("error error: ", error.toString());
      }
    },

    async approvedMeta() {
      console.log("paso aqui: ", this.token.json)
      
      try {
        this.loading = true
        if(Number(this.balance) < Number(this.attachedDeposit)) {
          this.loading = false
          this.$alert(ALERT_TYPE.ERROR, { desc: "Su balance no es suficiente" })
          return
        }
        // const token = JSON.parse(sessionStorage.getItem("token"));
        const dataUser = localStorageUser.getAccount(this.token.from);
        const privateKey = dataUser.privateKey;
        const address = dataUser.address;
        

        const nearAPI = require('near-api-js');
        const keyStore = new nearAPI.keyStores.InMemoryKeyStore();
        const keyPairNew = nearAPI.KeyPair.fromString(privateKey);
        await keyStore.setKey(process.env.Network, address, keyPairNew);
        const near = await nearAPI.connect(configNear(keyStore));
        const account = await near.account(address);
        
        let response
        if(!Array.isArray(this.token?.json)) {
          response = await account.functionCall(this.token.json);
        } else {
          const actions = this.token?.json.map((item) => {
              return nearAPI.transactions.functionCall(
                item.methodName, 
                !item?.args ? {} : item.args,
                new BN((!item?.gas ? '3000000000000' : item.gas)),
                new BN((!item?.attachedDeposit ? "0" : item.attachedDeposit))
              )
            });
            
          response = await account.signAndSendTransaction({ receiverId: this.token?.json[0]?.contractId, actions});

        }
        
        /*
          {
            contractId: "contract.testnet",
            methodName: "create_account",
            args: {
              new_account_id: nickname,
              new_public_key: publicKey,
            },
            gas: "300000000000000",
            attachedDeposit: "10000000000000000000",
          }
        */
        
        // const ruta = this.token.success;
        const json = JSON.stringify(
          {
            hash: response?.transaction?.hash,
            date_time: moment().unix()
          }
        )
        const token = window.btoa(json)
        
        // sessionStorage.removeItem("token");
        
        // console.log("response: ", json);

        let ruta = this.token.success;
        
        if(this.token?.search) {
          ruta += this.token.search + "&response="+token;
        } else {
          ruta += "?response="+token;
          
        }
        
        location.replace(ruta);
      }
      catch (error) {
        this.loading = false
        console.log(error)
        this.$alert(ALERT_TYPE.ERROR, { desc: error.toString() })
        // console.log("error error: ", error.toString());
      }
      
    },

    cancel() {
      let ruta = this.token.error;
        
      if(this.token?.searchError) {
        ruta += this.token.searchError;
      }
      location.replace(ruta);
    },
  },
    
}

/*
async initContract() {
				//Verifying if the user has token activo
				let txs = [];
				const CONTRACT_NAME = process.env.VUE_APP_CONTRACT_NAME;
				const CONTRACT_NAME_USDT = process.env.VUE_APP_CONTRACT_NAME_USDT;
				const near = await connect(
					CONFIG(new keyStores.BrowserLocalStorageKeyStore(), localStorage.getItem("wallet"))
				);
				const wallet = new WalletConnection(near);
				const contract = new Contract(wallet.account(), CONTRACT_NAME, {
					viewMethods: ["get_token_activo"],
					changeMethods: [""],
					sender: wallet.account()
				});
				//Info to set mail address
				this.$apollo
					.watchQuery({
						query: mails,
						variables: {
							owner_id: this.$session.get("owner_id")
						}
					})
					.subscribe(({data}) => {
						this.$session.set(
							"user_mail",
							data.datausers[0].email === null
								? "xxx"
								: data.datausers[0].email
						);
					});
				// eslint-disable-next-line no-unused-vars
				var vldeposit = "100000000000000000000000";
				var get_token_activo = await contract.get_token_activo({
					user_id: this.typeoffer == "sell" ? this.userInfo.split(".")[0] + "." + CONTRACT_NAME : this.userInfo,
					ft_token: "USDT"
				});
				if (get_token_activo == true) {
					vldeposit = "1";
				} else {
					vldeposit = "100000000000000000000000";
					txs.push({
						receiverId: CONTRACT_NAME,
						functionCalls: [
							{
								methodName: "activar_subcuenta_ft",
								receiverId: CONTRACT_NAME,
								gas: "80000000000000",
								args: {subaccount_id: this.typeoffer == "sell" ? this.userInfo.split(".")[0] + "." + CONTRACT_NAME : this.userInfo, asset: "USDT"},
								deposit: "100000000000000000000000"
							}
							]
						});
				}
				var now = moment()
					.format("YYYY-MM-DD HH:mm:ss")
					.toString();
				if (this.typeoffer == "sell" && this.subcontract == false) {
					txs.push(
						{
							//Deploy contract
							receiverId: CONTRACT_NAME,
							functionCalls: [
								{
									methodName: "create_subcontract_user",
									receiverId: CONTRACT_NAME,
									gas: "80000000000000",
									args: {},
									deposit: vldeposit
								}
							]
						});
						txs.push({
							//Send Near
							receiverId: CONTRACT_NAME_USDT,
							functionCalls: [
								{
									methodName: "ft_transfer",
									receiverId: CONTRACT_NAME_USDT,
									gas: "80000000000000",
									args: {
										receiver_id: this.userInfo.split(".")[0] + "." + CONTRACT_NAME,
											//this.userInfo.split(".")[0] + "." + CONTRACT_NAME,
											
										amount: this.$session.get("totalremaining_amount").toString()
									},
									deposit: 1
								}
							]
						});
						txs.push({
							//Accept Order
							receiverId: CONTRACT_NAME,
							functionCalls: [
								{
									methodName: "accept_offer",
									receiverId: CONTRACT_NAME,
									gas: "300000000000000",
									args: {
										offer_type: parseInt(this.$session.get("offer_type")),
										offer_id: parseInt(this.$session.get("offer_id")),
										amount: this.$session.get("totalremaining_amount").toString(),
										payment_method: parseInt(
											this.$session.get("payment_method")
										),
										datetime: now,
										rate: parseFloat(this.$session.get("price"))
									},
									deposit: "1"
								}
							]
						});
					
				} 
				else if (this.typeoffer == "sell" && this.subcontract == true) 
				{
					txs.push(
						{
							//Send Near
							receiverId: CONTRACT_NAME_USDT,
							functionCalls: [
								{
									methodName: "ft_transfer",
									receiverId: CONTRACT_NAME_USDT,
									gas: "80000000000000",
									args: {
										receiver_id:
											this.userInfo.split(".")[0]+ "." + CONTRACT_NAME,
										amount: this.$session.get("totalremaining_amount").toString()
									},
									deposit: "1"
								}
							]
						});
						txs.push({
							//Accept Order
							receiverId: CONTRACT_NAME,
							functionCalls: [
								{
									methodName: "accept_offer",
									receiverId: CONTRACT_NAME,
									gas: "300000000000000",
									args: {
										offer_type: parseInt(this.$session.get("offer_type")),
										offer_id: parseInt(this.$session.get("offer_id")),
										amount: this.$session.get("totalremaining_amount").toString(),
										payment_method: parseInt(
											this.$session.get("payment_method")
										),
										datetime: now,
										rate: parseFloat(this.$session.get("price"))
									},
									deposit: "1"
								}
							]
						});
					
				} 
				else 
				{
					txs.push(
						{
							//Accept Order
							receiverId: CONTRACT_NAME,
							functionCalls: [
								{
									methodName: "accept_offer",
									receiverId: CONTRACT_NAME,
									gas: "300000000000000",
									args: {
										offer_type: parseInt(this.$session.get("offer_type")),
										offer_id: parseInt(this.$session.get("offer_id")),
										amount: this.$session.get("totalremaining_amount").toString(),
										payment_method: parseInt(
											this.$session.get("payment_method")
										),
										datetime: now,
										rate: parseFloat(this.$session.get("price"))
									},
									deposit: "1"
								}
							]
						});
				}
				//console.log(txs)
				this.batchTransaction(txs, { meta: "USDT" });
			}
		}
	};

  //Batch transactions
			async batchTransaction(transactions, options) {
				const near = await connect(
					CONFIG(new keyStores.BrowserLocalStorageKeyStore(), localStorage.getItem("wallet"))
				);
				const wallet = new WalletConnection(near);
				const nearTransactions = await Promise.all(
					transactions.map(async tx => {
						return await this.createTransactionFn(
							tx.receiverId,
							tx.functionCalls.map(fc => {
								return functionCall(fc.methodName, fc.args, fc.gas, fc.deposit);
							})
						);
					})
				);
				wallet.requestSignTransactions({
					transactions: nearTransactions,
					callbackUrl: options?.callbackUrl,
					meta: options?.meta
				});
			},
*/

</script>

<style src="@/assets/styles/pages/approve-transaction.scss" lang="scss"></style>





