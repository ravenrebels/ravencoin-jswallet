import { Wallet } from "./ravencoinWallet";

export interface ISettings {
  assets?: Array<string>;
  baseCurrency: "RVN"; //TODO is this really needed? do we not get that info from the network attribute?
  mode: "RAVENCOIN_AND_ASSETS" | "ASSETS" | "SOME_ASSETS";

  subTagline?: string;
  tagline: string;
  headline: string;
}
export interface ISend {
  assetName?: string;
  toAddress: string;
  amount: number;
}
export type ChainType = "rvn" | "rvn-test" | "evr" | "evr-test";
export interface IAddressDelta {
  address: string;
  assetName: string;
  blockindex: number;
  height: number;
  index: number;
  satoshis: number;
  txid: string;

  prevtxid?: string;
}
export interface ISendManyOptions {
  assetName?: string;
  outputs: { [key: string]: number };
}

export interface ISendManyTransactionOptions {
  assetName?: string;
  outputs: { [key: string]: number };
  wallet: Wallet;
}

export interface SweepResult {
  errorDescription?: string;
  fromAddress?: string;
  inputs?: Array<IInput>;
  outputs?: any;
  rawTransaction?: string;
  toAddresses?: string[];
  transactionId?: string;
  UTXOs?: Array<IUTXO>;
}
export type TPrivateKey = {
  [key: string]: string;
};

export interface ISendResult {
  transactionId: string | null;
  debug: {
    amount: number;
    assetName: string;
    error?: any;
    fee: number;
    inputs: Array<IVout_when_creating_transactions>;
    outputs: any;
    privateKeys?: TPrivateKey;
    rawUnsignedTransaction?: string;
    rvnAmount: number;
    rvnChangeAmount: number;
    signedTransaction?: string;
    UTXOs: IUTXO[];
    walletMempool: any;
  };
}
export interface Asset {
  name: string;
  amount: number;
}

export interface IHistory {
  inputs: Array<IHistoryTransaction>;
  outputs: Array<IHistoryTransaction>;
}
export interface IHistoryTransaction {
  blockhash: string;
  time: number;
  vout: IVout[];
  vin: Vin[];

  txid: string;
}
export interface ITransaction {
  c_asset?: string;
  c_amount_satoshis?: number;
  asset?: Asset;
  amount?: number;
  blockhash?: string;
  blocktime?: number;
  hex?: string;
  locktime: number;
  vin: Vin[];
  hash: string;
  size: number;
  vsize: number;
  time?: number;
  txid: string;
  vout: IVout[];
  version?: number;
}
export interface ISendInternalProps {
  amount: number;
  assetName: string;
  baseCurrency: string;
  changeAddress: string;
  changeAddressAssets?: string;
  fromAddressObjects: Array<IAddressMetaData>;
  network: ChainType;
  readOnly?: boolean;
  rpc: RPCType;
  toAddress: string;
}

interface Vin {
  c_index?: number;
  address?: string;

  scriptSig: ScriptSig;
  sequence: number;
  txid: string;
  value: number;
  valueSat: number;
  vout: number;
}

interface ScriptSig {
  asm: string;
  hex: string;
}
export interface IVout_when_creating_transactions {
  txid: string;
  vout: number;
  address: string;
}
export interface IVout {
  c_index?: number;
  value: number;
  n: number;
  scriptPubKey: ScriptPubKey;
  valueSat: number;
}

interface ScriptPubKey {
  asm: string;
  hex: string;
  reqSigs: number;
  type: string;
  addresses: string[];
  asset?: Asset;
}

export type IBalance = BalanceRoot[] | null;

export interface BalanceRoot {
  assetName: string;
  balance: number;
  received: number;
}

export interface IValidateAddressResponse {
  isvalid: boolean;
  address: string;
  scriptPubKey: string;
  ismine: boolean;
  iswatchonly: boolean;
  isscript: boolean;
}
export interface IUTXO {
  address: string;
  assetName: string;
  height: number;
  id: string;
  outputIndex: number;
  script: string;
  satoshis: number;
  txid: string;
  value: number;
}
export interface IAssetMetaData {
  assetName: string;
}
export interface IAddressMetaData {
  address: string;
  WIF: string;
  path: string;
  privateKey: string;
}
export interface IUser {
  lastKnownUsedPosition?: number;
  id: string;
  mnemonic: string;
  displayName?: string;
  profileImageURL?: string;
}
export interface IConfig {
  raven_username: string;
  raven_password: string;
  raven_url: string;
  network: string;
}

export interface IInput {
  txid: string;
  vout: number;
  address?: string;
}

export type RPCType = (arg1: string, arg2: any[]) => any;

export interface IAddressMetaData {
  address: string;
  WIF: string;
  path: string;
  privateKey: string;
}
export interface IUTXO {
  address: string;
  assetName: string;
  txid: string;
  outputIndex: number;
  script: string;
  satoshis: number;
  height: number;
}
export interface ITransactionOptions {
  amount: number;
  assetName: string;
  toAddress: string;
  wallet: Wallet;
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

export interface IMempoolEntry {
  address: string;
  assetName: string;
  txid: string;
  index: number;
  satoshis: number;
  timestamp: number;
  prevtxid: string;
  prevout: number;
}
