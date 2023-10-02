const RavencoinWallet = require("../../dist/index.cjs");

jest.setTimeout(20 * 1000);

const mnemonic =
  "salad hammer want used web finger comic gold trigger accident oblige pluck";

const walletPromise = RavencoinWallet.createInstance({
  mnemonic,
  network: "rvn-test",
});

test("Test create send many transaction", async () => {
  const wallet = await walletPromise;

  //Mnemonic wheat vessel know welcome course happy system mutual hand bottom song escape
  const outputs = {
    mxD9SHCyUCvMxEWnCnTfhQuBnDq4wbR4As: 2,
    mvst2Bdxa4XzNEXnKA4JJpJ8r7y8dqyLvN: 1,
    mzJ5fFwkiCApy2m432VuojLFTdStYhgavq: 11,
  };
});
