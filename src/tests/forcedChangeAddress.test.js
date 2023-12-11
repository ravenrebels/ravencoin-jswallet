const RavencoinWallet = require("../../dist/index.cjs");
const expect = require("chai").expect;
const SendManyTransaction = RavencoinWallet.SendManyTransaction;
const crazyCatWalletPromise = require("./getWalletPromise");

//Should have 10 RVN on testnet
const mnemonic =
  "salad hammer want used web finger comic gold trigger accident oblige pluck";

const walletPromise = RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
  offlineMode: true,
});

it("Forced change address for assets", async () => {
  const wallet = await walletPromise;

  //Now lets create a SendManyTransaction and make sure the forced utxo is there
  const wallet2 = await crazyCatWalletPromise;

  const options = {
    assetName: "BUTTER",
    forcedChangeAddressAssets: "mkupbsCoqXbqYnheWbJk21hmKPd6TRVcpz",
    wallet: wallet2,
    outputs: { mwPkBNKAnDtZnLEUavx3EV4oXsniqCiugm: 1 },
  };
  const sendManyTransaction = new SendManyTransaction(options);

  await sendManyTransaction.loadData();

  const outputs = await sendManyTransaction.getOutputs();

  const containsChangeAddress =
    Object.keys(outputs).indexOf(options.forcedChangeAddressAssets) > -1;

  expect(containsChangeAddress).to.be.true;
  return true;
});

it("Forced change address for base currency", async () => {
  const wallet = await walletPromise;

  //Now lets create a SendManyTransaction and make sure the forced utxo is there
  const wallet2 = await crazyCatWalletPromise;

  const options = {
    assetName: "BUTTER",
    forcedChangeAddressAssets: "mkupbsCoqXbqYnheWbJk21hmKPd6TRVcpz",
    forcedChangeAddressBaseCurrency: "n1iUKTsB5v3R4KAdsh1jwtHHELC6dFpB9G",
    wallet: wallet2,
    outputs: { mwPkBNKAnDtZnLEUavx3EV4oXsniqCiugm: 1 },
  };
  const sendManyTransaction = new SendManyTransaction(options);

  await sendManyTransaction.loadData();

  const outputs = await sendManyTransaction.getOutputs();

  const addy = options.forcedChangeAddressBaseCurrency;
  const inc = Object.keys(outputs).indexOf(addy) > -1;

  expect(inc).to.be.true;
  return true;
});
