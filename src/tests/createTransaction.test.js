const RavencoinWallet = require("../../dist/index.cjs");

jest.setTimeout(10 * 1000);

//Should have 10 RVN on testnet
const mnemonic =
  "salad hammer want used web finger comic gold trigger accident oblige pluck";

const walletPromise = RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
  offlineMode: true,
});

test("Transaction should have RVN fee", async () => {
  const options = {
    toAddress: "mmmjadMR4LkmHjg7VHQSj3hyp9NjWidzT9",
    amount: 1,
  };
  const wallet = await walletPromise; 
  const sendResult = await wallet.createTransaction(options);
  expect(sendResult.debug.fee > 0).toBe(true);
});
