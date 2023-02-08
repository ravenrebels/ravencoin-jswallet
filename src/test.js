const RavencoinWallet = require("../dist/index.cjs");

jest.setTimeout(300 * 1000);

let wallet = null; //Loaded in the first test

test("get balance", async () => {
  //Account "Crazy Cat" on https://testnet.ting.finance/
  const mnemonic =
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

  wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network: "rvn-test",
  });

  const balance = await wallet.getBalance();

  expect(isNaN(balance)).toBe(false);
});

test("Insufficient funds", async () => {
    const options = {
        assetName: "DECI", //Asset we do not have;
        toAddress: "mmmjadMR4LkmHjg7VHQSj3hyp9NjWidzT9",
        amount: 1000 * 1000,
      };
    
      let error = null;
      try {
        const result = await wallet.send(options);
      } catch (e) {
        error = e;
      }
    
      expect(error.name).toBe("InsufficientFundsError");
    
});
test("Send asset we do not have", async () => {
  const options = {
    assetName: "FREN#RED", //Asset we do not have;
    toAddress: "mmmjadMR4LkmHjg7VHQSj3hyp9NjWidzT9",
    amount: 1,
  };

  let error = null;
  try {
    const result = await wallet.send(options);
  } catch (e) {
    error = e;
  }

  expect(error.name).toBe("InsufficientFundsError");
});
