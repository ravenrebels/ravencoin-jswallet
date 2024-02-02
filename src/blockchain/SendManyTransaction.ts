import { InsufficientFundsError, ValidationError } from "../Errors";
import { Wallet } from "../ravencoinWallet";
import {
  IForcedUTXO,
  IMempoolEntry,
  ISendManyTransactionOptions,
  IUTXO,
} from "../Types";
import { removeDuplicates } from "../utils";
/**
 * SendManyTransaction Class
 *
 * This class is responsible for calculating the necessary steps to broadcast a Ravencoin transaction:
 * 1) Identify available UTXOs that are not already spent in the mempool.
 * 2) Determine the required number of UTXOs for creating this transaction.
 * 3) Define the transaction's inputs and outputs.
 * 4) Sign the transaction.
 *
 * Note: this class does not do the actual broadcasting; it is up to the user.
 *
 * How does it work?
 * 1) Create an instance:
 *    const transaction = new SendManyTransaction({
 *      assetName,
 *      outputs: options.outputs,
 *      wallet: this,
 *    });
 *
 * 2) Load data from the network:
 *    transaction.loadData();
 */

export class SendManyTransaction {
  _allUTXOs: IUTXO[]; //all UTXOs that we know of

  private assetName: string;
  feerate = 1; //When loadData is called, this attribute is updated from the blockchain  wallet = null;

