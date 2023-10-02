const RavencoinWallet = require("../../dist/index.cjs");

jest.setTimeout(20 * 1000);

//Account "Crazy Cat" on https://testnet.ting.finance/
const mnemonic =
  "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

const walletPromise = RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
});

module.exports = walletPromise;