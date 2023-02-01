# ravencoin-jswallet

Ravencoin wallet library for JavaScript

##

EXPERIMENTAL. DO NOT USE IN PRODUCTION

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

await wallet.send({
  //Send 100 RVN
  toAddress: "mhBKhj5FxzBu1h8U6pSB16pwmjP7xo4ehG",
  amount: 100,
});

//Send 313 BUTTER tokens to Barry Crump on https://testnet.ting.finance/
const transactionId = await wallet.send({
  assetName: "BUTTER",
  amount: 313,
  toAddress: "mhBKhj5FxzBu1h8U6pSB16pwmjP7xo4ehG",
});
console.log("Sending", transactionId);




```

## API

[Check the TypeScript definitions ](./dist/types.d.ts)
