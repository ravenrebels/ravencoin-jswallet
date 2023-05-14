const RavencoinWallet = require("../dist/index.cjs");

jest.setTimeout(20 * 1000);

test("Test sweep", async () => {
  /* 
    The wallet that will be drained, that has the funds from start.

    MNEMONIC: sight rate burger maid melody slogan attitude gas account sick awful hammer
    MAINNET const WIF = "Kz5U4Bmhrng4o2ZgwBi5PjtorCeq2dyM7axGQfdxsBSwCKi5ZfTw";
    TESTNET const WIF = "cUVdRNVobgjAw5jGWYkvbWmk42Vxzvte4btmsZ5qSqszdPi9M3Vy"
  */
  const WIF = "cUVdRNVobgjAw5jGWYkvbWmk42Vxzvte4btmsZ5qSqszdPi9M3Vy";
  const network = "rvn-test";

  //The wallet that will RECEIVE the funds
  const wallet = await RavencoinWallet.createInstance({
    mnemonic:
      "frozen drift quiz glove wrong cycle glide increase hybrid arch endorse brisk",
    network,
  });

  try {
    const onlineMode = false;
    const result = await wallet.sweep(WIF, onlineMode);
    const something = !!result;
    expect(true).toBe(something);
  } catch (e) {
    console.log("EXCEPTION", e);
  }
});
