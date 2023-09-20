const RavencoinWallet = require("../../dist/index.cjs");

jest.setTimeout(20 * 1000);

//Account "Crazy Cat" on https://testnet.ting.finance/
const mnemonic =
  "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

const walletPromise = RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
});

test("Insufficient funds", async () => {
  const options = {
    assetName: "DECI", //Asset we do not have;
    toAddress: "mmmjadMR4LkmHjg7VHQSj3hyp9NjWidzT9",
    amount: 1000 * 1000,
  };
  const wallet = await walletPromise;
  let error = null;
  try {
    const result = await wallet.send(options);
  } catch (e) {
    error = e;
  }

  expect(error.name).toBe("InsufficientFundsError");
});
