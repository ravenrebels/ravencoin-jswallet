const walletPromise = require("./getWalletPromise");

test("Test UTXOs for assets and base currency", async () => {
  const wallet = await walletPromise;

  const UTXOs = await wallet.getUTXOs();

  expect(UTXOs.length).toBeGreaterThanOrEqual(1);

  const assetUTXOs = await wallet.getAssetUTXOs();

  expect(assetUTXOs.length).toBeGreaterThanOrEqual(1);
});
