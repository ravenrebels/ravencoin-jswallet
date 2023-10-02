import RavencoinWallet from "./dist/index.mjs";
import Signer from "@ravenrebels/ravencoin-sign-transaction";
const mnemonic =
  "salad hammer want used web finger comic gold trigger accident oblige pluck";

const wallet = await RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
});

//Mnemonic wheat vessel know welcome course happy system mutual hand bottom song escape
const outputs = {
  mxD9SHCyUCvMxEWnCnTfhQuBnDq4wbR4As: 2,
  mvst2Bdxa4XzNEXnKA4JJpJ8r7y8dqyLvN: 1,
  mzJ5fFwkiCApy2m432VuojLFTdStYhgavq: 0.4,
};

const sendManyTransaction = await wallet.sendMany({
  outputs,
  assetName: "QKN",
});
await sendManyTransaction.loadData();
const inputs = sendManyTransaction.getInputs();
const outs = await sendManyTransaction.getOutputs();

const raw = await wallet.rpc("createrawtransaction", [inputs, outs]);
const decoded = await wallet.rpc("decoderawtransaction", [raw]);

const utxos = sendManyTransaction.getUTXOs();
for (let u of utxos) {
  u.amount = u.satoshis / 1e8;
}

console.log(JSON.stringify(decoded));
process.exit(1);

const signed = Signer.sign(
  "rvn-test",
  raw,
  sendManyTransaction.getUTXOs(),
  sendManyTransaction.getPrivateKeys()
);
console.log(signed);

wallet.rpc("sendrawtransaction", [signed]).catch(console.log);
