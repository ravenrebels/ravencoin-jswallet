
const bitcore = require("bitcore-lib");
const coininfo = require("coininfo");

const { getRPC, methods } = require("@ravenrebels/ravencoin-rpc");
import RavencoinKey from "@ravenrebels/ravencoin-key";
import { IAddressMetaData } from "./Types";
const { ONE_FULL_COIN } = require("./contants");

const URL_MAINNET = "https://rvn-rpc-mainnet.ting.finance/rpc";
const URL_TESTNET = "https://rvn-rpc-testnet.ting.finance/rpc"

//Avoid singleton (anti-pattern)
//Meaning multiple instances of the wallet must be able to co-exist



class Wallet {
    rpc = getRPC(
        "anonymous",
        "anonymous",
        URL_MAINNET
    );
    _mnemonic = "";

    addressObjects: Array<IAddressMetaData> = [];

    addressPosition = 0;

    getAddressObjects() {
        return this.addressObjects;
    }
    getAddresses(): Array<string> {
        const addresses = this.addressObjects.map(obj => {
            return obj.address
        });
        return addresses;
    }

    async init(options: IOptions) {

        //VALIDATION
        if (!options) {
            throw Error("option argument is mandatory");
        }
        if (!options.mnemonic) {
            throw Error("option.mnemonic is mandatory");
        }
        if (options.rpc_username && options.rpc_password && options.rpc_url) {

            this.rpc = getRPC(options.rpc_username, options.rpc_password, options.rpc_url);
        }

        if (options.network === "rvn-test" && !options.rpc_url) {
            this.rpc = getRPC("anonymous", "anonymous", URL_TESTNET);
        }

        //DERIVE ADDRESSES BIP44, external 20 unused (that is no history, not no balance)
        //TODO improve performance by creating blocks of 20 addresses and check history for all 20 at once
        //That is one history lookup intead of 20
        this._mnemonic = options.mnemonic;
        let isLast20ExternalAddressesUnused = false;
        const ACCOUNT = 0;
        const network = options.network || "rvn";

        while (isLast20ExternalAddressesUnused === false) {

            const tempAddresses = [] as string[];

            for (let i = 0; i < 20; i++) {

                const o = RavencoinKey.getAddressPair(network, this._mnemonic, ACCOUNT, this.addressPosition);
                this.addressObjects.push(o.external);
                this.addressObjects.push(o.internal);
                this.addressPosition++;

                tempAddresses.push(o.external.address + "");

            }
            //If no history, break            
            isLast20ExternalAddressesUnused = false === await this.hasHistory(tempAddresses);
        }
    }
    async hasHistory(addresses: Array<string>): Promise<boolean> {

        const includeAssets = true;
        const obj = {
            addresses,
        };
        const asdf = await this.rpc(methods.getaddresstxids, [obj, includeAssets]);
        return asdf.length > 0;
    }


    async _getFirstUnusedAddress(external: boolean) {

        const addresses = this.getAddresses();
        //even addresses are external, odd address are internal/changes

        for (let counter = 0; counter < addresses.length; counter++) {

            if (external && counter % 2 !== 0) {
                continue;
            }
            const address = addresses[counter];

            //If an address has tenth of thousands of transactions, getHistory will throw an exception

            const asdf = await this.hasHistory([address]);

            if (asdf === false) {
                return address;
            }
        }


        //IF we have not found one, return the first address
        return addresses[0];

    }


    async getReceiveAddress() {

        const isExternal = true;
        return this._getFirstUnusedAddress(isExternal)
    }

    async getChangeAddress() {
        const isExternal = false;
        return this._getFirstUnusedAddress(isExternal)
    }
    async getUTXOs() {
        return this.rpc(methods.getaddressutxos, [{ addresses: this.getAddresses() }]);
    }


    getPrivateKeyByAddress(address: string) {

        const f = this.addressObjects.find(a => a.address === address);

        if (!f) {
            return undefined;
        }
        return f.WIF;

    }


    async send(toAddress: string, amount: number) {

        if (amount < 0) {
            throw Error("Amount cannot be negative");
        }
        if (!toAddress) {
            throw Error("toAddress seems invalid");
        }
        const addresses = this.getAddresses();
        const UTXOs = await this.getUTXOs();

        //Add Ravencoin as Network to BITCORE 
        //@ts-ignore 
        const d = coininfo.ravencoin.main.toBitcore();
        d.name = "ravencoin";
        d.alias = "RVN";
        bitcore.Networks.add(d);

        //According to the source file bitcore.Networks.get has two arguments, the second argument keys is OPTIONAL
        //The TypescriptTypes says that the second arguments is mandatory, so ignore that
        //@ts-ignore 
        const ravencoin = bitcore.Networks.get("RVN");

        //GET UNSPET OUTPUTS (UTXO)
        //Configure RPC bridge

        const balance = await this.rpc(methods.getaddressbalance, [
            { addresses: addresses },
        ]);
        if (balance.balance) {
            const b = balance.balance / 1e8;

            if (b < amount) {
                throw Error("Not enough money, " + b);
            }

        }

        //GET UNSPENT TRANSACTION OUTPUTS
        const unspent = await this.rpc(methods.getaddressutxos, [
            { addresses: addresses },
        ]);

        if (unspent.length === 0) {

            throw Error("No unspent transactions outputs");
        }

        const transaction = new bitcore.Transaction();
        const utxoObjects = UTXOs.map(u => new bitcore.Transaction.UnspentOutput(u))

        const privateKeys = utxoObjects.map(utxo => {
            const addy = utxo.address.toString();
            const key = this.getPrivateKeyByAddress(addy);
            const privateKey = new bitcore.PrivateKey(key);
            return privateKey;
        });

        transaction.from(utxoObjects);
        transaction.fee(ONE_FULL_COIN * 0.02);
        transaction.to(toAddress, amount * ONE_FULL_COIN);
        transaction.change(addresses[1]); //TODO make dynamic
        transaction.sign(privateKeys);

        return await this.rpc(methods.sendrawtransaction, [transaction.serialize()])

    }
    async getAssets() {

        const includeAssets = true;
        const params = [{ "addresses": this.getAddresses() }, includeAssets];
        const balance = await this.rpc(methods.getaddressbalance, params);

        //Remove RVN
        const result = balance.filter(obj => {
            return obj.assetName !== "RVN";
        })
        return result;
    }
    async getBalance() {
        const includeAssets = false;
        const params = [{ "addresses": this.getAddresses() }, includeAssets];
        const balance = await this.rpc(methods.getaddressbalance, params);

        return balance.balance / ONE_FULL_COIN;
    }

}

export async function createInstance(options:IOptions) {
    const wallet = new Wallet();
    await wallet.init(options);
    return wallet

}

export interface IOptions {
    rpc_username?: string;
    rpc_password?: string;
    rpc_url?: string;
    mnemonic: string;
    network?: "rvn" | "rvn-test";
}










