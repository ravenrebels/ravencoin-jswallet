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
    addressObjects: Array<IAddressMetaData>;
    addressPosition: number;
    getAddressObjects(): IAddressMetaData[];
    getAddresses(): Array<string>;
    init(options: IOptions): Promise<void>;
    hasHistory(addresses: Array<string>): Promise<boolean>;
    _getFirstUnusedAddress(external: boolean): Promise<string>;
    getReceiveAddress(): Promise<string>;
    getChangeAddress(): Promise<string>;
    getUTXOs(): Promise<any>;
    getPrivateKeyByAddress(address: string): string;
    send(toAddress: string, amount: number): Promise<any>;
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
export function getEnoughUTXOs(utxos: Array<IUTXO>, amount: number): Array<IUTXO>;

//# sourceMappingURL=types.d.ts.map
