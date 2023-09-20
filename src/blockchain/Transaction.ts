import { InsufficientFundsError, ValidationError } from "../Errors";
import { Wallet } from "../ravencoinWallet";
import { IUTXO } from "../Types";

export class Transaction {
  _allUTXOs: IUTXO[]; //all UTXOs that we know of
  amount = 0;
  private assetName: string;

  feerate = 1; //When loadData is called, this attribute is updated from the blockchain  wallet = null;
  private toAddress: string;
  private wallet: Wallet;

  constructor({ wallet, toAddress, amount, assetName }) {
    this.toAddress = toAddress;
    this.amount = amount;
    this.assetName = !assetName ? wallet.baseCurrency : assetName;
    this.wallet = wallet;
  }

  getSizeInKB() {
    const length = this.getUTXOs().length;
    //Lets assume every input is 300 bytes.
    return (length * 300) / 1000;
  }
  async loadData() {
    //Load blockchain information async, and wait for it
    const mempoolPromise = this.wallet.getMempool();
    const assetUTXOsPromise = this.wallet.getAssetUTXOs();
    const baseCurencyUTXOsPromise = this.wallet.getUTXOs();
    const feeRatePromise = this.getFeeRate();

    const walletMempool = await mempoolPromise;
    const assetUTXOs = await assetUTXOsPromise;
    const baseCurrencyUTXOs = await baseCurencyUTXOsPromise;
    this.feerate = await feeRatePromise;

    const mempoolUTXOs = getSpendableMempool(walletMempool);

    //Decorate mempool UTXOs with script attribute
    for (let u of mempoolUTXOs) {
      if (u.script) {
        continue;
      }
      //Mempool items might not have the script attbribute, we need it
      const utxo = await this.wallet.rpc("gettxout", [u.txid, u.index, true]);
      if (utxo) {
        u.script = utxo.scriptPubKey.hex;
      }
    }

    const _allUTXOsTemp = assetUTXOs
      .concat(baseCurrencyUTXOs)
      .concat(mempoolUTXOs);

    //Filter out UTXOs that are NOT in mempool
    const allUTXOs = _allUTXOsTemp.filter((utxo) => {
      const objInMempool = walletMempool.find(
        (mempoolEntry) =>
          mempoolEntry.prevtxid && mempoolEntry.prevtxid === utxo.id
      ); 
      return !objInMempool;
    });

    //Sort utxos lowest first
    allUTXOs.sort(sortBySatoshis);
    this._allUTXOs = allUTXOs;
  }
  getUTXOs() {
    if (this.isAssetTransfer() === true) {
      const assetAmount = this.amount;
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
      return getEnoughUTXOs(this._allUTXOs, this.assetName, this.amount);
    }
    return getEnoughUTXOs(
      this._allUTXOs,
      this.wallet.baseCurrency,
      this.amount
    );
  }
  getBaseCurrencyAmount() {
    const fee = this.getFee();
    if (this.isAssetTransfer() === true) {
      return fee;
    } else return this.amount + fee;
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
      this.amount
    );
    let total = 0;
    for (let utxo of enoughUTXOs) {
      if (utxo.assetName !== this.assetName) {
        continue;
      }
      total = total + utxo.satoshis / 1e8;
    }
    return total - this.amount;
  }
  isAssetTransfer() {
    return this.assetName !== this.wallet.baseCurrency;
  }

  async getOutputs() {
    const outputs = {};
    if (this.isAssetTransfer() === true) {
      const changeAddressBaseCurrency = await this.wallet.getChangeAddress();

      //Validate: change address cant be toAddress
      if (changeAddressBaseCurrency === this.toAddress) {
        throw new ValidationError(
          "Change address cannot be the same as toAddress"
        );
      }
      outputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();

      const index = this.wallet
        .getAddresses()
        .indexOf(changeAddressBaseCurrency);
      const changeAddressAsset = this.wallet.getAddresses()[index + 2];
      //Validate change address can never be the same as toAddress
      if (changeAddressAsset === this.toAddress) {
        throw new ValidationError(
          "Change address cannot be the same as toAddress"
        );
      }
      if (this.getAssetChange() > 0) {
        outputs[changeAddressAsset] = {
          transfer: {
            [this.assetName]: this.getAssetChange(),
          },
        };
      }
      outputs[this.toAddress] = {
        transfer: {
          [this.assetName]: this.amount,
        },
      };
    } else {
      const changeAddressBaseCurrency = await this.wallet.getChangeAddress();
      outputs[this.toAddress] = this.amount;
      outputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();
    }
    return outputs;
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
    const utxos = this.predictUTXOs();

    const assumedSizePerUTXO = 300;
    const bytes = (utxos.length + 1) * assumedSizePerUTXO;
    const kb = bytes / 1024;
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

function sortBySatoshis(u1, u2) {
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
      "You do not have " + amount + " " + asset
    );

    throw error;
  }
  return result;
}

function getSpendableMempool(mempool) {
  /*
interface IUTXO {
   address: string;
   assetName: string;
   txid: string;
   outputIndex: number;
   script: string;
   satoshis: number;
   height: number;
   value: number;
}
*/

  const mySet = new Set();

  for (let item of mempool) {
    if (!item.prevtxid) {
      continue;
    }
    const value = item.prevtxid + "_" + item.prevout;
    mySet.add(value);
  }

  const spendable = mempool.filter((item) => {
    if (item.satoshis < 0) {
      return false;
    }
    const value = item.txid + "_" + item.index;
    return mySet.has(value) === false;
  });

  //UTXO object need to have an outputIndex property, not index
  spendable.map((s) => (s.outputIndex = s.index));
  return spendable;
}
