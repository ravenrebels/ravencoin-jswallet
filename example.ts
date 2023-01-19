import ravencoinWallet from "./ravencoinWallet";

//Init the wallet
const wallet = ravencoinWallet.init(getMnemonic());

//Donate to C3 media
//const c3MediaDonations = "RXfXs7kEH7uMeDR2BQHGbhrNEVxaVZR7mR";
//wallet.send(c3MediaDonations, 1).then(console.log);

wallet.getBalance().then(b => console.log("Balance", b));

























function getMnemonic() {

    const mnemonic = "switch enact token move brush universe cave trick dignity seek craft alone";
    return mnemonic;
}