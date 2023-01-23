# ravencoin-jswallet
Ravencoin wallet library for JavaScript



## Example code

Example code for node.js, set "type":"module" in package.json to use import `instead` of `require`
```
//npm install https://github.com/ravenrebels/ravencoin-jswallet.git
import ravencoinWallet from "ravencoin-jswallet"; //installed from GitHub, not NPM

const options = {
    mnemonic: "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace",
    network: "rvn-test"
}
async function work() {

    const wallet = await ravencoinWallet.init(options);


    const address = await wallet.getReceiveAddress();
    const balance = await wallet.getBalance();
    console.table([
        { "Prop": "Balance", "Value": balance.toLocaleString() },
        { "Prop": "Address", "Value": address }]);
}
work();  

``` 
