import {
  IUTXO,
  IValidateAddressResponse,
  IVout,
  IVout_when_creating_transactions,
  RPCType,
} from "../Types";
import { ITransaction } from "../Types";

const ONE_HUNDRED_MILLION = 1e8;

export function getAddressDeltas(rpc: RPCType, addresses: string[]) {
  return rpc("getaddressdeltas", [
    {
      addresses: addresses,
      assetName: "",
    },
  ]);
}
export function sendRawTransaction(rpc: RPCType, signedTransaction: any) {
  const p = rpc("sendrawtransaction", [signedTransaction.hex]);
  p.catch((e: any) => {
    console.log("send raw transaction");
    console.dir(e);
  });
  return p;
}
export function signRawTransaction(
  rpc: RPCType,
  rawTransactionHex: any,
  privateKeys: Array<string>
) {
  const s = rpc("signrawtransaction", [
    rawTransactionHex,
    null,
    privateKeys,
  ]);
  return s;
}

export function decodeRawTransaction(rpc: RPCType, raw: string) {
  return rpc("decoderawtransaction", [raw]);
}

export function getRawTransaction(rpc: RPCType, id: string): any {
  return rpc("getrawtransaction", [id, true]);
}
export function createRawTransaction(
  rpc: RPCType,
  inputs: any,
  outputs: any
): Promise<string> {
  return rpc("createrawtransaction", [inputs, outputs]);
}

export async function validateAddress(
  rpc: RPCType,
  address: string
): Promise<IValidateAddressResponse> {
  return rpc("validateaddress", [address]);
}
export function getBalance(
  rpc: RPCType,
  addresses: Array<string>
): Promise<any> {
  const includeAssets = true;
  const promise = rpc("getaddressbalance", [
    { addresses: addresses },
    includeAssets,
  ]);
  return promise;
}

export function _sortUTXOs(list: Array<IUTXO>) {
  //Remember, sort mutates the underlaying array
  //Sort by satoshis, lowest first to prevent dust.
  return list.sort(function (a, b) {
    if (a.satoshis > b.satoshis) {
      return 1;
    }
    if (a.satoshis < b.satoshis) {
      return -1;
    }
    return 0;
  });
}
export async function getRavenUnspentTransactionOutputs(
  rpc: RPCType,
  addresses: Array<string>
): Promise<Array<IUTXO>> {
  const list: Array<IUTXO> = await rpc("getaddressutxos", [
    { addresses },
  ]);
  _sortUTXOs(list);
  return list;
}
export function getAssetUnspentTransactionOutputs(
  rpc: RPCType,
  addresses: Array<string>,
  assetName: string
): Promise<Array<IUTXO>> {
  const assets = rpc("getaddressutxos", [{ addresses, assetName }]);
  return assets;
}

export function getAllUnspentTransactionOutputs(
  rpc: RPCType,
  addresses: Array<string>
) {
  /*
  Seems like getaddressutxos either return RVN UTXOs or asset UTXOs
  Never both.
  So we make two requests and we join the answer
  */
  const raven = rpc("getaddressutxos", [{ addresses }]);
  const assets = rpc("getaddressutxos", [{ addresses, assetName: "*" }]);

  return Promise.all([raven, assets]).then((values: Array<any>) => {
    const all = values[0].concat(values[1]);
    return all;
  });
}
export async function getMempool(rpc: RPCType): Promise<Array<ITransaction>> {
  const ids = await rpc("getrawmempool", []);

  const result: any = [];
  for (const id of ids) {
    const transaction = await getRawTransaction(rpc, id);
    result.push(transaction);
  }
  return result;
}
export function convertUTXOsToVOUT(
  UTXOs: Array<IUTXO>
): Array<IVout_when_creating_transactions> {
  const inputs = UTXOs.map(function (bla) {
    //OK we have to convert from "unspent" format to "vout"

    const obj = {
      txid: bla.txid,
      vout: bla.outputIndex,
      address: bla.address,
    };
    return obj;
  });
  return inputs;
}
