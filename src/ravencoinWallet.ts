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

    const ACCOUNT = 0;

    //Should we create an extra amount of addresses at startup?
    if (options.minAmountOfAddresses) {
      for (let i = 0; i < options.minAmountOfAddresses; i++) {
        const o = RavencoinKey.getAddressPair(
          this.network,
          this._mnemonic,
          ACCOUNT,
          this.addressPosition
        );
        this.addressObjects.push(o.external);
        this.addressObjects.push(o.internal);
        this.addressPosition++;
      }
    }

    //Generating the hd key is slow, so we re-use the object
    const hdKey = RavencoinKey.getHDKey(this.network, this._mnemonic);

    const coinType = RavencoinKey.getCoinType(this.network);
    let isLast20ExternalAddressesUnused = false;
    while (isLast20ExternalAddressesUnused === false) {
      //We add new addresses to tempAddresses so we can check history for the last 20
      const tempAddresses = [] as string[];

      for (let i = 0; i < 20; i++) {
        const external = RavencoinKey.getAddressByPath(
          this.network,
          hdKey,
          `m/44'/${coinType}'/${ACCOUNT}'/0/${this.addressPosition}`
        );

        const internal = RavencoinKey.getAddressByPath(
          this.network,
          hdKey,
          `m/44'/${coinType}'/${ACCOUNT}'/1/${this.addressPosition}`
        );

        this.addressObjects.push(external);
        this.addressObjects.push(internal);
        this.addressPosition++;

        tempAddresses.push(external.address + "");
        tempAddresses.push(internal.address + "");
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

    //First make a list of relevant addresses, either external (even) or change (odd)
    const addresses: string[] = [];

    this.getAddresses().map(function (address: string, index: number) {
      if (external === true && index % 2 === 0) {
        addresses.push(address);
      } else if (external === false && index % 2 !== 0) {
        addresses.push(address);
      }
    });

    //Use BINARY SEARCH

    // Binary search implementation to find the first item with `history` set to false
    const binarySearch = async (_addresses: string[]) => {
      let low = 0;
      let high = _addresses.length - 1;
      let result = "";

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const addy = _addresses[mid];

        const hasHistory = await this.hasHistory([addy]);
        if (hasHistory === false) {
          result = addy;
          high = mid - 1; // Continue searching towards the left
        } else {
          low = mid + 1; // Continue searching towards the right
        }
      }

      return result;
    };

    const result = await binarySearch(addresses);

    if (!result) {
      //IF we have not found one, return the first address
      return addresses[0];
    }
    if (external === true) {
      this.receiveAddress = result;
    } else {
      this.changeAddress = result;
    }

    return result;
    /*
    //even addresses are external, odd address are internal/changes
    for (let counter = 0; counter < addresses.length; counter++) {
      //Internal addresses should be even numbers
      if (external && counter % 2 !== 0) {
        continue;
      }
      //Internal addresses should be odd numbers
      if (external === false && counter % 2 === 0) {
        continue;
      }
      const address = addresses[counter];

      //If an address has tenth of thousands of transactions, getHistory will throw an exception

      const hasHistory = await this.hasHistory([address]);

      if (hasHistory === false) {
        if (external === true) {
          this.receiveAddress = address;
        }
        if (external === false) {
          this.changeAddress = address;
        }
        return address;
      }
    }
*/
  }

  async getHistory(): Promise<IAddressDelta[]> {
    const assetName = ""; //Must be empty string, NOT "*"
    const addresses = this.getAddresses();
    const deltas = this.rpc(methods.getaddressdeltas, [
      { addresses, assetName },
    ]);
    //@ts-ignore
    const addressDeltas: IAddressDelta[] = deltas as IAddressDelta[];
    return addressDeltas;
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
  /**
   *
   * @param assetName if present, only return UTXOs for that asset, otherwise for all assets
   * @returns UTXOs for assets
   */
  async getAssetUTXOs(assetName?: string) {
    //If no asset name, set to wildcard, meaning all assets
    const _assetName = !assetName ? "*" : assetName;
    const chainInfo = false;
    const params = [
      { addresses: this.getAddresses(), chainInfo, assetName: _assetName },
    ];

    return this.rpc(methods.getaddressutxos, params);
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
    if (index > addresses.length - 2) {
      index = 1;
    }
    if (index === -1) {
      index = 1;
    }
    const changeAddressAssets = addresses[index + 2];

    if (changeAddressAssets === changeAddress) {
      throw Error(
        "Internal Error, changeAddress and changeAddressAssets cannot be the same"
      );
    }

    //Validation
    if (!toAddress) {
      throw Error("Wallet.send toAddress is mandatory");
    }
    if (!amount) {
      throw Error("Wallet.send amount is mandatory");
    }

    if (changeAddress === toAddress) {
      throw Error(
        "Wallet.send change address cannot be the same as toAddress " +
          changeAddress
      );
    }
    if (changeAddressAssets === toAddress) {
      throw Error(
        "Wallet.send change address for assets cannot be the same as toAddress " +
          changeAddressAssets
      );
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
  minAmountOfAddresses?: number;
  network?: ChainType;
  rpc_username?: string;
  rpc_password?: string;
  rpc_url?: string;

  offlineMode?: boolean;
}