  private wallet: Wallet;
  private outputs: any;
  private walletMempool: IMempoolEntry[] = [];
  private forcedUTXOs: IForcedUTXO[] = [];
  private forcedChangeAddressBaseCurrency: string | undefined = "";
  private forcedChangeAddressAssets: string | undefined = "";
  constructor(options: ISendManyTransactionOptions) {
    const { wallet, outputs, assetName } = options;
    this.assetName = !assetName ? wallet.baseCurrency : assetName;
    this.wallet = wallet;
    this.outputs = outputs;
    this.forcedChangeAddressAssets = options.forcedChangeAddressAssets;
    this.forcedChangeAddressBaseCurrency =
      options.forcedChangeAddressBaseCurrency;
    //Tag forced UTXOs with the "force" flag
    if (options.forcedUTXOs) {
      options.forcedUTXOs.map((f) => (f.utxo.forced = true));
      this.forcedUTXOs = options.forcedUTXOs;
    }
  }
  /**
   *
   * @returns forced UTXOs for this transaction, that means "no matter want, spend this UTXO"
   */
  getForcedUTXOs() {
    return this.forcedUTXOs;
  }
  getWalletMempool() {
    return this.walletMempool;
  }
  getSizeInKB() {
    const utxos = this.predictUTXOs();
    const assumedSizePerUTXO = 300;
    const assumedSizePerOutput = 100;

    const bytes =
      (utxos.length + 1) * assumedSizePerUTXO +
      Object.keys(this.outputs).length * assumedSizePerOutput;

    const kb = bytes / 1024;

    return kb;
  }
  async loadData() {
    //Load blockchain information async, and wait for it
    const mempoolPromise = this.wallet.getMempool();
    const assetUTXOsPromise = this.wallet.getAssetUTXOs();
    const baseCurencyUTXOsPromise = this.wallet.getUTXOs();
    const feeRatePromise = this.getFeeRate();

    this.walletMempool = await mempoolPromise;
    const assetUTXOs = await assetUTXOsPromise;
    const baseCurrencyUTXOs = await baseCurencyUTXOsPromise;
    this.feerate = await feeRatePromise;

    const mempoolUTXOs = await this.wallet.getUTXOsInMempool(
      this.walletMempool
    );

    const _allUTXOsTemp = assetUTXOs
      .concat(baseCurrencyUTXOs)
      .concat(mempoolUTXOs);

    //add forced UTXO to the beginning of the array
    //method getUTXOs will remove all duplicates
    if (this.forcedUTXOs) {
      for (let f of this.forcedUTXOs) {
        const utxo = f.utxo;
        _allUTXOsTemp.unshift(utxo);
      }
    }

    //Collect UTXOs that are not currently being spent in the mempool
    const allUTXOs = _allUTXOsTemp.filter((utxo) => {
      //Always include forced UTXOs
      if (utxo.forced === true) {
        return true;
      }
      const objInMempool = this.walletMempool.find((mempoolEntry) => {
        if (mempoolEntry.prevtxid) {
          const result =
            mempoolEntry.prevtxid === utxo.txid &&
            mempoolEntry.prevout === utxo.outputIndex;

          return result;
        }
        return false;
      });

      return !objInMempool;
    });
    //Sort utxos lowest first
    const sorted = allUTXOs.sort(sortBySatoshis);

    //Remove duplicates, like if we have added an UTXO as forced, but it is already
    //in the wallet as a normal UTXO
    this._allUTXOs = removeDuplicates(sorted);
  }
  getAmount() {
    let total = 0;

    const values: number[] = Object.values(this.outputs);
    values.map((value) => (total += value));

    return total;
  }
  getUTXOs(): IUTXO[] {
    //NOTE, if we have FORCED utxos, they have to be included no matter what

    let result: IUTXO[] = [];
    if (this.isAssetTransfer() === true) {
      const assetAmount = this.getAmount();
      const baseCurrencyAmount = this.getBaseCurrencyAmount();
      const baseCurrencyUTXOs = getEnoughUTXOs(
        this._allUTXOs,
        this.wallet.baseCurrency,
        baseCurrencyAmount
      );
      const assetUTXOs = getEnoughUTXOs(
        this._allUTXOs,
        this.assetName,
        assetAmount
      );

      result = assetUTXOs.concat(baseCurrencyUTXOs);
    } else {
      result = getEnoughUTXOs(
        this._allUTXOs,
        this.wallet.baseCurrency,
        this.getBaseCurrencyAmount()
      );
    }

    return result;
  }
  /*
  Check the blockchain, network.
  Is this transaction still valid? Will it be accepted?
  */
  validate() {}
  predictUTXOs() {
    let utxos: IUTXO[] = [];

    if (this.isAssetTransfer()) {
      utxos = getEnoughUTXOs(this._allUTXOs, this.assetName, this.getAmount());
    } else {
      utxos = getEnoughUTXOs(
        this._allUTXOs,
        this.wallet.baseCurrency,
        this.getAmount()
      );
    }

    return utxos;
  }
  getBaseCurrencyAmount() {
    const fee = this.getFee();

    if (this.isAssetTransfer() === true) {
      return fee;
    } else return this.getAmount() + fee;
  }
  getBaseCurrencyChange() {
    const enoughUTXOs = getEnoughUTXOs(
      this._allUTXOs,
      this.wallet.baseCurrency,
      this.getBaseCurrencyAmount()
    );

    let total = 0;
    for (let utxo of enoughUTXOs) {
      if (utxo.assetName !== this.wallet.baseCurrency) {
        continue;
      }
      total = total + utxo.satoshis / 1e8;
    }

    const result = total - this.getBaseCurrencyAmount();

    return shortenNumber(result);
  }
  getAssetChange() {
    const enoughUTXOs = getEnoughUTXOs(
      this._allUTXOs,
      this.assetName,
      this.getAmount()
    );
    let total = 0;
    for (let utxo of enoughUTXOs) {
      if (utxo.assetName !== this.assetName) {
        continue;
      }
      total = total + utxo.satoshis / 1e8;
    }
    return total - this.getAmount();
  }
  isAssetTransfer() {
    return this.assetName !== this.wallet.baseCurrency;
  }

  async getOutputs() {
    //we take the declared outputs and add change outputs
    const totalOutputs = {};
    const changeAddressBaseCurrency =
      this.forcedChangeAddressBaseCurrency ||
      (await this.wallet.getChangeAddress());

    if (this.isAssetTransfer() === true) {
      //Validate: change address cant be toAddress
      const toAddresses = Object.keys(this.outputs);
      if (toAddresses.includes(changeAddressBaseCurrency) === true) {
        throw new ValidationError(
          "Change address cannot be the same as to address"
        );
      }
      totalOutputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();
      const changeAddressAsset = await this._getChangeAddressAssets();
      //Validate change address can never be the same as toAddress
      if (toAddresses.includes(changeAddressAsset) === true) {
        throw new ValidationError(
          "Change address cannot be the same as to address"
        );
      }
      if (this.getAssetChange() > 0) {
        totalOutputs[changeAddressAsset] = {
          transfer: {
            [this.assetName]: Number(this.getAssetChange().toFixed(8)),
          },
        };
      }

      for (let addy of Object.keys(this.outputs)) {
        const amount = this.outputs[addy];
        totalOutputs[addy] = {
          transfer: {
            [this.assetName]: amount,
          },
        };
      }
    } else {
      for (let addy of Object.keys(this.outputs)) {
        const amount = this.outputs[addy];
        totalOutputs[addy] = amount;
      }

      totalOutputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();
    }
    return totalOutputs;
  }

