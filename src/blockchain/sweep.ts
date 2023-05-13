import RavencoinKey, { Network } from "@ravenrebels/ravencoin-key";
import Signer from "@ravenrebels/ravencoin-sign-transaction";

import { Wallet } from "../ravencoinWallet";

//sight rate burger maid melody slogan attitude gas account sick awful hammer
const WIF = "Kz5U4Bmhrng4o2ZgwBi5PjtorCeq2dyM7axGQfdxsBSwCKi5ZfTw";

/**
 *
 * @param WIF the private key in wallet import format that you want to sweep/empty
 * @param wallet your wallet
 * @returns a string of a signed transaction, you have to broad cast it
 */
export async function sweep(
  WIF: string,
  wallet: Wallet
): Promise<string | null> {
  const privateKey = RavencoinKey.getAddressByWIF(wallet.network, WIF);

  const rpc = wallet.rpc;
  const obj = {
    addresses: [privateKey.address],
  };
  const baseCurrencyUTXOs = await rpc("getaddressutxos", [obj]);
  console.log("Processing address", privateKey.address);
  const obj2 = {
    addresses: [privateKey.address],
    assetName: "*",
  };

  const assetUTXOs = await rpc("getaddressutxos", [obj2]);
  const UTXOs = assetUTXOs.concat(baseCurrencyUTXOs);
  console.log("UTXOS", UTXOs);
  //Create a raw transaction with ALL UTXOs

  if (UTXOs.length === 0) {
    return null;
  }
  const balanceObject = {};

  UTXOs.map((utxo) => {
    if (!balanceObject[utxo.assetName]) {
      balanceObject[utxo.assetName] = 0;
    }

    balanceObject[utxo.assetName] += utxo.satoshis;
  });

  const keys = Object.keys(balanceObject);
  console.log("we need", keys.length, "addresses");

  //Start simple, get the first addreses from the wallet

  const outputs = {};

  const fixedFee = 0.02; // should do for now
  keys.map((assetName, index) => {
    const address = wallet.getAddresses()[index];
    const amount = balanceObject[assetName] / 1e8;

    if (assetName === wallet.baseCurrency) {
      outputs[address] = amount - fixedFee;
    } else {
      outputs[address] = {
        transfer: {
          [assetName]: amount,
        },
      };
    }
  });

  console.log(outputs);

  //Convert from UTXO format ot INPUT fomat
  const inputs = UTXOs.map((utxo, index) => {
    /*   {
         "txid":"id",                      (string, required) The transaction id
         "vout":n,                         (number, required) The output number
         "sequence":n                      (number, optional) The sequence number
       } 
       */

    const input = {
      txid: utxo.txid,
      vout: utxo.outputIndex,
      sequence: index,
    };
    return input;
  });
  //Create raw transaction
  const rawHex = await rpc("createrawtransaction", [inputs, outputs]);

  const privateKeys = {
    [privateKey.address]: WIF,
  };
  const signedHex = Signer.sign(wallet.network, rawHex, UTXOs, privateKeys);
  return rpc("sendrawtransaction", [signedHex]);
}
