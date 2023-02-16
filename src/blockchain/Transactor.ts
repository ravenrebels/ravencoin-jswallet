import {
  IAddressMetaData,
  ISendInternalProps,
  ISendResult,
  IUTXO,
  IVout,
  IVout_when_creating_transactions,
  RPCType,
  TPrivateKey,
} from "../Types";
import { sign } from "@ravenrebels/ravencoin-sign-transaction";
import * as blockchain from "./blockchain";

import { ITransaction } from "../Types";
import { ONE_FULL_COIN } from "../contants";
import {
  InsufficientFundsError,
  InvalidAddressError,
  ValidationError,
} from "../Errors";


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

function getDefaultSendResult() {
  const sendResult: ISendResult = {
    transactionId: "undefined",
    debug: {
      assetName: "",
      assetUTXOs: [],
      fee: 0,
      inputs: [],
      outputs: null,
      rvnChangeAmount: 0,
      rvnUTXOs: [],
      unspentRVNAmount: "",
      rvnAmount: 0,
    },
  };
  return sendResult;
}
export async function send(options: ISendInternalProps): Promise<ISendResult> {
  const {
    amount,
    assetName,
    baseCurrency,
    changeAddress,
    changeAddressAssets,
    fromAddressObjects,
    network,
    toAddress,
    rpc,
  } = options;

  console.log("ChangeAddressAssets", changeAddressAssets);
  console.log("ChangeAddress", changeAddress);
  const sendResult = getDefaultSendResult();
  const MAX_FEE = 4;

  const isAssetTransfer = assetName !== baseCurrency;

  console.log("Is asset transfer", isAssetTransfer);
  //VALIDATION
  if ((await isValidAddress(rpc, toAddress)) === false) {
    throw new InvalidAddressError("Invalid address " + toAddress);
  }
  if (amount < 0) {
    throw new ValidationError("Cant send less than zero");
  }

  const addresses = fromAddressObjects.map((a) => a.address);

  //Do we have enough of the asset?
  if (isAssetTransfer === true) {
    if (!changeAddressAssets) {
      throw new ValidationError("No changeAddressAssets");
    }
    const b = await blockchain.getBalance(rpc, addresses);
    const a = b.find((asset) => asset.assetName === assetName);
    if (!a) {
      throw new InsufficientFundsError("You do not have any " + assetName);
    }
    const balance = a.balance / ONE_FULL_COIN;
    if (balance < amount) {
      throw new InsufficientFundsError(
        "You do not have " + amount + " " + assetName
      );
    }
  }

  let allBaseCurrencyUTXOs = await blockchain.getBaseCurrencyUTXOs(
    rpc,
    addresses
  );

  //Remove UTXOs that are currently in mempool
  const mempool = await blockchain.getMempool(rpc);

  allBaseCurrencyUTXOs = allBaseCurrencyUTXOs.filter(
    (UTXO) => isUTXOInMempool(mempool, UTXO) === false
  );

  const enoughBaseCurrencyUTXOs = getEnoughUTXOs(
    allBaseCurrencyUTXOs,
    isAssetTransfer ? 1 : amount + MAX_FEE
  );

  //Sum up the whole unspent amount
  let unspentBaseCurrencyAmount = sumOfUTXOs(enoughBaseCurrencyUTXOs);
  if (unspentBaseCurrencyAmount <= 0) {
    throw new InsufficientFundsError(
      "Not enough RVN to transfer asset, perhaps your wallet has pending transactions"
    );
  }
  sendResult.debug.unspentRVNAmount =
    unspentBaseCurrencyAmount.toLocaleString();

  if (isAssetTransfer === false) {
    if (amount > unspentBaseCurrencyAmount) {
      throw new InsufficientFundsError(
        "Insufficient funds, cant send " +
          amount.toLocaleString() +
          " only have " +
          unspentBaseCurrencyAmount.toLocaleString()
      );
    }
  }

  const baseCurrencyAmountToSpend = isAssetTransfer ? 0 : amount;
  sendResult.debug.rvnUTXOs = enoughBaseCurrencyUTXOs;
  const inputs = blockchain.convertUTXOsToVOUT(enoughBaseCurrencyUTXOs);
  const outputs: any = {};
  //Add asset inputs

  sendResult.debug.assetUTXOs = [] as Array<IUTXO>;
  if (isAssetTransfer === true) {
    if (!changeAddressAssets) {
      throw new ValidationError(
        "changeAddressAssets is mandatory when transfering assets"
      );
    }
    const assetUTXOs = await addAssetInputsAndOutputs(
      rpc,
      addresses,
      assetName,
      amount,
      inputs,
      outputs,
      toAddress,
      changeAddressAssets
    );
    sendResult.debug.assetUTXOs = assetUTXOs;
  } else if (isAssetTransfer === false) {
    outputs[toAddress] = baseCurrencyAmountToSpend;
  }

  const fee = await getFee(rpc, inputs, outputs);
  sendResult.debug.assetName = assetName;
  sendResult.debug.fee = fee;
  sendResult.debug.rvnAmount = 0;

  const baseCurrencyChangeAmount =
    unspentBaseCurrencyAmount - baseCurrencyAmountToSpend - fee;

  sendResult.debug.rvnChangeAmount = baseCurrencyChangeAmount;

  //Obviously we only add change address if there is any change
  if (getTwoDecimalTrunc(baseCurrencyChangeAmount) > 0) {
    outputs[changeAddress] = getTwoDecimalTrunc(baseCurrencyChangeAmount);
  }
  //Now we have enough UTXos, lets create a raw transactions
  sendResult.debug.inputs = inputs;
  sendResult.debug.outputs = outputs;

  const raw = await blockchain.createRawTransaction(rpc, inputs, outputs);

  sendResult.debug.rawUnsignedTransaction = raw;
  //OK lets find the private keys (WIF) for input addresses

  const privateKeys: TPrivateKey = {};
  inputs.map(function (input: IVout_when_creating_transactions) {
    const addy = input.address;
    const addressObject = fromAddressObjects.find((a) => a.address === addy);
    if (addressObject) {
      privateKeys[addy] = addressObject.WIF;
    }
  });
  sendResult.debug.privateKeys = privateKeys;

  let UTXOs: Array<IUTXO> = [];
  if (enoughBaseCurrencyUTXOs) {
    UTXOs = UTXOs.concat(enoughBaseCurrencyUTXOs);
  }

  if (sendResult.debug.assetUTXOs) {
    UTXOs = UTXOs.concat(sendResult.debug.assetUTXOs);
  }
  try {
    const signedTransaction = sign(network, raw, UTXOs, privateKeys);
    sendResult.debug.signedTransaction = signedTransaction;

    const txid = await blockchain.sendRawTransaction(rpc, signedTransaction);
    sendResult.transactionId = txid;
  } catch (e) {
    sendResult.debug.error = e;
  }

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
  changeAddressAssets: string
): Promise<Array<IUTXO>> {
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

  console.log("output before adding first asset", outputs);
  outputs[toAddress] = {
    transfer: {
      [assetName]: amount,
    },
  };
  console.log("output after adding first asset", outputs);

  const assetSum = sumOfUTXOs(_UTXOs);
  const needsChange = assetSum - amount > 0;
  console.log("The sum of all ", assetName, "is", assetSum);
  //Only add change address if needed
  console.log(
    needsChange,
    "Will check if",
    assetSum,
    "minus",
    amount,
    "is larger than zero, if we need change"
  );

  if (needsChange) {
    console.log("Will add change to address", changeAddressAssets);
    outputs[changeAddressAssets] = {
      transfer: {
        [assetName]: assetSum - amount,
      },
    };
    console.log("Outputs became", outputs);
  }
  console.log("When about to return outputs are", outputs);
  return _UTXOs; //Return the UTXOs used for asset transfer
}

function getTwoDecimalTrunc(num: number) {
  //Found answer here https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
  //In JavaScript the number 77866.98 minus 111 minus 0.2 equals 77755.95999999999
  //We want it to be 77755.96
  return Math.trunc(num * 100) / 100;
}
/*
//TODO why on earth do we send and call _send? merge to one please
//TODO and for the love of the gods, replace many args with an option argument please
export async function send(
  rpc: RPCType,
  fromAddressObjects: Array<IAddressMetaData>,
  toAddress: string,
  amount: number,
  assetName: string,
  network: "rvn" | "rvn-test",
  changeAddress: string,
  changeAddressAssets: string,
  baseCurrency: string
) {
  return _send({
    amount,
    assetName,
    baseCurrency,
    changeAddress,
    changeAddressAssets,
    fromAddressObjects,
    network,
    rpc,
    toAddress,
  });
}
*/
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
