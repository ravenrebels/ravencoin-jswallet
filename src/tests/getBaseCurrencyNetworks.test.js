const RavencoinWallet = require("../../dist/index.cjs");
console.log("RavencoinWallet", RavencoinWallet);

const getBaseCurrencyByNetwork =
  RavencoinWallet.default.getBaseCurrencyByNetwork;
test("getBaseCurrencyByNetwork", async () => {
  expect(getBaseCurrencyByNetwork("evr")).toBe("EVR");
  expect(getBaseCurrencyByNetwork("evr-test")).toBe("EVR");

  expect(getBaseCurrencyByNetwork("rvn")).toBe("RVN");
  expect(getBaseCurrencyByNetwork("rvn-test")).toBe("RVN");
});
