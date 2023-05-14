import { getRPC, methods } from "@ravenrebels/ravencoin-rpc";
import RavencoinKey from "@ravenrebels/ravencoin-key";
import {
  ChainType,
  IAddressDelta,
  IAddressMetaData,
  ISend,
  ISendInternalProps,
  ISendResult,
  SweepResult,
} from "./Types";
import { ONE_FULL_COIN } from "./contants";

import * as Transactor from "./blockchain/Transactor";

import { sweep } from "./blockchain/sweep";

const URL_MAINNET = "https://rvn-rpc-mainnet.ting.finance/rpc";
const URL_TESTNET = "https://rvn-rpc-testnet.ting.finance/rpc";

//Avoid singleton (anti-pattern)
//Meaning multiple instances of the wallet must be able to co-exist

export class Wallet {
  rpc = getRPC("anonymous", "anonymous", URL_MAINNET);
  _mnemonic = "";
  network: ChainType = "rvn";
  addressObjects: Array<IAddressMetaData> = [];
  receiveAddress = "";
  changeAddress = "";
  addressPosition = 0;
  baseCurrency = "RVN"; //Default is RVN but it could be EVR
  offlineMode = false;
  setBaseCurrency(currency: string) {
    this.baseCurrency = currency;
  }
  getBaseCurrency() {
    return this.baseCurrency;
  }
  /**
   * Sweeping a private key means to send all the funds the address holds to your your wallet.
   * The private key you sweep do not become a part of your wallet.
   *
   * NOTE: the address you sweep needs to cointain enough RVN to pay for the transaction
   *
   * @param WIF the private key of the address that you want move funds from
   * @returns either a string, that is the transaction id or null if there were no funds to send
   */
  sweep(WIF: string, onlineMode: boolean): Promise<SweepResult> {
    const wallet = this;

    return sweep(WIF, wallet, onlineMode);
  }
  getAddressObjects() {
    return this.addressObjects;
  }
  getAddresses(): Array<string> {
    const addresses = this.addressObjects.map((obj) => {
      return obj.address;
    });
    return addresses;
  }

  async init(options: IOptions) {
    let username = "anonymous";
    let password = "anonymous";
    let url = URL_MAINNET;

    //VALIDATION
    if (!options) {
      throw Error("option argument is mandatory");
    }

    if (options.offlineMode === true) {
      this.offlineMode = true;
    }
    if (!options.mnemonic) {
      throw Error("option.mnemonic is mandatory");
    }

    url = options.rpc_url || url;
    password = options.rpc_password || url;
    username = options.rpc_username || url;

    if (options.network) {
      this.network = options.network;
      this.setBaseCurrency(getBaseCurrencyByNetwork(options.network));
    }
    if (options.network === "rvn-test" && !options.rpc_url) {
      url = URL_TESTNET;
    }

    this.rpc = getRPC(username, password, url);
    //DERIVE ADDRESSES BIP44, external 20 unused (that is no history, not no balance)
    //TODO improve performance by creating blocks of 20 addresses and check history for all 20 at once
    //That is one history lookup intead of 20
    this._mnemonic = options.mnemonic;
    let isLast20ExternalAddressesUnused = false;
    const ACCOUNT = 0;

    while (isLast20ExternalAddressesUnused === false) {
      const tempAddresses = [] as string[];

      for (let i = 0; i < 20; i++) {
        const o = RavencoinKey.getAddressPair(
          this.network,
          this._mnemonic,
          ACCOUNT,
          this.addressPosition
        );
        this.addressObjects.push(o.external);
        this.addressObjects.push(o.internal);
        this.addressPosition++;

        tempAddresses.push(o.external.address + "");
      }

      if (this.offlineMode === true) {
        //BREAK generation of addresses and do NOT check history on the network
        isLast20ExternalAddressesUnused = true;
      } else {
        //If no history, break
        isLast20ExternalAddressesUnused =
          false === (await this.hasHistory(tempAddresses));
      }
    }
  }
  async hasHistory(addresses: Array<string>): Promise<boolean> {
    const includeAssets = true;
    const obj = {
      addresses,
    };

    const asdf = (await this.rpc(methods.getaddressbalance, [
      obj,
      includeAssets,
    ])) as any;

    //@ts-ignore
    const hasReceived = Object.values(asdf).find((asset) => asset.received > 0);

    return !!hasReceived;
  }

