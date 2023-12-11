const RavencoinWallet = require("../../dist/index.cjs");
const expect = require("chai").expect;
it("Change and to address cant be the same", async () => {
  const mnemonic = "bla bla bla";

  const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network: "rvn-test",
    offlineMode: true,
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
    (error + "").indexOf("Change address cannot be the same as toAddress") > -1;

  expect(changeAddressAndToAddressTheSame).to.be.true;

  return true;
});
