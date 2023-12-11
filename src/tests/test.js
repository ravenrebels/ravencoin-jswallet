const RavencoinWallet = require("../../dist/index.cjs");
const walletPromise = require("./getWalletPromise");
const expect = require("chai").expect;
//This mnemonic should be empty and super fast
const mnemonic =
  "caught actress master salt kingdom february spot brief barrel apart rely common";

it("Network rvn should give base currency RVN", async () => {
  const network = "rvn";
  const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network,
    offlineMode: true,
  });
  const baseCurrency = wallet.baseCurrency;
  expect(baseCurrency).to.equal("RVN");
});

it("Network evr should give base currency EVR", async () => {
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

    expect(baseCurrency).to.equal("EVR");
  } catch (e) {
    console.log("SUPER ERROR", e);
  }
});

it("Network rvn-test should give base currency RVN", async () => {
  const network = "rvn-test";
  const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network,
    offlineMode: true,
  });

  const baseCurrency = wallet.baseCurrency;
  expect(baseCurrency).to.equal("RVN");
});

it("Network evr-test should give base currency EVR", async () => {
  const mnemonic =
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

  const network = "evr-test";
  const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network,
    offlineMode: true,
  });

  const baseCurrency = wallet.baseCurrency;
  expect(baseCurrency).to.equal("EVR");
});

it("get balance", async () => {
  const wallet = await walletPromise;

  const balance = await wallet.getBalance();

  expect(isNaN(balance)).to.equal(false);
});

it("Test getHistory", async () => {
  let error = null;
  const wallet = await walletPromise;

  const result = await wallet.getHistory();

  expect(result.length > 0).to.equal(true);
});

it("Min amount of addresses", async function () {
  this.timeout(30 * 1000); //30 seconds, generating tons of addresses
  const mnemonic = "bla bla bla";
  const minAmountOfAddresses = 1000;
  wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network: "rvn-test",
    minAmountOfAddresses,
    offlineMode: true,
  });

  expect(wallet.getAddresses().length).to.be.at.least(minAmountOfAddresses);
});
