const RavencoinWallet = require("../../dist/index.cjs");
const walletPromise = require("./getWalletPromise");
jest.setTimeout(20 * 1000);

//This mnemonic should be empty and super fast
const mnemonic =
"caught actress master salt kingdom february spot brief barrel apart rely common";


test("Network rvn should give base currency RVN", async () => {


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
  try {
    const wallet = await RavencoinWallet.createInstance({
      mnemonic,
      network,
      offlineMode: true,
    });

    const baseCurrency = wallet.baseCurrency;

    expect(baseCurrency).toBe("EVR");
  } catch (e) {
    console.log("SUPER ERROR", e);
  }
});

test("Network rvn-test should give base currency RVN", async () => {
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
  const wallet = await walletPromise;

  const balance = await wallet.getBalance();

  expect(isNaN(balance)).toBe(false);
});

test("Test getHistory", async () => {
  let error = null;
  const wallet = await walletPromise;

  const result = await wallet.getHistory();

  expect(result.length > 0).toBe(true);
});

test("Min amount of addresses", async () => {
  const mnemonic = "bla bla bla";
  const minAmountOfAddresses = 1000;
  wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network: "rvn-test",
    minAmountOfAddresses,
    offlineMode: true,
  });

  expect(wallet.getAddresses().length).toBeGreaterThanOrEqual(
    minAmountOfAddresses
  );
});
