const RavencoinWallet = require("../../dist/index.cjs");
jest.setTimeout(20 * 1000);
test("Test UTXOs for assets and base currency", async () => {
  const mnemonic =
    "mesh beef tuition ensure apart picture rabbit tomato ancient someone alter embrace";

  const network = "rvn-test";
  const wallet = await RavencoinWallet.createInstance({
    mnemonic,
    network,
  });

  const UTXOs = await wallet.getUTXOs();
  expect(UTXOs.length).toBeGreaterThanOrEqual(1);

  const assetUTXOs = await wallet.getAssetUTXOs();
  expect(assetUTXOs.length).toBeGreaterThanOrEqual(1);

  const assetDoesNotExistUTXOs = await wallet.getAssetUTXOs("AIXNEHXO");
  expect(assetDoesNotExistUTXOs.length).toBe(0);
});
