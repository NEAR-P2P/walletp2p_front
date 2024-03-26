import axios from 'axios';
// import { utils } from "near-api-js";
// import * as nearAPI from "near-api-js";
// import utils from './utils';
import walletUtils from '@/services/wallet'
import localStorageUser from '~/services/local-storage-user';
// const { connect } = nearAPI;


function getListContractToken(address) {
  // https://api.kitwallet.app/account//likelyTokensFromBlock
  const network = !process.env.Network ? "-testnet" : process.env.Network === "mainnet" ? "" : "-testnet";
  return axios.get(`https://api${network}.nearblocks.io/v1/kitwallet/account/${address}/likelyTokensFromBlock?fromBlockTimestamp=0`)
    .then(response => {
      return response.data.list
    }).catch(error => {return error}
  );
}

// Caching mechanism for token price
const tokenPriceCache = new Map();

// Caching mechanism for token balance
const tokenBalanceCache = new Map();

async function getTokenBalance({ contract, address, symbol }) {
  // Check if token price is cached
  let priceToken = tokenPriceCache.get(symbol);
  if (!priceToken) {
      const getPrice = await walletUtils.getPrice("USD", symbol);
      if (getPrice) {
          priceToken = getPrice;
          tokenPriceCache.set(symbol, priceToken);
      }
  }

  // Check if token balance is cached
  const balanceKey = `${contract}-${address}`;
  let balanceData = tokenBalanceCache.get(balanceKey);
  if (balanceData) {
      return balanceData;
  }

  const account = await walletUtils.nearConnection();
  try {
      const response = await account.viewFunctionV1(contract, 'ft_balance_of', { account_id: address });
      balanceData = {
          balance: response,
          price: priceToken
      };
      // Cache token balance
      tokenBalanceCache.set(balanceKey, balanceData);
      return balanceData;
  } catch (error) {
      return { error };
  }
}

async function getTokenMetadata(contract) {
  const account = await walletUtils.nearConnection();
  return account.viewFunctionV1(
    contract,
    'ft_metadata',
  );
}

// Function to clear session storage when the user reloads the browser
window.addEventListener("beforeunload", () => {
  sessionStorage.clear();
});

async function getListTokensBalance() {
  try {
      const address = localStorageUser.getCurrentAccount().address;
      const contractFromBlock = await getListContractToken(address);
      if (!contractFromBlock) return;
      const listContract = contractFromBlock;
      const list = {
          fts: [],
          nfts: [],
      };

      // Fetch NEAR balance concurrently with other token balances, using session storage if available
      const nearBalancePromise = async () => {
          let nearBalanceData = sessionStorage.getItem('NEAR');
          if (nearBalanceData) {
              return JSON.parse(nearBalanceData); // Return data from session storage if available
          } else {
              const balanceNear = await walletUtils.getBalance();
              nearBalanceData = {
                  contract: "NEAR",
                  balance: balanceNear.near.toFixed(5),
                  balanceTotal: String(balanceNear.near),
                  name: "NEAR",
                  symbol: "NEAR",
                  decimals: 24,
                  icon: require('@/assets/sources/logos/near-icon.svg'),
                  balance_usd: balanceNear.usd.toFixed(2),
                  price: balanceNear.price
              };
              sessionStorage.setItem('NEAR', JSON.stringify(nearBalanceData)); // Store data in session storage
              return nearBalanceData;
          }
      };

      // Fetch token balances concurrently, using session storage if available
      const tokenBalancesPromises = listContract.map(async (contract) => {
          let tokenBalanceData = sessionStorage.getItem(contract);
          if (tokenBalanceData) {
              return JSON.parse(tokenBalanceData); // Return data from session storage if available
          } else {
              try {
                  const metadata = await getTokenMetadata(contract);
                  let { balance, price } = { balance: 0, price: 0 };
                  
                  const getBalance = await getTokenBalance({ contract, address, symbol: metadata.symbol });
                  if (getBalance) {
                      balance = getBalance.balance;
                      price = getBalance.price;
                  }

                  if (Number(balance) > 0) {
                      const balanceUsd = (Number(walletUtils.formatTokenAmount(balance, metadata.decimals, 5)) * Number(price)).toFixed(2);
                      let balanceofi = balance / Math.pow(10, metadata.decimals);

                      if (balanceofi.toString().includes('.')) {
                          const parts = balanceofi.toString().split('.');
                          if (parts[1].length > 14) {
                              balanceofi = parseFloat(parts[0] + '.' + parts[1].slice(0, 14));
                          }
                      }

                      tokenBalanceData = {
                          contract,
                          balance: walletUtils.formatTokenAmount(balance, metadata.decimals, 5),
                          balanceTotal: String(balanceofi),
                          name: metadata.name,
                          symbol: metadata.symbol,
                          decimals: metadata.decimals,
                          icon: metadata.name === 'Wrapped Ether' 
                              ? "https://assets.ref.finance/images/2396.png" 
                              : metadata.name === 'Wrapped NEAR fungible token' 
                                  ? require('@/assets/sources/logos/near-icon.svg') 
                                  : metadata.icon,
                          balance_usd: isNaN(balanceUsd) ? 0.00 : balanceUsd,
                          price
                      };
                      sessionStorage.setItem(contract, JSON.stringify(tokenBalanceData)); // Store data in session storage
                      return tokenBalanceData;
                  }
              } catch (error) {
                  // Handle errors if needed
              }
          }
      });

      // Execute all promises concurrently
      const [nearBalance, ...tokenBalances] = await Promise.all([nearBalancePromise(), ...tokenBalancesPromises]);

      // Add NEAR balance to the list
      list.fts.push(nearBalance);

      // Add token balances to the list
      list.fts.push(...tokenBalances.filter(Boolean)); // Remove any undefined entries

      return list;
  } catch (error) {
      // Handle errors if needed
  }
}


async function getInventoryUser() {
  const address = localStorageUser.getCurrentAccount().address;
  const list = {
    fts: [],
    nfts: [],
  };

  const balanceNear = await walletUtils.getBalance();

  list.fts.push({
    contract: "NEAR",
    balance: balanceNear.near.toFixed(5),
    name: "NEAR",
    symbol: "NEAR",
    decimals: 24,
    icon: require('@/assets/sources/logos/near-icon.svg'),
    balance_usd: balanceNear.usd.toFixed(2),
    price: balanceNear.price
  });

  await axios.get(`${process.env.URL_API_INDEXER}/account/${address}/inventory`)
  .then(response => {
    const data = response.data?.inventory;

    if(!data) throw new Error("no existe inventory");

    list.nfts = data.nfts

    list.fts = list.fts.concat(data.fts.map((item) => {
        const price = !item.ft_metas.price ? 0 : item.ft_metas.price;
        const balance = Number(walletUtils.formatTokenAmount(item.amount, item.ft_metas.decimals, 5));
        const balanceUsd = (balance * Number(price)).toFixed(2)
        return {
          contract: item.contract,
          balance: balance.toFixed(5),
          name: item.ft_metas.name,
          symbol: item.ft_metas.symbol,
          decimals: item.ft_metas.decimals,
          icon: item.ft_metas.icon,
          balance_usd: balanceUsd, // isNaN(balanceUsd) ? 0.00 : balanceUsd,
          price
        }
      })
    )
  }).catch(error => {
    console.log("error api nearblocks inventory: ", error)
  });

  return list
}



export default {
  getTokenBalance,
  getTokenMetadata,
  getListTokensBalance,
  getInventoryUser,
}