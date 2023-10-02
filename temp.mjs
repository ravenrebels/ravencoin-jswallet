import RavencoinWallet from "./dist/index.mjs";
import Signer from "@ravenrebels/ravencoin-sign-transaction";
const mnemonic =
  "salad hammer want used web finger comic gold trigger accident oblige pluck";

const wallet = await RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
});

//Mnemonic wheat vessel know welcome course happy system mutual hand bottom song escape
const outputsOLD = {
  mxD9SHCyUCvMxEWnCnTfhQuBnDq4wbR4As: 2,
  mvst2Bdxa4XzNEXnKA4JJpJ8r7y8dqyLvN: 1,
  mzJ5fFwkiCApy2m432VuojLFTdStYhgavq: 1,
};
const crazyCat = await RavencoinWallet.createInstance({
  mnemonic:
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace",
  network: "rvn-test",
});

const outputs = {};
for (let i = 0; i < 100; i++) {
  const addy = crazyCat.getAddresses()[i];
  outputs[addy] = 1;
}
const sendManyTransaction = await wallet.sendMany({
  outputs,
  // assetName: "QKN",
});
await sendManyTransaction.loadData();
const inputs = sendManyTransaction.getInputs();
const outs = await sendManyTransaction.getOutputs();
console.log("fee", sendManyTransaction.getFee());

const raw = await wallet.rpc("createrawtransaction", [inputs, outs]);

const signed = Signer.sign(
  "rvn-test",
  raw,
  sendManyTransaction.getUTXOs(),
  sendManyTransaction.getPrivateKeys()
);

wallet.rpc("sendrawtransaction", [signed]).then(console.log).catch(console.log);
await wallet.getReceiveAddress().then(console.log);