  async _getFirstUnusedAddress(external: boolean) {
    //First, check if lastReceivedAddress
    if (external === true && this.receiveAddress) {
      const asdf = await this.hasHistory([this.receiveAddress]);
      if (asdf === false) {
        return this.receiveAddress;
      }
    }
    if (external === false && this.changeAddress) {
      const asdf = await this.hasHistory([this.changeAddress]);
      if (asdf === false) {
        return this.changeAddress;
      }
    }

    const addresses = this.getAddresses();
    //even addresses are external, odd address are internal/changes

    for (let counter = 0; counter < addresses.length; counter++) {
      if (external && counter % 2 !== 0) {
        continue;
      }
      const address = addresses[counter];

      //If an address has tenth of thousands of transactions, getHistory will throw an exception

      const hasHistory = await this.hasHistory([address]);

      if (hasHistory === false) {
        if (external === true) {
          this.receiveAddress = address;
        }
        return address;
      }
    }

    //IF we have not found one, return the first address
    return addresses[0];
  }

  async getHistory(): Promise<IAddressDelta[]> {
    const assetName = ""; //Must be empty string, NOT "*"
    const addresses = this.getAddresses();
    const deltas = this.rpc(methods.getaddressdeltas, [
      { addresses, assetName },
    ]);
    return deltas;
  }
  async getMempool(): Promise<IAddressDelta[]> {
    const method = methods.getaddressmempool;
    const includeAssets = true;
    const params = [{ addresses: this.getAddresses() }, includeAssets];
    return this.rpc(method, params) as Promise<IAddressDelta[]>;
  }
  async getReceiveAddress() {
    const isExternal = true;
    return this._getFirstUnusedAddress(isExternal);
  }

  async getChangeAddress() {
    const isExternal = false;
    return this._getFirstUnusedAddress(isExternal);
  }
  async getUTXOs() {
    return this.rpc(methods.getaddressutxos, [
      { addresses: this.getAddresses() },
    ]);
  }

  getPrivateKeyByAddress(address: string) {
    const f = this.addressObjects.find((a) => a.address === address);

    if (!f) {
      return undefined;
    }
    return f.WIF;
  }

  async send(options: ISend): Promise<ISendResult> {
    const { amount, toAddress } = options;
    let { assetName } = options;

    if (!assetName) {
      assetName = this.baseCurrency;
    }
    const changeAddress = await this.getChangeAddress();

    //Find the first change address after change address (emergency take the first).
    const addresses = this.getAddresses();
    let index = addresses.indexOf(changeAddress);
    if (index > addresses.length) {
      index = 1;
    }
    const changeAddressAssets = addresses[index + 2];

    //Validation
    if (!toAddress) {
      throw Error("Wallet.send  toAddress is mandatory");
    }
    if (!amount) {
      throw Error("Wallet.send amount is mandatory");
    }
    const props: ISendInternalProps = {
      fromAddressObjects: this.addressObjects,
      amount,
      assetName,
      baseCurrency: this.baseCurrency,
      changeAddress,
      changeAddressAssets,
      network: this.network,
      rpc: this.rpc,
      toAddress,
    };
    return Transactor.send(props);
  }

  async getAssets() {
    const includeAssets = true;
    const params = [{ addresses: this.getAddresses() }, includeAssets];
    const balance = (await this.rpc(methods.getaddressbalance, params)) as any;

    //Remove baseCurrency
    const result = balance.filter((obj) => {
      return obj.assetName !== this.baseCurrency;
    });
    return result;
  }
  async getBalance() {
    const includeAssets = false;
    const params = [{ addresses: this.getAddresses() }, includeAssets];
    const balance = (await this.rpc(methods.getaddressbalance, params)) as any;

    return balance.balance / ONE_FULL_COIN;
  }
}

export default {
  createInstance,
};
export async function createInstance(options: IOptions): Promise<Wallet> {
  const wallet = new Wallet();
  await wallet.init(options);
  return wallet;
}

export function getBaseCurrencyByNetwork(network: ChainType): string {
  const map = {
    evr: "EVR",
    "evr-test": "EVR",
    rvn: "RVN",
    "rvn-test": "RVN",
  };
  return map[network];
}
export interface IOptions {
  mnemonic: string;
  network?: ChainType;
  rpc_username?: string;
  rpc_password?: string;
  rpc_url?: string;

  offlineMode?: boolean;
}
