<template>
  <v-dialog
    v-model="model"
    max-width="max-content"
    :overlay-opacity=".9"
    content-class="modal-cryptos"
  >
    <!--<aside class="d-flex justify-end mb-5">
      <v-text-field
        v-model="search"
        hide-details solo
      >
        <template #append>
          <img src="@/assets/sources/icons/magnify.svg" alt="search icon">
        </template>
      </v-text-field>
    </aside>-->


    <v-card class="cryptos-card">
      <div class="cryptos-card__wrapper">
        <v-card
          v-for="(item, i) in dataTokens" :key="i"
          color="transparent"
          class="cryptos-card-coin space"
          :class="{active: selectedCoin?.coin === item.symbol}"
          @click="model = false; $emit('on-selected-coin', item)"
        >
          <div class="center" style="gap: 14px;">
            <v-img-load
              :src="item.icon"
              :alt="`${item.name}s' coin`"
              sizes="29px"
              cover
            />

            <h5 class="mb-0">{{ item.name }}</h5>
          </div>

          <div class="d-flex flex-column">
            <span>{{ item.balance }} {{ item.coin }}</span>
            <span>${{ item.balance_usd }}</span>
          </div>
        </v-card>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
import tokens from '@/services/tokens';

export default {
  name: "ModalCryptos",
  data() {
    return {
      model: false,
      search: '',
      selectedCoin: undefined,
      dataTokens: [
        /* {
          contract: ,
          balance: walletUtils.formatTokenAmount(balance, metadata.decimals, 5),
          name: metadata.name,
          symbol: metadata.symbol,
          decimals: metadata.decimals,
          icon: metadata.icon,
          balance_usd: Number(walletUtils.formatTokenAmount(balance, metadata.decimals, 5)) * Number(price),
          price
        }*
        {
          img: require('@/assets/sources/tokens/eth.svg'),
          coin: "ETH",
          name: "ETHEREUM",
          amount: "59.744",
          currency: "79.379"
        }, */
      ]
    }
  },
  watch: {
    model(value) {
      if (!value) this.search = ''
    }
  },

  mounted() {
    this.loadTokens();
  },

  methods: {
    async loadTokens() {
      this.dataTokens = await tokens.getListTokensBalance()
    }
  },

}
</script>

<style lang="scss">
.modal-cryptos {

  .v-input {
    flex-grow: 1;
    transform-origin: right;
    max-width: 31px !important;

    transition: .3s cubic-bezier(0.86, 0, 0.07, 1);

    &__slot {
      min-height: 31px !important;
      outline: none !important;
    }

    .v-input__append-inner img {
      transform: translateX(-8px);
      transition: transform .3s ease;
    }

    &--is-focused {
      max-width: 100% !important;
      
      .v-input__append-inner img { transform: translateX(0) }
    }
  }


  .cryptos-card {
    --height: 600px;
    --padding-block: 29px;

    width: 317px;
    max-height: var(--height);
    border-radius: 20px;
    border: 1px solid #000;
    background-color: #F6F6F7 !important;
    padding-block: var(--padding-block);
    padding-right: 2px;

    .cryptos-card__wrapper {
      display: flex;
      flex-direction: column;
      scrollbar-gutter: stable;
      max-height: calc(var(--height) - var(--padding-block) * 2);
      border-radius: 0 !important;
      overflow-y: auto;
    }

    
    &-coin {
      --padding-inline: 20px;

      padding-inline: var(--padding-inline);
      padding-block: 16px;
      position: relative;

      &::after {
        content: '';
        position: absolute;
        inset: auto 0 0 0;
        margin-inline: auto;
        height: 1px;
        width: calc(100% - var(--padding-inline) * 2);
        background-color: var(--secondary);
      }

      &.active {
        background-color: hsl(216 99% 52% / .7) !important;
        &::after { background-color: #333 !important }

        * { color: #fff !important }
      }
    }

    
    h5 {
      --fw: 700;
      --fs: 12px;
      color: #000;
      font-family: var(--font2);
      line-height: normal;
    }

    span:first-child {
      --fw: 700;
      color: #000;
      text-align: right;
      font-size: 12px;
      font-family: var(--font2);
      line-height: normal;

      + span {
        --fw: 400;
        color: #333;
        text-align: right;
        font-family: var(--font2);
        font-size: 10px;
        line-height: normal;
      }
    }
  }
}
</style>
