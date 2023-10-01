interface ISend {
    assetName?: string;
    toAddress: string;
    amount: number;
}
type ChainType = "rvn" | "rvn-test" | "evr" | "evr-test";
interface IAddressDelta {
    address: string;
    assetName: string;
    blockindex: number;
    height: number;
    index: number;
    satoshis: number;
    txid: string;
    prevtxid?: string;
}
interface SweepResult {
    errorDescription?: string;
    fromAddress?: string;
    inputs?: Array<IInput>;
    outputs?: any;
    rawTransaction?: string;
    toAddresses?: string[];
    transactionId?: string;
    UTXOs?: Array<IUTXO>;
}
type TPrivateKey = {
    [key: string]: string;
};
interface ISendResult {
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
    height: number;
    id: string;
    outputIndex: number;
    script: string;
    satoshis: number;
    txid: string;
    value: number;
}
interface IAddressMetaData {
    address: string;
    WIF: string;
    path: string;
    privateKey: string;
}
interface IInput {
    txid: string;
    vout: number;
    address?: string;
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
export class Wallet {
    rpc: (method: string, params: any[]) => Promise<any>;
    _mnemonic: string;
    network: ChainType;
    addressObjects: Array<IAddressMetaData>;
    receiveAddress: string;
    changeAddress: string;
    addressPosition: number;
    baseCurrency: string;
    offlineMode: boolean;
    setBaseCurrency(currency: string): void;
    getBaseCurrency(): string;
    /**
     * Sweeping a private key means to send all the funds the address holds to your your wallet.
     * The private key you sweep do not become a part of your wallet.
     *
     * NOTE: the address you sweep needs to cointain enough RVN to pay for the transaction
     *
     * @param WIF the private key of the address that you want move funds from
     * @returns either a string, that is the transaction id or null if there were no funds to send
     */
    sweep(WIF: string, onlineMode: boolean): Promise<SweepResult>;
    getAddressObjects(): IAddressMetaData[];
    getAddresses(): Array<string>;
    init(options: IOptions): Promise<void>;
    hasHistory(addresses: Array<string>): Promise<boolean>;
    _getFirstUnusedAddress(external: boolean): Promise<string>;
    getHistory(): Promise<IAddressDelta[]>;
    getMempool(): Promise<IAddressDelta[]>;
    getReceiveAddress(): Promise<string>;
    getChangeAddress(): Promise<string>;
    /**
     *
     * @param assetName if present, only return UTXOs for that asset, otherwise for all assets
     * @returns UTXOs for assets
     */
    getAssetUTXOs(assetName?: string): Promise<IUTXO[]>;
    getUTXOs(): Promise<any>;
    getPrivateKeyByAddress(address: string): string;
    send(options: ISend): Promise<ISendResult>;
    sendRawTransaction(raw: string): Promise<string>;
    /**
     * Does all the heavy lifting regarding creating a transaction
     * but it does not broadcast the actual transaction.
     * Perhaps the user wants to accept the transaction fee?
     * @param options
     * @returns An transaction that has not been broadcasted
     */
    createTransaction(options: ISend): Promise<ISendResult>;
    getAssets(): Promise<any>;
    getBalance(): Promise<number>;
}
declare const _default: {
    createInstance: typeof createInstance;
};
export default _default;
export function createInstance(options: IOptions): Promise<Wallet>;
export function getBaseCurrencyByNetwork(network: ChainType): string;
export interface IOptions {
    mnemonic: string;
    minAmountOfAddresses?: number;
    network?: ChainType;
    rpc_username?: string;
    rpc_password?: string;
    rpc_url?: string;
    offlineMode?: boolean;
}

//# sourceMappingURL=types.d.ts.map
