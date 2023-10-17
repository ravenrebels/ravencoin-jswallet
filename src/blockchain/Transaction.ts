import { IMempoolEntry, ISendManyTransactionOptions, ITransactionOptions, IUTXO } from "../Types";
import { SendManyTransaction } from "./SendManyTransaction";

export class Transaction {
  private sendManyTransaction: SendManyTransaction;

  constructor({ wallet, toAddress, amount, assetName }: ITransactionOptions) {
    const options: ISendManyTransactionOptions = {
      assetName,
      wallet,
      outputs: {
        [toAddress]: amount,
      },
    };
    this.sendManyTransaction = new SendManyTransaction(options);
  }
  getWalletMempool():IMempoolEntry[] {
    return this.sendManyTransaction.getWalletMempool();
  }
  getSizeInKB() {
    return this.sendManyTransaction.getSizeInKB();
  }
  async loadData() {
    return this.sendManyTransaction.loadData();
  }
  getUTXOs():IUTXO[] {
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
