import {getRPC as $93qLg$getRPC, methods as $93qLg$methods} from "@ravenrebels/ravencoin-rpc";
import $93qLg$ravenrebelsravencoinkey from "@ravenrebels/ravencoin-key";
import $93qLg$ravenrebelsravencoinsigntransaction from "@ravenrebels/ravencoin-sign-transaction";






class $df4abebf0c223404$export$2191b9da168c6cf0 extends Error {
    constructor(message){
        super(message);
        this.name = "ValidationError";
    }
}
class $df4abebf0c223404$export$66c44d927ffead98 extends Error {
    constructor(message){
        super(message);
        this.name = "InvalidAddressError";
    }
}
class $df4abebf0c223404$export$b276096bbba16879 extends Error {
    constructor(message){
        super(message);
        this.name = "InsufficientFundsError";
    }
}


class $c7db79d953d79f02$export$a0aa368c31ae6e6c {
    constructor({ wallet: wallet, outputs: outputs, assetName: assetName }){
        this.feerate = 1 //When loadData is called, this attribute is updated from the blockchain  wallet = null;
        ;
        this.walletMempool = [];
        this.assetName = !assetName ? wallet.baseCurrency : assetName;
        this.wallet = wallet;
        this.outputs = outputs;
    }
    getWalletMempool() {
        return this.walletMempool;
    }
    getSizeInKB() {
        const utxos = this.predictUTXOs();
        const assumedSizePerUTXO = 300;
        const assumedSizePerOutput = 100;
        const bytes = (utxos.length + 1) * assumedSizePerUTXO + Object.keys(this.outputs).length * assumedSizePerOutput;
        const kb = bytes / 1024;
        return kb;
    }
    async loadData() {
        //Load blockchain information async, and wait for it
        const mempoolPromise = this.wallet.getMempool();
        const assetUTXOsPromise = this.wallet.getAssetUTXOs();
        const baseCurencyUTXOsPromise = this.wallet.getUTXOs();
        const feeRatePromise = this.getFeeRate();
        this.walletMempool = await mempoolPromise;
        const assetUTXOs = await assetUTXOsPromise;
        const baseCurrencyUTXOs = await baseCurencyUTXOsPromise;
        this.feerate = await feeRatePromise;
        const mempoolUTXOs = await this.wallet.getUTXOsInMempool(this.walletMempool);
        const _allUTXOsTemp = assetUTXOs.concat(baseCurrencyUTXOs).concat(mempoolUTXOs);
        //Filter out UTXOs that are NOT in mempool
        const allUTXOs = _allUTXOsTemp.filter((utxo)=>{
            const objInMempool = this.walletMempool.find((mempoolEntry)=>{
                if (mempoolEntry.prevtxid) {
                    const result = mempoolEntry.prevtxid === utxo.txid && mempoolEntry.prevout === utxo.outputIndex;
                    return result;
                }
                return false;
            });
            return !objInMempool;
        });
        //Sort utxos lowest first
        allUTXOs.sort($c7db79d953d79f02$var$sortBySatoshis);
        let sum = 0;
        allUTXOs.map((u)=>{
            if (u.assetName !== "RVN") return;
            sum += u.satoshis / 1e8;
        });
        console.log("TRANSACTION, available RVN", sum);
        this._allUTXOs = allUTXOs;
    }
    getAmount() {
        let total = 0;
        const values = Object.values(this.outputs);
        values.map((value)=>total += value);
        return total;
    }
    getUTXOs() {
        if (this.isAssetTransfer() === true) {
            const assetAmount = this.getAmount();
            const baseCurrencyAmount = this.getBaseCurrencyAmount();
            const baseCurrencyUTXOs = $c7db79d953d79f02$var$getEnoughUTXOs(this._allUTXOs, this.wallet.baseCurrency, baseCurrencyAmount);
            const assetUTXOs = $c7db79d953d79f02$var$getEnoughUTXOs(this._allUTXOs, this.assetName, assetAmount);
            return assetUTXOs.concat(baseCurrencyUTXOs);
        } else return $c7db79d953d79f02$var$getEnoughUTXOs(this._allUTXOs, this.wallet.baseCurrency, this.getBaseCurrencyAmount());
    }
    predictUTXOs() {
        if (this.isAssetTransfer()) return $c7db79d953d79f02$var$getEnoughUTXOs(this._allUTXOs, this.assetName, this.getAmount());
        return $c7db79d953d79f02$var$getEnoughUTXOs(this._allUTXOs, this.wallet.baseCurrency, this.getAmount());
    }
    getBaseCurrencyAmount() {
        const fee = this.getFee();
        if (this.isAssetTransfer() === true) return fee;
        else return this.getAmount() + fee;
    }
    getBaseCurrencyChange() {
        const enoughUTXOs = $c7db79d953d79f02$var$getEnoughUTXOs(this._allUTXOs, this.wallet.baseCurrency, this.getBaseCurrencyAmount());
        let total = 0;
        for (let utxo of enoughUTXOs){
            if (utxo.assetName !== this.wallet.baseCurrency) continue;
            total = total + utxo.satoshis / 1e8;
        }
        const result = total - this.getBaseCurrencyAmount();
        return $c7db79d953d79f02$export$1778fb2d99201af(result);
    }
    getAssetChange() {
        const enoughUTXOs = $c7db79d953d79f02$var$getEnoughUTXOs(this._allUTXOs, this.assetName, this.getAmount());
        let total = 0;
        for (let utxo of enoughUTXOs){
            if (utxo.assetName !== this.assetName) continue;
            total = total + utxo.satoshis / 1e8;
        }
        return total - this.getAmount();
    }
    isAssetTransfer() {
        return this.assetName !== this.wallet.baseCurrency;
    }
    async getOutputs() {
        //we take the declared outputs and add change outputs
        const totalOutputs = {};
        if (this.isAssetTransfer() === true) {
            const changeAddressBaseCurrency = await this.wallet.getChangeAddress();
            //Validate: change address cant be toAddress
            const toAddresses = Object.keys(this.outputs);
            if (toAddresses.includes(changeAddressBaseCurrency) === true) throw new (0, $df4abebf0c223404$export$2191b9da168c6cf0)("Change address cannot be the same as to address");
            totalOutputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();
            const index = this.wallet.getAddresses().indexOf(changeAddressBaseCurrency);
            const changeAddressAsset = this.wallet.getAddresses()[index + 2];
            //Validate change address can never be the same as toAddress
            if (toAddresses.includes(changeAddressAsset) === true) throw new (0, $df4abebf0c223404$export$2191b9da168c6cf0)("Change address cannot be the same as to address");
            if (this.getAssetChange() > 0) totalOutputs[changeAddressAsset] = {
                transfer: {
                    [this.assetName]: this.getAssetChange()
                }
            };
            for (let addy of Object.keys(this.outputs)){
                const amount = this.outputs[addy];
                totalOutputs[addy] = {
                    transfer: {
                        [this.assetName]: amount
                    }
                };
            }
        } else {
            const changeAddressBaseCurrency = await this.wallet.getChangeAddress();
            for (let addy of Object.keys(this.outputs)){
                const amount = this.outputs[addy];
                totalOutputs[addy] = amount;
            }
            totalOutputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();
        }
        return totalOutputs;
    }
    getInputs() {
        return this.getUTXOs().map((obj)=>{
            return {
                address: obj.address,
                txid: obj.txid,
                vout: obj.outputIndex
            };
        });
    }
    getPrivateKeys() {
        const addressObjects = this.wallet.getAddressObjects();
        const privateKeys = {};
        for (let u of this.getUTXOs()){
            //Find the address object (we want the WIF) for the address related to the UTXO
            const addressObject = addressObjects.find((obj)=>obj.address === u.address);
            if (addressObject) privateKeys[u.address] = addressObject.WIF;
        }
        return privateKeys;
    }
    getFee() {
        const kb = this.getSizeInKB();
        const result = kb * this.feerate;
        return result;
    }
    async getFeeRate() {
        const defaultFee = 0.02;
        try {
            const confirmationTarget = 20;
            const asdf = await this.wallet.rpc("estimatesmartfee", [
                confirmationTarget
            ]);
            if (!asdf.errors) return asdf.feerate;
            else return defaultFee;
        } catch (e) {
            //Might occure errors on testnet when calculating fees
            return defaultFee;
        }
    }
}
function $c7db79d953d79f02$export$1778fb2d99201af(number) {
    return parseFloat(number.toFixed(2));
}
function $c7db79d953d79f02$var$sortBySatoshis(u1, u2) {
    if (u1.satoshis > u2.satoshis) return 1;
    if (u1.satoshis === u2.satoshis) return 0;
    return -1;
}
function $c7db79d953d79f02$var$getEnoughUTXOs(utxos, asset, amount) {
    const result = [];
    let sum = 0;
    for (let u of utxos){
        if (sum > amount) break;
        if (u.assetName !== asset) continue;
        //Ignore UTXOs with zero satoshis, seems to occure when assets are minted
        if (u.satoshis === 0) continue;
        const value = u.satoshis / 1e8;
        result.push(u);
        sum = sum + value;
    }
    if (sum < amount) {
        const error = new (0, $df4abebf0c223404$export$b276096bbba16879)("You do not have " + amount + " " + asset + " you only have " + sum);
        throw error;
    }
    return result;
}


