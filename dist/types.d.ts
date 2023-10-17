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
interface ISendManyOptions {
    assetName?: string;
    outputs: {
        [key: string]: number;
    };
}
interface ISendManyTransactionOptions {
    assetName?: string;
    outputs: {
        [key: string]: number;
    };
    wallet: Wallet;
    forcedUTXOs?: IForcedUTXO[];
    forcedChangeAddressAssets?: string;
    forcedChangeAddressBaseCurrency?: string;
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
        walletMempool: any;
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
    height?: number;
    outputIndex: number;
    script: string;
    satoshis: number;
    txid: string;
    value: number;
    forced?: boolean;
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
interface ITransactionOptions {
    amount: number;
    assetName: string;
    toAddress: string;
    wallet: Wallet;
}
interface IOptions {
    mnemonic: string;
    minAmountOfAddresses?: number;
    network?: ChainType;
    rpc_username?: string;
    rpc_password?: string;
    rpc_url?: string;
    offlineMode?: boolean;
}
interface IMempoolEntry {
    address: string;
    assetName: string;
    txid: string;
    index: number;
    satoshis: number;
    timestamp: number;
    prevtxid: string;
    prevout: number;
}
interface IForcedUTXO {
    utxo: IUTXO;
    privateKey: string;
    address: string;
}
export class SendManyTransaction {
    _allUTXOs: IUTXO[];
    feerate: number;
    constructor(options: ISendManyTransactionOptions);
    getWalletMempool(): IMempoolEntry[];
    getSizeInKB(): number;
    loadData(): Promise<void>;
    getAmount(): number;
    getUTXOs(): IUTXO[];
    predictUTXOs(): IUTXO[];
    getBaseCurrencyAmount(): number;
    getBaseCurrencyChange(): number;
    getAssetChange(): number;
    isAssetTransfer(): boolean;
    getOutputs(): Promise<{}>;
    _getChangeAddressAssets(): Promise<string>;
    getInputs(): {
        address: string;
        txid: string;
        vout: number;
    }[];
    getPrivateKeys(): {};
    getFee(): number;
    getFeeRate(): Promise<any>;
}
export class Transaction {
    constructor({ wallet, toAddress, amount, assetName }: ITransactionOptions);
    getWalletMempool(): IMempoolEntry[];
    getSizeInKB(): number;
    loadData(): Promise<void>;
    getUTXOs(): IUTXO[];
    predictUTXOs(): IUTXO[];
    getBaseCurrencyAmount(): number;
    getBaseCurrencyChange(): number;
    getAssetChange(): number;
    isAssetTransfer(): boolean;
    getOutputs(): Promise<{}>;
    getInputs(): {
        address: string;
        txid: string;
        vout: number;
    }[];
    getPrivateKeys(): {};
    getFee(): number;
    getFeeRate(): Promise<any>;
}
declare function getBaseCurrencyByNetwork(network: ChainType): string;
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
     * The private key you sweep does not become a part of your wallet.
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
    getMempool(): Promise<IMempoolEntry[]>;
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
    sendRawTransaction(raw: string): Promise<string>;
    send(options: ISend): Promise<ISendResult>;
    sendMany({ outputs, assetName }: ISendManyOptions): Promise<ISendResult>;
    /**
     * Does all the heavy lifting regarding creating a SendManyTransaction
     * but it does not broadcast the actual transaction.
     * Perhaps the user wants to accept the transaction fee?
     * @param options
     * @returns An transaction that has not been broadcasted
     */
    createTransaction(options: ISend): Promise<ISendResult>;
    /**
     * Does all the heavy lifting regarding creating a transaction
     * but it does not broadcast the actual transaction.
     * Perhaps the user wants to accept the transaction fee?
     * @param options
     * @returns An transaction that has not been broadcasted
     */
    createSendManyTransaction(options: {
        assetName?: string;
        outputs: {
            [key: string]: number;
        };
    }): Promise<ISendResult>;
    /**
     * This method checks if an UTXO is being spent in the mempool.
     * rpc getaddressutxos will list available UTXOs on the chain.
     * BUT an UTXO can be being spent by a transaction in mempool.
     *
     * @param utxo
     * @returns boolean true if utxo is being spent in mempool, false if not
     */
    isSpentInMempool(utxo: IUTXO): Promise<boolean>;
    getAssets(): Promise<any>;
    getBalance(): Promise<number>;
    convertMempoolEntryToUTXO(mempoolEntry: IMempoolEntry): Promise<IUTXO>;
    /**
     * Get list of spendable UTXOs in mempool.
     * Note: a UTXO in mempool can already be "being spent"
     * @param mempool (optional)
     * @returns list of UTXOs in mempool ready to spend
     */
    getUTXOsInMempool(mempool: IMempoolEntry[]): Promise<IUTXO[]>;
}
declare const _default: {
    createInstance: typeof createInstance;
    getBaseCurrencyByNetwork: typeof getBaseCurrencyByNetwork;
};
export default _default;
export function createInstance(options: IOptions): Promise<Wallet>;

//# sourceMappingURL=types.d.ts.map
