const RavencoinWallet = require("../../dist/index.cjs");

jest.setTimeout(20 * 1000);

//Account "Crazy Cat" on https://testnet.ting.finance/
const mnemonic =
  "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

const walletPromise = RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
  offlineMode: true,
});

test("Send asset we do not have", async () => {
  const options = {
    assetName: "FREN#RED", //Asset we do not have;
    toAddress: "mmmjadMR4LkmHjg7VHQSj3hyp9NjWidzT9",
    amount: 1,
  };
  const wallet = await walletPromise;

  let error = null;
  try {
    //const asdf = await wallet.createTransaction(options);

    const result = await wallet.send(options);
  } catch (e) {
    console.log("" + e);
    error = e;
  }

  expect(error.name).toBe("InsufficientFundsError");
});
