const RavencoinWallet = require("../dist/index.cjs");

jest.setTimeout(20 * 1000);

let wallet = null; //Loaded in the first test

test("getBaseCurrencyByNetwork", async () => {
  expect(RavencoinWallet.getBaseCurrencyByNetwork("evr")).toBe("EVR");
  expect(RavencoinWallet.getBaseCurrencyByNetwork("evr-test")).toBe("EVR");

  expect(RavencoinWallet.getBaseCurrencyByNetwork("rvn")).toBe("RVN");
  expect(RavencoinWallet.getBaseCurrencyByNetwork("rvn-test")).toBe("RVN");
});

test("Network rvn should give base currency RVN", async () => {
  const mnemonic =
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

  const network = "rvn";
  const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network,
    offlineMode: true,
  });
  const baseCurrency = wallet.baseCurrency;
  expect(baseCurrency).toBe("RVN");
});

test("Network evr should give base currency EVR", async () => {
  const mnemonic =
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

  const network = "evr";
  const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network,
    offlineMode: true,
  });
  const baseCurrency = wallet.baseCurrency;
  expect(baseCurrency).toBe("EVR");
});

test("Network rvn-test should give base currency RVN", async () => {
  const mnemonic =
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

  const network = "rvn-test";
  const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network,
    offlineMode: true,
  });

  const baseCurrency = wallet.baseCurrency;
  expect(baseCurrency).toBe("RVN");
});

test("Network evr-test should give base currency EVR", async () => {
  const mnemonic =
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

  const network = "evr-test";
  const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network,
    offlineMode: true,
  });

  const baseCurrency = wallet.baseCurrency;
  expect(baseCurrency).toBe("EVR");
});

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

test("Test getHistory", async () => {
  let error = null;

  const result = await wallet.getHistory();

  expect(result.length > 0).toBe(true);
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

test("Change and to address cant be the same", async () => {
  const mnemonic = "bla bla bla";

  wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network: "rvn-test",
  });

  let error = null;
  const changeAddress = await wallet.getChangeAddress();
  try {
    await wallet.send({
      toAddress: changeAddress,
      amount: 1,
    });
  } catch (e) {
    error = e;
  }
  const changeAddressAndToAddressTheSame =
    (error + "").indexOf(
      "Wallet.send change address cannot be the same as toAddress"
    ) > -1;

  expect(changeAddressAndToAddressTheSame).toBe(true);
});
