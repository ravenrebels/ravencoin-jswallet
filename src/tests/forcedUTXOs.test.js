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

test("Forced UTXOs must be part of transaction", async () => {
  const wallet = await walletPromise;

  const utxos = await wallet.getUTXOs();
  const address = utxos[0].address;
  const addressObject = wallet
    .getAddressObjects()
    .find((obj) => obj.address === address);
  const privateKey = addressObject.privateKey;
  const forcedUTXO = {
    utxo: utxos[0],
    address,
    privateKey,
  };

  //Now lets create a SendManyTransaction and make sure the forced utxo is there
  const wallet2 = await crazyCatWalletPromise;

  const options = {
    assetName: "BUTTER",
    forcedUTXOs: [forcedUTXO],
    wallet: wallet2,
    outputs: { mwPkBNKAnDtZnLEUavx3EV4oXsniqCiugm: 1 },
  };
  const sendManyTransaction = new SendManyTransaction(options);

  await sendManyTransaction.loadData();

  //UTXOs must include forcedUTXO

  const transactionUTXOs = sendManyTransaction.getUTXOs();

  const fo = transactionUTXOs.find((u) => u.txid === forcedUTXO.utxo.xid);

  expect(!!fo).not.toEqual(true);
});

test("Forced UTXOs must be part of transaction", async () => {
  const wallet = await walletPromise;

  const utxos = await wallet.getUTXOs();
  const address = utxos[0].address;
  const addressObject = wallet
    .getAddressObjects()
    .find((obj) => obj.address === address);
  const privateKey = addressObject.privateKey;
  const forcedUTXO = {
    utxo: utxos[0],
    address,
    privateKey,
  };

  //Now lets create a SendManyTransaction and make sure the forced utxo is there
  const wallet2 = await crazyCatWalletPromise;

  const options = {
    assetName: "BUTTER",
    forcedUTXOs: [forcedUTXO],
    wallet: wallet2,
    outputs: { mwPkBNKAnDtZnLEUavx3EV4oXsniqCiugm: 1 },
  };
  const sendManyTransaction = new SendManyTransaction(options);

  await sendManyTransaction.loadData();

  //UTXOs must include forcedUTXO

  const transactionUTXOs = sendManyTransaction.getUTXOs();

  const fo = transactionUTXOs.find((u) => u.txid === forcedUTXO.utxo.xid);

  expect(!!fo).not.toEqual(true);

  const amount = sendManyTransaction.getBaseCurrencyAmount();
  const change = sendManyTransaction.getBaseCurrencyChange();
  const fee = sendManyTransaction.getFee();

  const value = forcedUTXO.utxo.satoshis / 1e8;

  const diff = value - (fee + change);

  //TO make sure we have consumed the forced UTXO
  //The diff between inputs and outputs should be less than 1 RVN
  expect(diff < 1).toEqual(true);
});