(0, $93qLg$ravenrebelsravencoinsigntransaction).sign; //"Idiocracy" but prevents bundle tools such as PARCEL to strip this dependency out on build.
//sight rate burger maid melody slogan attitude gas account sick awful hammer
//OH easter egg ;)
const $67c46d86d9d50c48$var$WIF = "Kz5U4Bmhrng4o2ZgwBi5PjtorCeq2dyM7axGQfdxsBSwCKi5ZfTw";
async function $67c46d86d9d50c48$export$322a62cff28f560a(WIF, wallet, onlineMode) {
    const privateKey = (0, $93qLg$ravenrebelsravencoinkey).getAddressByWIF(wallet.network, WIF);
    const result = {};
    const rpc = wallet.rpc;
    const obj = {
        addresses: [
            privateKey.address
        ]
    };
    const baseCurrencyUTXOs = await rpc("getaddressutxos", [
        obj
    ]);
    const obj2 = {
        addresses: [
            privateKey.address
        ],
        assetName: "*"
    };
    const assetUTXOs = await rpc("getaddressutxos", [
        obj2
    ]);
    const UTXOs = assetUTXOs.concat(baseCurrencyUTXOs);
    result.UTXOs = UTXOs;
    //Create a raw transaction with ALL UTXOs
    if (UTXOs.length === 0) {
        result.errorDescription = "Address " + privateKey.address + " has no funds";
        return result;
    }
    const balanceObject = {};
    UTXOs.map((utxo)=>{
        if (!balanceObject[utxo.assetName]) balanceObject[utxo.assetName] = 0;
        balanceObject[utxo.assetName] += utxo.satoshis;
    });
    const keys = Object.keys(balanceObject);
    //Start simple, get the first addresses from the wallet
    const outputs = {};
    const fixedFee = 0.02; // should do for now
    keys.map((assetName, index)=>{
        const address = wallet.getAddresses()[index];
        const amount = balanceObject[assetName] / 1e8;
        if (assetName === wallet.baseCurrency) outputs[address] = (0, $c7db79d953d79f02$export$1778fb2d99201af)(amount - fixedFee);
        else outputs[address] = {
            transfer: {
                [assetName]: amount
            }
        };
    });
    result.outputs = outputs;
    //Convert from UTXO format to INPUT fomat
    const inputs = UTXOs.map((utxo, index)=>{
        /*   {
         "txid":"id",                      (string, required) The transaction id
         "vout":n,                         (number, required) The output number
         "sequence":n                      (number, optional) The sequence number
       } 
       */ const input = {
            txid: utxo.txid,
            vout: utxo.outputIndex
        };
        return input;
    });
    //Create raw transaction
    const rawHex = await rpc("createrawtransaction", [
        inputs,
        outputs
    ]);
    const privateKeys = {
        [privateKey.address]: WIF
    };
    const signedHex = (0, $93qLg$ravenrebelsravencoinsigntransaction).sign(wallet.network, rawHex, UTXOs, privateKeys);
    result.rawTransaction = signedHex;
    if (onlineMode === true) result.transactionId = await rpc("sendrawtransaction", [
        signedHex
    ]);
    return result;
}



