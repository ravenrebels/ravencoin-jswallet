import { InsufficientFundsError, ValidationError } from "../Errors";
import { Wallet } from "../ravencoinWallet";
import { IMempoolEntry, ISendManyTransactionOptions, IUTXO } from "../Types";

export class SendManyTransaction {
  _allUTXOs: IUTXO[]; //all UTXOs that we know of

  private assetName: string;
  feerate = 1; //When loadData is called, this attribute is updated from the blockchain  wallet = null;

  private wallet: Wallet;
  private outputs: any;
  private walletMempool: IMempoolEntry[] = [];
  constructor({ wallet, outputs, assetName }: ISendManyTransactionOptions) {
    this.assetName = !assetName ? wallet.baseCurrency : assetName;
    this.wallet = wallet;
    this.outputs = outputs;
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

    //Filter out UTXOs that are NOT in mempool
    const allUTXOs = _allUTXOsTemp.filter((utxo) => {
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
    allUTXOs.sort(sortBySatoshis);

    this._allUTXOs = allUTXOs;
  }
  getAmount() {
    let total = 0;

    const values: number[] = Object.values(this.outputs);
    values.map((value) => (total += value));

    return total;
  }
  getUTXOs() {
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

      return assetUTXOs.concat(baseCurrencyUTXOs);
    } else {
      return getEnoughUTXOs(
        this._allUTXOs,
        this.wallet.baseCurrency,
        this.getBaseCurrencyAmount()
      );
    }
  }

  predictUTXOs() {
    if (this.isAssetTransfer()) {
      return getEnoughUTXOs(this._allUTXOs, this.assetName, this.getAmount());
    }
    return getEnoughUTXOs(
      this._allUTXOs,
      this.wallet.baseCurrency,
      this.getAmount()
    );
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

    if (this.isAssetTransfer() === true) {
      const changeAddressBaseCurrency = await this.wallet.getChangeAddress();

      //Validate: change address cant be toAddress
      const toAddresses = Object.keys(this.outputs);
      if (toAddresses.includes(changeAddressBaseCurrency) === true) {
        throw new ValidationError(
          "Change address cannot be the same as to address"
        );
      }
      totalOutputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();

      const index = this.wallet
        .getAddresses()
        .indexOf(changeAddressBaseCurrency);
      const changeAddressAsset = this.wallet.getAddresses()[index + 2];
      //Validate change address can never be the same as toAddress
      if (toAddresses.includes(changeAddressAsset) === true) {
        throw new ValidationError(
          "Change address cannot be the same as to address"
        );
      }
      if (this.getAssetChange() > 0) {
        totalOutputs[changeAddressAsset] = {
          transfer: {
            [this.assetName]: this.getAssetChange(),
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
      const changeAddressBaseCurrency = await this.wallet.getChangeAddress();

      for (let addy of Object.keys(this.outputs)) {
        const amount = this.outputs[addy];
        totalOutputs[addy] = amount;
      }

      totalOutputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();
    }
    return totalOutputs;
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
      const asdf = await this.wallet.rpc("estimatesmartfee", [
        confirmationTarget,
      ]);
      if (!asdf.errors) {
        return asdf.feerate;
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
  for (let u of utxos) {
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
