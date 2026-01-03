# Ravencoin & Evrmore JS Wallet

[![npm version](https://img.shields.io/npm/v/@ravenrebels/ravencoin-jswallet.svg?style=flat-square)](https://www.npmjs.com/package/@ravenrebels/ravencoin-jswallet)
[![license](https://img.shields.io/npm/l/@ravenrebels/ravencoin-jswallet.svg?style=flat-square)](https://github.com/ravenrebels/ravencoin-jswallet/blob/master/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ravenrebels/ravencoin-jswallet.svg?style=flat-square)](https://www.npmjs.com/package/@ravenrebels/ravencoin-jswallet)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)](https://www.typescriptlang.org/)

A light-weight, non-custodial JavaScript and TypeScript wallet library with full support for both Ravencoin (RVN) and Evrmore (EVR).

## Features

- **Non-custodial**: You own your keys (BIP39 mnemonics).
- **Dual Support**: Built-in support for both Ravencoin and Evrmore blockchains.
- **Asset Support**: Handle user-defined assets on both networks.
- **Flexible RPC**: Connect to public RPC nodes or your own local node.
- **TypeScript Ready**: Full type definitions for a better developer experience.

---

> [!CAUTION]
> **EXPERIMENTAL**: This library is undergoing active development. Please test thoroughly before using it for significant amounts. Use on mainnet at your own risk.

---
## Installation

```bash
npm install @ravenrebels/ravencoin-jswallet
```

## Quick Start

To run these code examples:

1. Create an empty npm project: `npm init -y`
2. Install the library: `npm install @ravenrebels/ravencoin-jswallet`
3. Create a file called `index.mjs`

### Minimalistic example

```
import RavencoinWallet from "@ravenrebels/ravencoin-jswallet";

RavencoinWallet.createInstance({
   mnemonic: "horse sort develop lab chest talk gift damp session sun festival squirrel",
   network: "rvn-test"
})
   .then(wallet => wallet.getBalance())
   .then(console.log);
```
### Usage Examples
```
import RavencoinWallet from "@ravenrebels/ravencoin-jswallet";
const wallet = await RavencoinWallet.createInstance({
  mnemonic:
    "horse sort develop lab chest talk gift damp session sun festival squirrel",
  network: "rvn-test",
});

//OK now you have your wallet

//Example, get your addresses
const addresses = wallet.getAddresses();

//Address objects contains meta data about addresses, such as path/private key
const addressObjects = wallet.getAddressObjects();
 
//Get assets the wallet holds (not including mempool transactions) 
const assets = await wallet.getAssets();

//Get balance of base currency, like RVN, not including mempool transactions
const balance = await wallet.getBalance();


const changeAddress = await wallet.getChangeAddress();
const receiveAddress = await wallet.getReceiveAddress();

const firstPrivateKey = wallet.getPrivateKeyByAddress(addresses[0]);

//History, is the list of deltas for all the addresses in this wallet
const history = await wallet.getHistory();

//Get this wallets entries in the mempool right now
const mempool = await wallet.getMempool();
 
//Example send and print out the id, will throw exception if fails
const sendResult = await wallet.send({
  toAddress: "muTv54qzXc6ozEc1RH2JbM92jzpBtVJBbw",
  amount: 1,
});
console.log(sendResult.transactionId);
```
### Configure to use with your local node

In this example we run a local node in testnet mode, and RPC port is set to 8888

```
const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network: "rvn-test",
    rpc_password: "mypassword",
    rpc_username: "myuser",
    rpc_url: "http://localhost:8888",
  });
```

### Send RVN and ASSETS

```
//index.mjs very important that file extension is .mjs
import RavencoinWallet from "@ravenrebels/ravencoin-jswallet";

//This wallet belongs to account "Crazy Cat" on https://testnet.ting.finance/signin/
const options = {
  mnemonic:
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace",
  network: "rvn-test",
};
const wallet = await RavencoinWallet.createInstance(options);
const addy = await wallet.getReceiveAddress();
console.log("My receive address", addy);

//Send 100 RVN to Barry Crump on https://testnet.ting.finance/
await wallet.send({
  //Send 100 RVN
  toAddress: "mhBKhj5FxzBu1h8U6pSB16pwmjP7xo4ehG",
  amount: 100,
  assetName:"RVN",
});

//Send 313 BUTTER tokens to Barry Crump on https://testnet.ting.finance/
const transactionId = await wallet.send({
  assetName: "BUTTER",
  amount: 313,
  toAddress: "mhBKhj5FxzBu1h8U6pSB16pwmjP7xo4ehG",
});
console.log("Sending", transactionId);
```

### Send many

```
//index.mjs very important that file extension is .mjs
import RavencoinWallet from "@ravenrebels/ravencoin-jswallet";

//This wallet belongs to account "Crazy Cat" on https://testnet.ting.finance/signin/
const options = {
  mnemonic:
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace",
  network: "rvn-test",
};
const wallet = await RavencoinWallet.createInstance(options);

//Send asset BUTTER to multiple recipients
const result = await wallet.sendMany({
  assetName: "BUTTER",
  outputs: {
    muTv54qzXc6ozEc1RH2JbM92jzpBtVJBbw: 1,
    mhWahrbRX6xBBrRjCo6ZkazaugXftD1CbM: 2,
  },
});

console.log("Sending", result.transactionId);

```

## Evrmore

To support EVR instead of RVN
Create an instance of wallet and set baseCurrency

```
wallet.setBaseCurrency("EVR");
```

## API Reference

When creating a wallet instance, you can provide several configuration options. 

### RPC Configuration
By default, the library uses public RPC services from **ting.finance**, allowing you to kickstart your development immediately without setting up your own infrastructure. As your application grows or if you prefer full control, you can easily switch to your own Ravencoin or Evrmore node by providing custom credentials. See the section [Run your own blockchain node](#run-your-own-blockchain-node) for more information.

```
export interface IOptions {
    mnemonic: string;
    network?: ChainType; (that is "rvn" | "rvn-test" | "evr" | "evr-test")
    rpc_username?: string;
    rpc_password?: string;
    rpc_url?: string;
}
```

Refer to the [TypeScript definitions](./dist/types.d.ts) for exhaustive technical details.

### Run your own blockchain node

If you want to run your own internet exposed Node, checkout our RPC proxy.
With **RPC proxy** and **Cloudlare** you can get a secure endpoint like
https://rpc.mydomain.com/rpc
checkout

- https://github.com/ravenrebels/ravencoin-rpc-proxy
- https://www.cloudflare.com/products/tunnel/

## Advanced - pure RPC

You have access to the underlaying RPC function, wallet.rpc.
See example

```
import RavencoinWallet from "@ravenrebels/ravencoin-jswallet";
async function main(){
  const wallet = await RavencoinWallet.createInstance({
    mnemonic: "horse sort develop lab chest talk gift damp session sun festival squirrel",
    network: "rvn-test",
  });
  const blockhash = await wallet.rpc("getbestblockhash", []);
  const block = await wallet.rpc("getblock", [blockhash]);
  console.log(block);
}
main();
```
