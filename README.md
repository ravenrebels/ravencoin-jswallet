# ravencoin-jswallet

Ravencoin wallet library for JavaScript.
By default it interacts with the Ravencoin blockchain using RPC services from
https://rpc.ting.finance/ for both testnet and mainnet.
You are free to use any RPC-service you like, including your own.
See section [An Internal Link to a Section Heading](#run-your-own-blockchain-node) for more info

##

EXPERIMENTAL.  

This lib needs a lot of testing before being used in production.
Only use on mainnet if you "play around".
This lib supports EVR as well (see section at the end)

## Example code

To run these code examples

1. Create an empty npm project
2. Install `@ravenrebels/ravencoin-jswallet`
3. Set "type" to "module" in your package.json
4. Create a .mjs file called `index.mjs`

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

## Evrmore

To support EVR instead of RVN
Create an instance of wallet and set baseCurrency

```
wallet.setBaseCurrency("EVR");
```

## API

When you create your instance of a wallet you can specify some stuff.

You can set network to be something else than RVN, for example EVR.

You can specify your own RPC node URL and username/password.

```
export interface IOptions {
    mnemonic: string;
    network?: ChainType; (that is "rvn" | "rvn-test" | "evr" | "evr-test")
    rpc_username?: string;
    rpc_password?: string;
    rpc_url?: string;
}
```
[Check the TypeScript definitions ](./dist/types.d.ts) for all the details
### Run your own blockchain node
If you want to run your own internet exposed Node, checkout our RPC proxy.
With **RPC proxy** and **Cloudlare** you can get a secure endpoint like
https://rpc.mydomain.com/rpc
checkout 
- https://github.com/ravenrebels/ravencoin-rpc-proxy
- https://www.cloudflare.com/products/tunnel/




