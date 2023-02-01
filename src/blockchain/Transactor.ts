import {
  IAddressMetaData,
  ISendResult,
  IUTXO,
  IVout,
  IVout_when_creating_transactions,
  RPCType,
} from "../Types";
import * as blockchain from "./blockchain";

import { ITransaction } from "../Types";
import { ONE_FULL_COIN } from "../contants";

interface IInternalSendIProp {
  fromAddressObjects: Array<IAddressMetaData>;
  amount: number;
  assetName: string;
  toAddress: string;
  rpc: RPCType;
}

async function isValidAddress(rpc: RPCType, address: string) {
  const obj = await blockchain.validateAddress(rpc, address);
  return obj.isvalid === true;
}

function sumOfUTXOs(UTXOs: Array<IUTXO>) {
  let unspentRavencoinAmount = 0;
  UTXOs.map(function (item) {
    const newValue = item.satoshis / 1e8;
    unspentRavencoinAmount = unspentRavencoinAmount + newValue;
  });
  return unspentRavencoinAmount;
}
/*

    "Chicken and egg" situation.
    We need to calculate how much we shall pay in fees based on the size of the transaction.
    When adding inputs/outputs for the fee, we increase the fee.

    Lets start by first assuming that we will pay 1 RVN in fee (that is sky high).
    Than we check the size of the transaction and then we just adjust the change output so the fee normalizes
*/
async function getFee(
  rpc: RPCType,
  inputs: Array<IVout_when_creating_transactions>,
  outputs: Array<IVout>
): Promise<number> {
  const ONE_KILOBYTE = 1024;
  //Create a raw transaction to get an aproximation for transaction size.
  const raw = await blockchain.createRawTransaction(rpc, inputs, outputs);

  //Get the length of the string bytes not the string
  //This is NOT the exact size since we will add an output for the change address to the transaction
  //Perhaps we should calculate size plus 10%?
  const size = Buffer.from(raw).length / ONE_KILOBYTE;
  console.log("Size of raw transaction", size);
  let fee = 0.02;
  //TODO should ask the "blockchain" **estimatesmartfee**

  return fee * Math.max(1, size);
}

async function _send(options: IInternalSendIProp): Promise<ISendResult> {
  const { amount, assetName, fromAddressObjects, toAddress, rpc } = options;

  const sendResult: ISendResult = {
    transactionId: "undefined",
    debug: [],
  };
  const MAX_FEE = 4;

  const isAssetTransfer = assetName !== "RVN";

  //VALIDATION
  if ((await isValidAddress(rpc, toAddress)) === false) {
    throw Error("Invalid address " + toAddress);
  }
  if (amount < 0) {
    throw Error("Cant send less than zero");
  }

  const addresses = fromAddressObjects.map((a) => a.address);

  //TODO change addresses should be checked with the blockchain,
  //find first unused change address
  const ravencoinChangeAddress = addresses[1];
  const assetChangeAddress = addresses[3];

  let UTXOs = await blockchain.getRavenUnspentTransactionOutputs(
    rpc,
    addresses
  );

  //Remove UTXOs that are currently in mempool
  const mempool = await blockchain.getMempool(rpc);

  UTXOs = UTXOs.filter((UTXO) => isUTXOInMempool(mempool, UTXO) === false);

  const enoughRavencoinUTXOs = getEnoughUTXOs(
    UTXOs,
    isAssetTransfer ? 1 : amount + MAX_FEE
  );

  //Sum up the whole unspent amount
  let unspentRavencoinAmount = sumOfUTXOs(enoughRavencoinUTXOs);
  if (unspentRavencoinAmount <= 0) {
    throw Error(
      "Not enough RVN to transfer asset, perhaps your wallet has pending transactions"
    );
  }
  sendResult.debug.unspentRVNAmount = unspentRavencoinAmount.toLocaleString();

  if (isAssetTransfer === false) {
    if (amount > unspentRavencoinAmount) {
      throw Error(
        "Insufficient funds, cant send " +
          amount.toLocaleString() +
          " only have " +
          unspentRavencoinAmount.toLocaleString()
      );
    }
  }

  const rvnAmount = isAssetTransfer ? 0 : amount;

  const inputs = blockchain.convertUTXOsToVOUT(enoughRavencoinUTXOs);
  const outputs: any = {};
  //Add asset inputs
  if (isAssetTransfer === true) {
    await addAssetInputsAndOutputs(
      rpc,
      addresses,
      assetName,
      amount,
      inputs,
      outputs,
      toAddress,
      assetChangeAddress
    );
  } else if (isAssetTransfer === false) {
    outputs[toAddress] = rvnAmount;
  }

  const fee = await getFee(rpc, inputs, outputs);
  sendResult.debug.assetName = assetName;
  sendResult.debug.fee = fee;
  sendResult.debug.rvnAmount = 0;

  const ravencoinChangeAmount = unspentRavencoinAmount - rvnAmount - fee;

  sendResult.debug.rvnChangeAmount = ravencoinChangeAmount;

  //Obviously we only add change address if there is any change
  if (getTwoDecimalTrunc(ravencoinChangeAmount) > 0) {
    outputs[ravencoinChangeAddress] = getTwoDecimalTrunc(ravencoinChangeAmount);
  }
  //Now we have enough UTXos, lets create a raw transactions

  const raw = await blockchain.createRawTransaction(rpc, inputs, outputs);

  //OK lets find the private keys (WIF) for input addresses
  type TPrivateKey = {
    [key: string]: string;
  };
  const privateKeys: TPrivateKey = {};
  inputs.map(function (input: IVout_when_creating_transactions) {
    const addy = input.address;
    const addressObject = fromAddressObjects.find((a) => a.address === addy);
    if (addressObject) {
      privateKeys[addy] = addressObject.WIF;
    }
  });

  //Sign the transaction
  const keys: Array<string> = Object.values(privateKeys);
  const signedTransactionPromise = blockchain.signRawTransaction(
    rpc,
    raw,
    keys
  );
  signedTransactionPromise.catch((e: any) => {
    console.dir(e);
  });

  const signedTransaction = await signedTransactionPromise;

  const txid = await blockchain.sendRawTransaction(rpc, signedTransaction);
  sendResult.transactionId = txid;
  return sendResult;
}

