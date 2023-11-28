import {
  IMempoolEntry,
  ISendManyTransactionOptions,
  ITransactionOptions,
  IUTXO,
} from "../Types";
import { SendManyTransaction } from "./SendManyTransaction";

export class Transaction {
  private sendManyTransaction: SendManyTransaction;

  constructor(options: ITransactionOptions) {

    //The diff between ITransactionOptions and ISendManyTransactionOptions 
    //is that SendMany has a multi value outputs attribute instead of toAddress
    
    const _options: ISendManyTransactionOptions = {
      ...options,
      outputs: {
        [options.toAddress]: options.amount,
      },
    };

    this.sendManyTransaction = new SendManyTransaction(_options);
  }
  getWalletMempool(): IMempoolEntry[] {
    return this.sendManyTransaction.getWalletMempool();
  }
  getSizeInKB() {
    return this.sendManyTransaction.getSizeInKB();
  }
  async loadData() {
    return this.sendManyTransaction.loadData();
  }
  getUTXOs(): IUTXO[] {
    return this.sendManyTransaction.getUTXOs();
  }

  predictUTXOs() {
    return this.sendManyTransaction.predictUTXOs();
  }
  getBaseCurrencyAmount() {
    return this.sendManyTransaction.getBaseCurrencyAmount();
  }
  getBaseCurrencyChange() {
    return this.sendManyTransaction.getBaseCurrencyChange();
  }
  getAssetChange() {
    return this.sendManyTransaction.getAssetChange();
  }
  isAssetTransfer() {
    return this.sendManyTransaction.isAssetTransfer();
  }

  async getOutputs() {
    return this.sendManyTransaction.getOutputs();
  }

  getInputs() {
    return this.sendManyTransaction.getInputs();
  }

  getPrivateKeys() {
    return this.sendManyTransaction.getPrivateKeys();
  }

  getFee() {
    return this.sendManyTransaction.getFee();
  }
  async getFeeRate() {
    return this.sendManyTransaction.getFeeRate();
  }
}
