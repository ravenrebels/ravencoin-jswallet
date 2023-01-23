# ravencoin-jswallet
Ravencoin wallet library for JavaScript



## Example code

Example code for node.js, set "type":"module" in package.json to use import `instead` of `require`
```
//npm install https://github.com/ravenrebels/ravencoin-jswallet.git
import RavencoinWallet from "ravencoin-jswallet"; //installed from GitHub, not NPM

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
