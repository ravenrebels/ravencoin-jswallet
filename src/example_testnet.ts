import ravencoinWallet, { IOptions } from "./ravencoinWallet";

//Init the wallet
const options: IOptions = {
    mnemonic: "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace",
    network: "rvn-test"
}
async function work() {

    const wallet = await ravencoinWallet.init(options);
 
    wallet.getReceiveAddress().then(address => console.log("Addresss", address))
    wallet.getBalance().then(b => console.log("Balance", b.toLocaleString()));
}
work();


