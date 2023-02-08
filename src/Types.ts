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

export interface IAddressDelta{
  assetName: string;
  satoshis: number;
  txid: string;
  index: number;
  blockindex: number;
  height: number;
  address: string;
}
export interface ISendResult {
  transactionId: string;
  debug: any;
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
  txid: string;
  outputIndex: number;
  script: string;
  satoshis: number;
  height: number;
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
  address: string;
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