class $c3dba3dbad356cd6$export$febc5573c75cefb0 {
    constructor({ wallet: wallet, toAddress: toAddress, amount: amount, assetName: assetName }){
        const options = {
            assetName: assetName,
            wallet: wallet,
            outputs: {
                [toAddress]: amount
            }
        };
        this.sendManyTransaction = new (0, $c7db79d953d79f02$export$a0aa368c31ae6e6c)(options);
    }
    getWalletMempool() {
        return this.sendManyTransaction.getWalletMempool();
    }
    getSizeInKB() {
        return this.sendManyTransaction.getSizeInKB();
    }
    async loadData() {
        return this.sendManyTransaction.loadData();
    }
    getUTXOs() {
        return this.sendManyTransaction.getUTXOs();
    }
    predictUTXOs() {
        return this.sendManyTransaction.predictUTXOs();
    }
    getBaseCurrencyAmount() {
        return this.sendManyTransaction.getBaseCurrencyAmount();
    }
    getBaseCurrencyChange() {
        return this.sendManyTransaction.getBaseCurrencyChange();
    }
    getAssetChange() {
        return this.sendManyTransaction.getAssetChange();
    }
    isAssetTransfer() {
        return this.sendManyTransaction.isAssetTransfer();
    }
    async getOutputs() {
        return this.sendManyTransaction.getOutputs();
    }
    getInputs() {
        return this.sendManyTransaction.getInputs();
    }
    getPrivateKeys() {
        return this.sendManyTransaction.getPrivateKeys();
    }
    getFee() {
        return this.sendManyTransaction.getFee();
    }
    async getFeeRate() {
        return this.sendManyTransaction.getFeeRate();
    }
}



