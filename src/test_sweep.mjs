import RavencoinWallet  from "./ravencoinWallet";
import {sweep} from "./blockchain/sweep";
 
jest.setTimeout(20 * 1000);

test("Sweep", async () => {
  //sight rate burger maid melody slogan attitude gas account sick awful hammer
  // MAINNET const WIF = "Kz5U4Bmhrng4o2ZgwBi5PjtorCeq2dyM7axGQfdxsBSwCKi5ZfTw";
  //TESTNET const WIF = "cUVdRNVobgjAw5jGWYkvbWmk42Vxzvte4btmsZ5qSqszdPi9M3Vy"
  const WIF = "cUVdRNVobgjAw5jGWYkvbWmk42Vxzvte4btmsZ5qSqszdPi9M3Vy";
  const network = "rvn-test";
  const wallet = await RavencoinWallet.createInstance({
    mnemonic:
      "frozen drift quiz glove wrong cycle glide increase hybrid arch endorse brisk",
    network,
    offlineMode: true,
  });

  const baseCurrency = wallet.baseCurrency;
  console.log("base currency", baseCurrency);
  expect(baseCurrency).toBe("RVN");
});
