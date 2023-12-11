const RavencoinWallet = require("../../dist/index.cjs");
const expect = require("chai").expect;

it("Test receive and change address", async () => {
  /* 
   Change address and receive address should NOT be the same
  */
  const network = "rvn-test";

  const wallet = await RavencoinWallet.createInstance({
    mnemonic:
      "frozen drift quiz glove wrong cycle glide increase hybrid arch endorse brisk",
    network,
  });

  try {
    const receiveAddress = await wallet.getReceiveAddress();
    const changeAddress = await wallet.getChangeAddress();

    expect(receiveAddress).to.not.equal(changeAddress);
    return true;
  } catch (e) {
    console.log("EXCEPTION", e);
  }
});