function $b986b05eb12d057a$export$af0c167f1aa2328f(network) {
    const map = {
        evr: "EVR",
        "evr-test": "EVR",
        rvn: "RVN",
        "rvn-test": "RVN"
    };
    return map[network];
}



const $9de421449659004c$export$ffff6aea08fd9487 = 1e8;


async function $2767f256fef0b24e$export$df96cd8d56be0ab1(wallet, addresses) {
    const includeAssets = false;
    const params = [
        {
            addresses: addresses
        },
        includeAssets
    ];
    const balance = await wallet.rpc((0, $93qLg$methods).getaddressbalance, params);
    return balance.balance / (0, $9de421449659004c$export$ffff6aea08fd9487);
}




async function $0b10d1d1bbb55c3e$export$ab187dba3e955af9(wallet, addresses) {
    const includeAssets = true;
    const params = [
        {
            addresses: addresses
        },
        includeAssets
    ];
    const balance = await wallet.rpc((0, $93qLg$methods).getaddressbalance, params);
    //Remove baseCurrency
    const result = balance.filter((obj)=>{
        return obj.assetName !== wallet.baseCurrency;
    });
    return result;
}


const $c3676b79c37149df$var$URL_MAINNET = "https://rvn-rpc-mainnet.ting.finance/rpc";
const $c3676b79c37149df$var$URL_TESTNET = "https://rvn-rpc-testnet.ting.finance/rpc";
class $c3676b79c37149df$export$bcca3ea514774656 {
    setBaseCurrency(currency) {
        this.baseCurrency = currency;
    }
    getBaseCurrency() {
        return this.baseCurrency;
    }
    /**
   * Sweeping a private key means to send all the funds the address holds to your your wallet.
   * The private key you sweep does not become a part of your wallet.
   *
   * NOTE: the address you sweep needs to cointain enough RVN to pay for the transaction
   *
   * @param WIF the private key of the address that you want move funds from
   * @returns either a string, that is the transaction id or null if there were no funds to send
   */ sweep(WIF, onlineMode) {
        const wallet = this;
        return (0, $67c46d86d9d50c48$export$322a62cff28f560a)(WIF, wallet, onlineMode);
    }
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
        let username = "anonymous";
        let password = "anonymous";
        let url = $c3676b79c37149df$var$URL_MAINNET;
        //VALIDATION
        if (!options) throw Error("option argument is mandatory");
        if (options.offlineMode === true) this.offlineMode = true;
        if (!options.mnemonic) throw Error("option.mnemonic is mandatory");
        url = options.rpc_url || url;
        password = options.rpc_password || url;
        username = options.rpc_username || url;
        if (options.network) {
            this.network = options.network;
            this.setBaseCurrency((0, $b986b05eb12d057a$export$af0c167f1aa2328f)(options.network));
        }
        if (options.network === "rvn-test" && !options.rpc_url) url = $c3676b79c37149df$var$URL_TESTNET;
        this.rpc = (0, $93qLg$getRPC)(username, password, url);
        this._mnemonic = options.mnemonic;
        //Generating the hd key is slow, so we re-use the object
        const hdKey = (0, $93qLg$ravenrebelsravencoinkey).getHDKey(this.network, this._mnemonic);
        const coinType = (0, $93qLg$ravenrebelsravencoinkey).getCoinType(this.network);
        const ACCOUNT = 0;
        const minAmountOfAddresses = Number.isFinite(options.minAmountOfAddresses) ? options.minAmountOfAddresses : 0;
        let doneDerivingAddresses = false;
        while(doneDerivingAddresses === false){
            //We add new addresses to tempAddresses so we can check history for the last 20
            const tempAddresses = [];
            for(let i = 0; i < 20; i++){
                const external = (0, $93qLg$ravenrebelsravencoinkey).getAddressByPath(this.network, hdKey, `m/44'/${coinType}'/${ACCOUNT}'/0/${this.addressPosition}`);
                const internal = (0, $93qLg$ravenrebelsravencoinkey).getAddressByPath(this.network, hdKey, `m/44'/${coinType}'/${ACCOUNT}'/1/${this.addressPosition}`);
                this.addressObjects.push(external);
                this.addressObjects.push(internal);
                this.addressPosition++;
                tempAddresses.push(external.address + "");
                tempAddresses.push(internal.address + "");
            }
            if (minAmountOfAddresses && minAmountOfAddresses >= this.addressPosition) //In case we intend to create extra addresses on startup
            doneDerivingAddresses = false;
            else if (this.offlineMode === true) //BREAK generation of addresses and do NOT check history on the network
            doneDerivingAddresses = true;
            else //If no history, break
            doneDerivingAddresses = false === await this.hasHistory(tempAddresses);
        }
    }
    async hasHistory(addresses) {
        const includeAssets = true;
        const obj = {
            addresses: addresses
        };
        const asdf = await this.rpc((0, $93qLg$methods).getaddressbalance, [
            obj,
            includeAssets
        ]);
        //@ts-ignore
        const hasReceived = Object.values(asdf).find((asset)=>asset.received > 0);
        return !!hasReceived;
    }
    async _getFirstUnusedAddress(external) {
        //First, check if lastReceivedAddress
        if (external === true && this.receiveAddress) {
            const asdf = await this.hasHistory([
                this.receiveAddress
            ]);
            if (asdf === false) return this.receiveAddress;
        }
        if (external === false && this.changeAddress) {
            const asdf = await this.hasHistory([
                this.changeAddress
            ]);
            if (asdf === false) return this.changeAddress;
        }
        //First make a list of relevant addresses, either external (even) or change (odd)
        const addresses = [];
        this.getAddresses().map(function(address, index) {
            if (external === true && index % 2 === 0) addresses.push(address);
            else if (external === false && index % 2 !== 0) addresses.push(address);
        });
        //Use BINARY SEARCH
        // Binary search implementation to find the first item with `history` set to false
        const binarySearch = async (_addresses)=>{
            let low = 0;
            let high = _addresses.length - 1;
            let result = "";
            while(low <= high){
                const mid = Math.floor((low + high) / 2);
                const addy = _addresses[mid];
                const hasHistory = await this.hasHistory([
                    addy
                ]);
                if (hasHistory === false) {
                    result = addy;
                    high = mid - 1; // Continue searching towards the left
                } else low = mid + 1; // Continue searching towards the right
            }
            return result;
        };
        const result = await binarySearch(addresses);
        if (!result) //IF we have not found one, return the first address
        return addresses[0];
        if (external === true) this.receiveAddress = result;
        else this.changeAddress = result;
        return result;
    }
    async getHistory() {
        const assetName = ""; //Must be empty string, NOT "*"
        const addresses = this.getAddresses();
        const deltas = this.rpc((0, $93qLg$methods).getaddressdeltas, [
            {
                addresses: addresses,
                assetName: assetName
            }
        ]);
        //@ts-ignore
        const addressDeltas = deltas;
        return addressDeltas;
    }
    async getMempool() {
        const method = (0, $93qLg$methods).getaddressmempool;
        const includeAssets = true;
        const params = [
            {
                addresses: this.getAddresses()
            },
            includeAssets
        ];
        return this.rpc(method, params);
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
   */ async getAssetUTXOs(assetName) {
        //If no asset name, set to wildcard, meaning all assets
        const _assetName = !assetName ? "*" : assetName;
        const chainInfo = false;
        const params = [
            {
                addresses: this.getAddresses(),
                chainInfo: chainInfo,
                assetName: _assetName
            }
        ];
        return this.rpc((0, $93qLg$methods).getaddressutxos, params);
    }
    async getUTXOs() {
        return this.rpc((0, $93qLg$methods).getaddressutxos, [
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
    async sendRawTransaction(raw) {
        return this.rpc("sendrawtransaction", [
            raw
        ]);
    }
    async send(options) {
        //ACTUAL SENDING TRANSACTION
        //Important, do not swallow the exceptions/errors of createTransaction, let them fly
        const sendResult = await this.createTransaction(options);
        try {
            const id = await this.rpc("sendrawtransaction", [
                sendResult.debug.signedTransaction
            ]);
            sendResult.transactionId = id;
            return sendResult;
        } catch (e) {
            throw new Error("Error while sending, perhaps you have pending transaction? Please try again.");
        }
    }
    async sendMany({ outputs: outputs, assetName: assetName }) {
        const options = {
            wallet: this,
            outputs: outputs,
            assetName: assetName
        };
        const sendResult = await this.createSendManyTransaction(options);
        //ACTUAL SENDING TRANSACTION
        //Important, do not swallow the exceptions/errors of createSendManyTransaction, let them fly
        try {
            const id = await this.rpc("sendrawtransaction", [
                sendResult.debug.signedTransaction
            ]);
            sendResult.transactionId = id;
            return sendResult;
        } catch (e) {
            throw new Error("Error while sending, perhaps you have pending transaction? Please try again.");
        }
    }
    /**
   * Does all the heavy lifting regarding creating a SendManyTransaction
   * but it does not broadcast the actual transaction.
   * Perhaps the user wants to accept the transaction fee?
   * @param options
   * @returns An transaction that has not been broadcasted
   */ async createTransaction(options) {
        const { amount: amount, toAddress: toAddress } = options;
        let { assetName: assetName } = options;
        if (!assetName) assetName = this.baseCurrency;
        //Validation
        if (!toAddress) throw Error("Wallet.send toAddress is mandatory");
        if (!amount) throw Error("Wallet.send amount is mandatory");
        const changeAddress = await this.getChangeAddress();
        if (changeAddress === toAddress) throw new Error("Change address cannot be the same as toAddress");
        const transaction = new (0, $c3dba3dbad356cd6$export$febc5573c75cefb0)({
            assetName: assetName,
            amount: amount,
            toAddress: toAddress,
            wallet: this
        });
        await transaction.loadData();
        const inputs = transaction.getInputs();
        const outputs = await transaction.getOutputs();
        const privateKeys = transaction.getPrivateKeys();
        const raw = await this.rpc("createrawtransaction", [
            inputs,
            outputs
        ]);
        const signed = (0, $93qLg$ravenrebelsravencoinsigntransaction).sign(this.network, raw, transaction.getUTXOs(), privateKeys);
        //ACTUAL SENDING TRANSACTION
        try {
            //   const id = await this.rpc("sendrawtransaction", [signed]);
            const sendResult = {
                transactionId: null,
                debug: {
                    amount: amount,
                    assetName: assetName,
                    fee: transaction.getFee(),
                    inputs: inputs,
                    outputs: outputs,
                    privateKeys: privateKeys,
                    rawUnsignedTransaction: raw,
                    rvnChangeAmount: transaction.getBaseCurrencyChange(),
                    rvnAmount: transaction.getBaseCurrencyAmount(),
                    signedTransaction: signed,
                    UTXOs: transaction.getUTXOs(),
                    walletMempool: transaction.getWalletMempool()
                }
            };
            return sendResult;
        } catch (e) {
            throw new Error("Error while sending, perhaps you have pending transaction? Please try again.");
        }
    }
    /**
   * Does all the heavy lifting regarding creating a transaction
   * but it does not broadcast the actual transaction.
   * Perhaps the user wants to accept the transaction fee?
   * @param options
   * @returns An transaction that has not been broadcasted
   */ async createSendManyTransaction(options) {
        let { assetName: assetName } = options;
        if (!assetName) assetName = this.baseCurrency;
        //Validation
        if (!options.outputs) throw Error("Wallet.createSendManyTransaction outputs is mandatory");
        else if (Object.keys(options.outputs).length === 0) throw new (0, $df4abebf0c223404$export$2191b9da168c6cf0)("outputs is mandatory, shoud be an object with address as keys and amounts (numbers) as values");
        const changeAddress = await this.getChangeAddress();
        const toAddresses = Object.keys(options.outputs);
        if (toAddresses.includes(changeAddress)) throw new Error("You cannot send to your current change address");
        const transaction = new (0, $c7db79d953d79f02$export$a0aa368c31ae6e6c)({
            assetName: assetName,
            outputs: options.outputs,
            wallet: this
        });
        await transaction.loadData();
        const inputs = transaction.getInputs();
        const outputs = await transaction.getOutputs();
        const privateKeys = transaction.getPrivateKeys();
        const raw = await this.rpc("createrawtransaction", [
            inputs,
            outputs
        ]);
        const signed = (0, $93qLg$ravenrebelsravencoinsigntransaction).sign(this.network, raw, transaction.getUTXOs(), privateKeys);
        try {
            const sendResult = {
                transactionId: null,
                debug: {
                    amount: transaction.getAmount(),
                    assetName: assetName,
                    fee: transaction.getFee(),
                    inputs: inputs,
                    outputs: outputs,
                    privateKeys: privateKeys,
                    rawUnsignedTransaction: raw,
                    rvnChangeAmount: transaction.getBaseCurrencyChange(),
                    rvnAmount: transaction.getBaseCurrencyAmount(),
                    signedTransaction: signed,
                    UTXOs: transaction.getUTXOs(),
                    walletMempool: transaction.getWalletMempool()
                }
            };
            return sendResult;
        } catch (e) {
            throw new Error("Error while sending, perhaps you have pending transaction? Please try again.");
        }
    }
    async getAssets() {
        return (0, $0b10d1d1bbb55c3e$export$ab187dba3e955af9)(this, this.getAddresses());
    }
    async getBalance() {
        const a = this.getAddresses();
        return (0, $2767f256fef0b24e$export$df96cd8d56be0ab1)(this, a);
    }
    async convertMempoolEntryToUTXO(mempoolEntry) {
        //Mempool items might not have the script attbribute, we need it
        const out = await this.rpc("gettxout", [
            mempoolEntry.txid,
            mempoolEntry.index,
            true
        ]);
        const utxo = {
            ...mempoolEntry,
            script: out.scriptPubKey.hex,
            outputIndex: mempoolEntry.index,
            value: mempoolEntry.satoshis / 1e8
        };
        return utxo;
    }
    async getUTXOsInMempool(mempool) {
        //If no mempool argument, fetch mempool
        let _mempool = mempool;
        if (!_mempool) _mempool = await this.getMempool();
        const mySet = new Set();
        for (let item of _mempool){
            if (!item.prevtxid) continue;
            const value = item.prevtxid + "_" + item.prevout;
            mySet.add(value);
        }
        const spendable = mempool.filter((item)=>{
            if (item.satoshis < 0) return false;
            const value = item.txid + "_" + item.index;
            return mySet.has(value) === false;
        });
        const utxos = [];
        for (let s of spendable){
            const u = await this.convertMempoolEntryToUTXO(s);
            utxos.push(u);
        }
        return utxos;
    }
    constructor(){
        this.rpc = (0, $93qLg$getRPC)("anonymous", "anonymous", $c3676b79c37149df$var$URL_MAINNET);
        this._mnemonic = "";
        this.network = "rvn";
        this.addressObjects = [];
        this.receiveAddress = "";
        this.changeAddress = "";
        this.addressPosition = 0;
        this.baseCurrency = "RVN" //Default is RVN but it could be EVR
        ;
        this.offlineMode = false;
    }
}
var $c3676b79c37149df$export$2e2bcd8739ae039 = {
    createInstance: $c3676b79c37149df$export$99152e8d49ca4e7d,
    getBaseCurrencyByNetwork: $b986b05eb12d057a$export$af0c167f1aa2328f
};
async function $c3676b79c37149df$export$99152e8d49ca4e7d(options) {
    const wallet = new $c3676b79c37149df$export$bcca3ea514774656();
    await wallet.init(options);
    return wallet;
}


export {$c3676b79c37149df$export$bcca3ea514774656 as Wallet, $c3676b79c37149df$export$2e2bcd8739ae039 as default, $c3676b79c37149df$export$99152e8d49ca4e7d as createInstance};
//# sourceMappingURL=index.mjs.map
