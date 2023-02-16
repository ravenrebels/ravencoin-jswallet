interface ISend {
    assetName: string;
    toAddress: string;
    amount: number;
}
interface IAddressDelta {
    assetName: string;
    satoshis: number;
    txid: string;
    index: number;
    blockindex: number;
    height: number;
    address: string;
}
type TPrivateKey = {
    [key: string]: string;
};
interface ISendResult {
    transactionId: string;
    debug: {
        assetName: string;
        assetUTXOs: Array<IUTXO>;
        error?: any;
        fee: number;
        inputs: Array<IVout_when_creating_transactions>;
        outputs: any;
        privateKeys?: TPrivateKey;
        rawUnsignedTransaction?: string;
        rvnAmount: number;
        rvnChangeAmount: number;
        rvnUTXOs: Array<IUTXO>;
        signedTransaction?: string;
        unspentRVNAmount: any;
    };
}
interface IVout_when_creating_transactions {
    txid: string;
    vout: number;
    address: string;
}
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
interface IAddressMetaData {
    address: string;
    WIF: string;
    path: string;
    privateKey: string;
}
interface IAddressMetaData {
    address: string;
    WIF: string;
    path: string;
    privateKey: string;
}
interface IUTXO {
    address: string;
    assetName: string;
    txid: string;
    outputIndex: number;
    script: string;
    satoshis: number;
    height: number;
}
declare class Wallet {
    rpc: (method: string, params: any[]) => Promise<any>;
    _mnemonic: string;
    network: "rvn" | "rvn-test";
    addressObjects: Array<IAddressMetaData>;
    receiveAddress: string;
    changeAddress: string;
    addressPosition: number;
    baseCurrency: string;
    setBaseCurrency(currency: string): void;
    getBaseCurrency(): string;
    getAddressObjects(): IAddressMetaData[];
    getAddresses(): Array<string>;
    init(options: IOptions): Promise<void>;
    hasHistory(addresses: Array<string>): Promise<boolean>;
    _getFirstUnusedAddress(external: boolean): Promise<string>;
    getMempool(): Promise<IAddressDelta[]>;
    getReceiveAddress(): Promise<string>;
    getChangeAddress(): Promise<string>;
    getUTXOs(): Promise<any>;
    getPrivateKeyByAddress(address: string): string;
    send(options: ISend): Promise<ISendResult>;
    getAssets(): Promise<any>;
    getBalance(): Promise<number>;
}
declare const _default: {
    createInstance: typeof createInstance;
};
export default _default;
export function createInstance(options: IOptions): Promise<Wallet>;
export interface IOptions {
    rpc_username?: string;
    rpc_password?: string;
    rpc_url?: string;
    mnemonic: string;
    network?: "rvn" | "rvn-test";
}

//# sourceMappingURL=types.d.ts.map