  async _getChangeAddressAssets() {
    if (this.forcedChangeAddressAssets) {
      return this.forcedChangeAddressAssets;
    }
    const changeAddressBaseCurrency = await this.wallet.getChangeAddress();
    const index = this.wallet.getAddresses().indexOf(changeAddressBaseCurrency);
    const changeAddressAsset = this.wallet.getAddresses()[index + 2];
    return changeAddressAsset;
  }
  getInputs() {
    return this.getUTXOs().map((obj) => {
      return { address: obj.address, txid: obj.txid, vout: obj.outputIndex };
    });
  }

  getPrivateKeys() {
    const addressObjects = this.wallet.getAddressObjects();
    const privateKeys = {};
    for (let u of this.getUTXOs()) {
      //Find the address object (we want the WIF) for the address related to the UTXO
      const addressObject = addressObjects.find(
        (obj) => obj.address === u.address
      );
      if (addressObject) {
        privateKeys[u.address] = addressObject.WIF;
      }
    }

    //Add privatekeys from forcedUTXOs
    this.forcedUTXOs.map((f) => (privateKeys[f.address] = f.privateKey));
    return privateKeys;
  }

  getFee() {
    const kb = this.getSizeInKB();
    const result = kb * this.feerate;

    return result;
  }
  async getFeeRate() {
    const defaultFee = 0.02;
    try {
      const confirmationTarget = 20;
      const response = await this.wallet.rpc("estimatesmartfee", [
        confirmationTarget,
      ]);
      //Errors can occur on testnet, not enough info to calculate fee
      if (!response.errors) {
        return normaliseFee(this.wallet.network, response.feerate);
      } else {
        return defaultFee;
      }
    } catch (e) {
      //Might occure errors on testnet when calculating fees
      return defaultFee;
    }
  }
}

//Return the number with max 2 decimals
export function shortenNumber(number) {
  return parseFloat(number.toFixed(2));
}

function sortBySatoshis(u1: IUTXO, u2: IUTXO) {
  if (u1.satoshis > u2.satoshis) {
    return 1;
  }
  if (u1.satoshis === u2.satoshis) {
    return 0;
  }
  return -1;
}

function getEnoughUTXOs(
  utxos: IUTXO[],
  asset: string,
  amount: number
): IUTXO[] {
  const result: IUTXO[] = [];
  let sum = 0;

  if (!utxos) {
    throw Error("getEnoughUTXOs cannot be called without utxos");
  }
  //First off, add mandatory/forced UTXO, no matter what
  for (let u of utxos) {
    if (u.forced === true) {
      if (u.assetName === asset) {
        const value = u.satoshis / 1e8;
        result.push(u);
        sum = sum + value;
      }
    }
  }

  //Process NON FORCED utxos
  for (let u of utxos) {
    if (u.forced) {
      continue;
    }
    if (sum > amount) {
      break;
    }
    if (u.assetName !== asset) {
      continue;
    }
    //Ignore UTXOs with zero satoshis, seems to occure when assets are minted
    if (u.satoshis === 0) {
      continue;
    }
    const value = u.satoshis / 1e8;
    result.push(u);
    sum = sum + value;
  }

  if (sum < amount) {
    const error = new InsufficientFundsError(
      "You do not have " + amount + " " + asset + " you only have " + sum
    );
    throw error;
  }
  return result;
}

function normaliseFee(network: string, fee: number) {
  //It seems there is a bug causing the EVR fees to be 1300 times higher than they should be
  if (network === "evr" && fee > 1) {
    return fee / 100;
  }
  return fee;
}
