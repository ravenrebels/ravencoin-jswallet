const walletPromise = require("./getWalletPromise");
const expect = require("chai").expect;
it("Test UTXOs for assets and base currency", async () => {
  const wallet = await walletPromise;

  const UTXOs = await wallet.getUTXOs();

  expect(UTXOs.length).to.be.at.least(1);

  const assetUTXOs = await wallet.getAssetUTXOs();

  expect(assetUTXOs.length).to.be.at.least(1);
});
