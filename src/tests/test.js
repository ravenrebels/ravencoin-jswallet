const RavencoinWallet = require("../../dist/index.cjs");

jest.setTimeout(20 * 1000);

//Account "Crazy Cat" on https://testnet.ting.finance/
const mnemonic =
  "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

const walletPromise = RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
});

test("Test UTXOs for assets and base currency", async () => {
  const wallet = await walletPromise;

  const UTXOs = await wallet.getUTXOs();
  expect(UTXOs.length).toBeGreaterThanOrEqual(1);
  const assetUTXOs = await wallet.getAssetUTXOs();
  expect(assetUTXOs.length).toBeGreaterThanOrEqual(1);
});

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
