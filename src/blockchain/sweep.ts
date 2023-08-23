import RavencoinKey, { Network } from "@ravenrebels/ravencoin-key";
import Signer from "@ravenrebels/ravencoin-sign-transaction";

!!Signer.sign; //"Idiocracy" but prevents bundle tools such as PARCEL to strip this dependency out on build.

import { Wallet } from "../ravencoinWallet";
import { IInput, SweepResult } from "../Types";
import { getTwoDecimalTrunc } from "./Transactor";

//sight rate burger maid melody slogan attitude gas account sick awful hammer
//OH easter egg ;)
const WIF = "Kz5U4Bmhrng4o2ZgwBi5PjtorCeq2dyM7axGQfdxsBSwCKi5ZfTw";

/**
 *
 * @param WIF the private key in wallet import format that you want to sweep/empty
 * @param wallet your wallet
 * @returns a string of a signed transaction, you have to broad cast it
 */
export async function sweep(
  WIF: string,
  wallet: Wallet,
  onlineMode: boolean
): Promise<SweepResult> {
  const privateKey = RavencoinKey.getAddressByWIF(wallet.network, WIF);

  const result: SweepResult = {};
  const rpc = wallet.rpc;
  const obj = {
    addresses: [privateKey.address],
  };
  const baseCurrencyUTXOs = await rpc("getaddressutxos", [obj]);
  const obj2 = {
    addresses: [privateKey.address],
    assetName: "*",
  };

  const assetUTXOs = await rpc("getaddressutxos", [obj2]);
  const UTXOs = assetUTXOs.concat(baseCurrencyUTXOs);
  result.UTXOs = UTXOs;
  //Create a raw transaction with ALL UTXOs

  if (UTXOs.length === 0) {
    result.errorDescription = "Address " + privateKey.address + " has no funds";
    return result;
  }
  const balanceObject = {};

  UTXOs.map((utxo) => {
    if (!balanceObject[utxo.assetName]) {
      balanceObject[utxo.assetName] = 0;
    }
    balanceObject[utxo.assetName] += utxo.satoshis;
  });

  const keys = Object.keys(balanceObject);

  //Start simple, get the first addresses from the wallet

  const outputs = {};

  const fixedFee = 0.02; // should do for now
  keys.map((assetName, index) => {
    const address = wallet.getAddresses()[index];
    const amount = balanceObject[assetName] / 1e8;

    if (assetName === wallet.baseCurrency) {
      outputs[address] = getTwoDecimalTrunc(amount - fixedFee);
    } else {
      outputs[address] = {
        transfer: {
          [assetName]: amount,
        },
      };
    }
  });
  result.outputs = outputs;

  //Convert from UTXO format to INPUT fomat
  const inputs: Array<IInput> = UTXOs.map((utxo, index) => {
    /*   {
         "txid":"id",                      (string, required) The transaction id
         "vout":n,                         (number, required) The output number
         "sequence":n                      (number, optional) The sequence number
       } 
       */

    const input: IInput = {
      txid: utxo.txid,
      vout: utxo.outputIndex,
    };
    return input;
  });
  //Create raw transaction
  const rawHex = await rpc("createrawtransaction", [inputs, outputs]);

  const privateKeys = {
    [privateKey.address]: WIF,
  };
  const signedHex = Signer.sign(wallet.network, rawHex, UTXOs, privateKeys);
  result.rawTransaction = signedHex;
  if (onlineMode === true) {
    result.transactionId = await rpc("sendrawtransaction", [signedHex]);
  }

  return result;
}
