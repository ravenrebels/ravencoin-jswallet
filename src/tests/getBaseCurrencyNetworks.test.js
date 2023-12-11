const RavencoinWallet = require("../../dist/index.cjs");
const expect = require("chai").expect;
const getBaseCurrencyByNetwork =
  RavencoinWallet.default.getBaseCurrencyByNetwork;
it("getBaseCurrencyByNetwork", async () => {
  expect(getBaseCurrencyByNetwork("evr")).to.equal("EVR");
  expect(getBaseCurrencyByNetwork("evr-test")).to.equal("EVR");

  expect(getBaseCurrencyByNetwork("rvn")).to.equal("RVN");
  expect(getBaseCurrencyByNetwork("rvn-test")).to.equal("RVN");
});
