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

### Show RVN and ASSETS balance

```
import RavencoinWallet from "@ravenrebels/ravencoin-jswallet";

//This wallet belongs to account "Crazy Cat" on https://testnet.ting.finance/signin/
const options = {
    mnemonic: "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace",
    network: "rvn-test"
}
async function work() {
    console.log("Init wallet.......");
    const wallet = await RavencoinWallet.createInstance(options);
    //const address = await wallet.getReceiveAddress();
    const balance = await wallet.getBalance();
    console.log("Balance", balance.toLocaleString());

    //Send 313 RVN to account Barry Crump on https://testnet.ting.finance/signin/
    const transactionId = await wallet.send("mhBKhj5FxzBu1h8U6pSB16pwmjP7xo4ehG", 313);
    console.log("Sending", transactionId);
}
work();

```


## API
```
declare class Wallet {
    rpc: (method: string, params: any[]) => Promise<any>; 
    getAddressObjects(): IAddressMetaData[];
    getAddresses(): Array<string>;
    init(options: IOptions): Promise<void>;
    hasHistory(addresses: Array<string>): Promise<boolean>;
 
    getReceiveAddress(): Promise<string>;
    getChangeAddress(): Promise<string>;
    getUTXOs(): Promise<any>;
    getPrivateKeyByAddress(address: string): string;
    send(toAddress: string, amount: number): Promise<any>;
    getAssets(): Promise<any>;
    getBalance(): Promise<number>;
}
```