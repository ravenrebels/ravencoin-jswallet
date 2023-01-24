interface IAddressMetaData {
    address: string;
    WIF: string;
    path: string;
    privateKey: string;
}
declare class Wallet {
    rpc: any;
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
export function createInstance(options: any): Promise<Wallet>;
export interface IOptions {
    rpc_username?: string;
    rpc_password?: string;
    rpc_url?: string;
    mnemonic: string;
    network?: "rvn" | "rvn-test";
}

//# sourceMappingURL=types.d.ts.map
