const RavencoinWallet = require("../../dist/index.cjs");

const SendManyTransaction = RavencoinWallet.SendManyTransaction;
const crazyCatWalletPromise = require("./getWalletPromise");

jest.setTimeout(10 * 2000);

//Should have 10 RVN on testnet
const mnemonic =
  "salad hammer want used web finger comic gold trigger accident oblige pluck";

const walletPromise = RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
  offlineMode: true,
});

test("Forced change address for assets", async () => {
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

  const containsChnageAddress =
    Object.keys(outputs).indexOf(options.forcedChangeAddressAssets) > -1;

  expect(containsChnageAddress).toBe(true);
});

test("Forced change address for base currency", async () => {
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

  expect(inc).toBe(true);
});
