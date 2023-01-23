# ravencoin-jswallet
Ravencoin wallet library for JavaScript



## Example code

```
import ravencoinWallet from "HOLD ON COMING SOON";

const options = {
    mnemonic: "asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf asdf",
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