async function addAssetInputsAndOutputs(
  rpc: RPCType,
  addresses: string[],
  assetName: string,
  amount: number,
  inputs: IVout_when_creating_transactions[],
  outputs: any,
  toAddress: string,
  assetChangeAddress: string
) {
  let assetUTXOs = await blockchain.getAssetUnspentTransactionOutputs(
    rpc,
    addresses,
    assetName
  );

  const mempool = await blockchain.getMempool(rpc);
  assetUTXOs = assetUTXOs.filter(
    (UTXO) => isUTXOInMempool(mempool, UTXO) === false
  );

  const _UTXOs = getEnoughUTXOs(assetUTXOs, amount);
  const tempInputs = blockchain.convertUTXOsToVOUT(_UTXOs);
  tempInputs.map((item) => inputs.push(item));

  outputs[toAddress] = {
    transfer: {
      [assetName]: amount,
    },
  };

  const assetSum = sumOfUTXOs(_UTXOs);

  //Only add change address if needed
  if (assetSum - amount > 0) {
    outputs[assetChangeAddress] = {
      transfer: {
        [assetName]: assetSum - amount,
      },
    };
  }
}

function getTwoDecimalTrunc(num: number) {
  //Found answer here https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  //In JavaScript the number 77866.98 minus 111 minus 0.2 equals 77755.95999999999
  //We want it to be 77755.96
  return Math.trunc(num * 100) / 100;
}

export async function send(
  rpc: RPCType,
  fromAddressObjects: Array<IAddressMetaData>,
  toAddress: string,
  amount: number,
  assetName: string
) {
  return _send({ rpc, fromAddressObjects, toAddress, amount, assetName });
}

export function getEnoughUTXOs(
  utxos: Array<IUTXO>,
  amount: number
): Array<IUTXO> {
  /*
  Scenario ONE
  Bob has 300 UTXO with 1 RVN each.
  Bob has one UTXO with 400 RVN.

  Bob intends to send 300 RVN
  In this case the best thing to do is to use the single 400 UTXO

  SCENARIO TWO

  Alice have tons of small UTXOs like 0.03 RVN, 0.2 RVN, she wants to send 5 RVN.
  In this case it makes sense to clean up the "dust", so you dont end up with a lot of small change.


  */

  //For small transactions,start with small transactions first.
  let tempAmount = 0;

  const returnValue: Array<IUTXO> = [];

  utxos.map(function (utxo) {
    if (utxo.satoshis !== 0 && tempAmount < amount) {
      const value = utxo.satoshis / ONE_FULL_COIN;
      tempAmount = tempAmount + value;
      returnValue.push(utxo);
    }
  });

  //Did we use a MASSIVE amount of UTXOs to safisfy this transaction?
  //In this case check if we do have one single UTXO that can satisfy our needs
  if (returnValue.length > 10) {
    const largerUTXO = utxos.find(
      (utxo) => utxo.satoshis / ONE_FULL_COIN > amount
    );

    if (largerUTXO) {
      //Send this one UTXO that covers it all
      return [largerUTXO];
    }
  }
  return returnValue;
}

export function isUTXOInMempool(
  mempool: Array<ITransaction>,
  UTXO: IUTXO
): boolean {
  function format(transactionId: string, index: number) {
    return transactionId + "_" + index;
  }

  const listOfUTXOsInMempool: Array<string> = [];
  mempool.map((transaction) => {
    transaction.vin.map((vin) => {
      const id = format(vin.txid, vin.vout);
      listOfUTXOsInMempool.push(id);
    });
  });

  const index = listOfUTXOsInMempool.indexOf(
    format(UTXO.txid, UTXO.outputIndex)
  );
  const isInMempool = index > -1;

  return isInMempool;
}
