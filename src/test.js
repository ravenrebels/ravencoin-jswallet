const RavencoinWallet = require("../dist/index.js");

console.log("RavencoinWallet", RavencoinWallet);
jest.setTimeout(300 * 1000);
test('get balance', async () => {

    //Account "Crazy Cat" on https://testnet.ting.finance/
    const mnemonic = "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

    const wallet = await RavencoinWallet.createInstance({ mnemonic, network: "rvn-test" })

    const balance = await wallet.getBalance();

    expect(isNaN(balance)).toBe(false);
});