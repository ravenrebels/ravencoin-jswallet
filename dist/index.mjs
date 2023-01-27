import {Networks as $93qLg$Networks, Transaction as $93qLg$Transaction, PrivateKey as $93qLg$PrivateKey} from "bitcore-lib";
import {ravencoin as $93qLg$ravencoin} from "coininfo";
import {getRPC as $93qLg$getRPC, methods as $93qLg$methods} from "@ravenrebels/ravencoin-rpc";
import $93qLg$ravenrebelsravencoinkey from "@ravenrebels/ravencoin-key";





var $c3676b79c37149df$require$getRPC = $93qLg$getRPC;
var $c3676b79c37149df$require$methods = $93qLg$methods;
const $9de421449659004c$export$ffff6aea08fd9487 = 1e8;


var $c3676b79c37149df$require$ONE_FULL_COIN = $9de421449659004c$export$ffff6aea08fd9487;
const $c3676b79c37149df$var$URL_MAINNET = "https://rvn-rpc-mainnet.ting.finance/rpc";
const $c3676b79c37149df$var$URL_TESTNET = "https://rvn-rpc-testnet.ting.finance/rpc";
//Avoid singleton (anti-pattern)
//Meaning multiple instances of the wallet must be able to co-exist
class $c3676b79c37149df$var$Wallet {
    rpc = $c3676b79c37149df$require$getRPC("anonymous", "anonymous", $c3676b79c37149df$var$URL_MAINNET);
    _mnemonic = "";
    addressObjects = [];
    addressPosition = 0;
    getAddressObjects() {
        return this.addressObjects;
    }
    getAddresses() {
        const addresses = this.addressObjects.map((obj)=>{
            return obj.address;
        });
        return addresses;
    }
    async init(options) {
        //VALIDATION
        if (!options) throw Error("option argument is mandatory");
        if (!options.mnemonic) throw Error("option.mnemonic is mandatory");
        if (options.rpc_username && options.rpc_password && options.rpc_url) this.rpc = $c3676b79c37149df$require$getRPC(options.rpc_username, options.rpc_password, options.rpc_url);
        if (options.network === "rvn-test" && !options.rpc_url) this.rpc = $c3676b79c37149df$require$getRPC("anonymous", "anonymous", $c3676b79c37149df$var$URL_TESTNET);
        //DERIVE ADDRESSES BIP44, external 20 unused (that is no history, not no balance)
        //TODO improve performance by creating blocks of 20 addresses and check history for all 20 at once
        //That is one history lookup intead of 20
        this._mnemonic = options.mnemonic;
        let isLast20ExternalAddressesUnused = false;
        const ACCOUNT = 0;
        const network = options.network || "rvn";
        while(isLast20ExternalAddressesUnused === false){
            const tempAddresses = [];
            for(let i = 0; i < 20; i++){
                const o = (0, $93qLg$ravenrebelsravencoinkey).getAddressPair(network, this._mnemonic, ACCOUNT, this.addressPosition);
                this.addressObjects.push(o.external);
                this.addressObjects.push(o.internal);
                this.addressPosition++;
                tempAddresses.push(o.external.address + "");
            }
            //If no history, break            
            isLast20ExternalAddressesUnused = false === await this.hasHistory(tempAddresses);
        }
    }
    async hasHistory(addresses) {
        const includeAssets = true;
        const obj = {
            addresses: addresses
        };
        const asdf = await this.rpc($c3676b79c37149df$require$methods.getaddresstxids, [
            obj,
            includeAssets
        ]);
        return asdf.length > 0;
    }
    async _getFirstUnusedAddress(external) {
        const addresses = this.getAddresses();
        //even addresses are external, odd address are internal/changes
        for(let counter = 0; counter < addresses.length; counter++){
            if (external && counter % 2 !== 0) continue;
            const address = addresses[counter];
            //If an address has tenth of thousands of transactions, getHistory will throw an exception
            const asdf = await this.hasHistory([
                address
            ]);
            if (asdf === false) return address;
        }
        //IF we have not found one, return the first address
        return addresses[0];
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
        return this.rpc($c3676b79c37149df$require$methods.getaddressutxos, [
            {
                addresses: this.getAddresses()
            }
        ]);
    }
    getPrivateKeyByAddress(address) {
        const f = this.addressObjects.find((a)=>a.address === address);
        if (!f) return undefined;
        return f.WIF;
    }
    async send(toAddress, amount) {
        if (amount < 0) throw Error("Amount cannot be negative");
        if (!toAddress) throw Error("toAddress seems invalid");
        const addresses = this.getAddresses();
        const UTXOs = await this.getUTXOs();
        //Add Ravencoin as Network to BITCORE 
        //@ts-ignore 
        const d = $93qLg$ravencoin.main.toBitcore();
        d.name = "ravencoin";
        d.alias = "RVN";
        $93qLg$Networks.add(d);
        //According to the source file bitcore.Networks.get has two arguments, the second argument keys is OPTIONAL
        //The TypescriptTypes says that the second arguments is mandatory, so ignore that
        //@ts-ignore 
        const ravencoin = $93qLg$Networks.get("RVN");
        //GET UNSPET OUTPUTS (UTXO)
        //Configure RPC bridge
        const balance = await this.rpc($c3676b79c37149df$require$methods.getaddressbalance, [
            {
                addresses: addresses
            }
        ]);
        if (balance.balance) {
            const b = balance.balance / 1e8;
            if (b < amount) throw Error("Not enough money, " + b);
        }
        //GET UNSPENT TRANSACTION OUTPUTS
        const unspent = await this.rpc($c3676b79c37149df$require$methods.getaddressutxos, [
            {
                addresses: addresses
            }
        ]);
        if (unspent.length === 0) throw Error("No unspent transactions outputs");
        const transaction = new $93qLg$Transaction();
        const utxoObjects = UTXOs.map((u)=>new $93qLg$Transaction.UnspentOutput(u));
        const privateKeys = utxoObjects.map((utxo)=>{
            const addy = utxo.address.toString();
            const key = this.getPrivateKeyByAddress(addy);
            const privateKey = new $93qLg$PrivateKey(key);
            return privateKey;
        });
        transaction.from(utxoObjects);
        transaction.fee($c3676b79c37149df$require$ONE_FULL_COIN * 0.02);
        transaction.to(toAddress, amount * $c3676b79c37149df$require$ONE_FULL_COIN);
        transaction.change(addresses[1]); //TODO make dynamic
        transaction.sign(privateKeys);
        return await this.rpc($c3676b79c37149df$require$methods.sendrawtransaction, [
            transaction.serialize()
        ]);
    }
    async getAssets() {
        const includeAssets = true;
        const params = [
            {
                "addresses": this.getAddresses()
            },
            includeAssets
        ];
        const balance = await this.rpc($c3676b79c37149df$require$methods.getaddressbalance, params);
        //Remove RVN
        const result = balance.filter((obj)=>{
            return obj.assetName !== "RVN";
        });
        return result;
    }
    async getBalance() {
        const includeAssets = false;
        const params = [
            {
                "addresses": this.getAddresses()
            },
            includeAssets
        ];
        const balance = await this.rpc($c3676b79c37149df$require$methods.getaddressbalance, params);
        return balance.balance / $c3676b79c37149df$require$ONE_FULL_COIN;
    }
}
var $c3676b79c37149df$export$2e2bcd8739ae039 = {
    createInstance: $c3676b79c37149df$export$99152e8d49ca4e7d
};
async function $c3676b79c37149df$export$99152e8d49ca4e7d(options) {
    const wallet = new $c3676b79c37149df$var$Wallet();
    await wallet.init(options);
    return wallet;
}


export {$c3676b79c37149df$export$2e2bcd8739ae039 as default, $c3676b79c37149df$export$99152e8d49ca4e7d as createInstance};
//# sourceMappingURL=index.mjs.map
