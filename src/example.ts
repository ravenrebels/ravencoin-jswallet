import ravencoinWallet from "./ravencoinWallet";
import * as testnet_example from "./example_testnet";//import it to make typescript build it

async function work() {

    //Init the wallet
    const options = {
        mnemonic: getMnemonic()
    }
    const wallet = await ravencoinWallet.init(options);

    //Donate to C3 media
    //const c3MediaDonations = "RXfXs7kEH7uMeDR2BQHGbhrNEVxaVZR7mR";
    //wallet.send(c3MediaDonations, 1).then(console.log);

    wallet.getBalance().then(b => console.log("Balance", b));
}
work();

























function getMnemonic() {

    const mnemonic = "switch enact token move brush universe cave trick dignity seek craft alone";
    return mnemonic;
}