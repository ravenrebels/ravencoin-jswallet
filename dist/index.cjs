var $4aiOY$ravenrebelsravencoinrpc = require("@ravenrebels/ravencoin-rpc");
var $4aiOY$ravenrebelsravencoinkey = require("@ravenrebels/ravencoin-key");
var $4aiOY$ravenrebelsravencoinsigntransaction = require("@ravenrebels/ravencoin-sign-transaction");

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
function $parcel$defineInteropFlag(a) {
  Object.defineProperty(a, '__esModule', {value: true, configurable: true});
}
function $parcel$export(e, n, v, s) {
  Object.defineProperty(e, n, {get: v, set: s, enumerable: true, configurable: true});
}

$parcel$defineInteropFlag(module.exports);

$parcel$export(module.exports, "Wallet", () => $bf36305bcbc0cb23$export$bcca3ea514774656);
$parcel$export(module.exports, "getBaseCurrencyByNetwork", () => $bf36305bcbc0cb23$export$af0c167f1aa2328f);
$parcel$export(module.exports, "default", () => $bf36305bcbc0cb23$export$2e2bcd8739ae039);
$parcel$export(module.exports, "createInstance", () => $bf36305bcbc0cb23$export$99152e8d49ca4e7d);



const $de29b860155088a6$export$ffff6aea08fd9487 = 1e8;




class $e16394a5869d8429$export$2191b9da168c6cf0 extends Error {
    constructor(message){
        super(message);
        this.name = "ValidationError";
    }
}
class $e16394a5869d8429$export$66c44d927ffead98 extends Error {
    constructor(message){
        super(message);
        this.name = "InvalidAddressError";
    }
}
class $e16394a5869d8429$export$b276096bbba16879 extends Error {
    constructor(message){
        super(message);
        this.name = "InsufficientFundsError";
    }
}


class $0757bc65e326b272$export$febc5573c75cefb0 {
    constructor({ wallet: wallet , toAddress: toAddress , amount: amount , assetName: assetName  }){
        this.amount = 0;
        this.feerate = 1 //When loadData is called, this attribute is updated from the blockchain  wallet = null;
        ;
        this.toAddress = toAddress;
        this.amount = amount;
        this.assetName = !assetName ? wallet.baseCurrency : assetName;
        this.wallet = wallet;
    }
    getSizeInKB() {
        const length = this.getUTXOs().length;
        //Lets assume every input is 300 bytes.
        return length * 300 / 1000;
    }
    async loadData() {
        //Load blockchain information async, and wait for it
        const mempoolPromise = this.wallet.getMempool();
        const assetUTXOsPromise = this.wallet.getAssetUTXOs();
        const baseCurencyUTXOsPromise = this.wallet.getUTXOs();
        const feeRatePromise = this.getFeeRate();
        const walletMempool = await mempoolPromise;
        const assetUTXOs = await assetUTXOsPromise;
        const baseCurrencyUTXOs = await baseCurencyUTXOsPromise;
        this.feerate = await feeRatePromise;
        const mempoolUTXOs = $0757bc65e326b272$var$getSpendableMempool(walletMempool);
        //Decorate mempool UTXOs with script attribute
        for (let u of mempoolUTXOs){
            if (u.script) continue;
            //Mempool items might not have the script attbribute, we need it
            const utxo = await this.wallet.rpc("gettxout", [
                u.txid,
                u.index,
                true
            ]);
            if (utxo) u.script = utxo.scriptPubKey.hex;
        }
        const _allUTXOsTemp = assetUTXOs.concat(baseCurrencyUTXOs).concat(mempoolUTXOs);
        //Filter out UTXOs that are NOT in mempool
        const allUTXOs = _allUTXOsTemp.filter((utxo)=>{
            const obj = walletMempool.find((mempoolEntry)=>{
                if (mempoolEntry.prevtxid && mempoolEntry.prevtxid === utxo.id) return true;
                return false;
            });
            return !obj;
        });
        //Sort utxos lowest first
        allUTXOs.sort($0757bc65e326b272$var$sortBySatoshis);
        this._allUTXOs = allUTXOs;
    }
    getUTXOs() {
        if (this.isAssetTransfer() === true) {
            const assetAmount = this.amount;
            const baseCurrencyAmount = this.getBaseCurrencyAmount();
            const baseCurrencyUTXOs = $0757bc65e326b272$var$getEnoughUTXOs(this._allUTXOs, this.wallet.baseCurrency, baseCurrencyAmount);
            const assetUTXOs = $0757bc65e326b272$var$getEnoughUTXOs(this._allUTXOs, this.assetName, assetAmount);
            return assetUTXOs.concat(baseCurrencyUTXOs);
        } else return $0757bc65e326b272$var$getEnoughUTXOs(this._allUTXOs, this.wallet.baseCurrency, this.getBaseCurrencyAmount());
    }
    predictUTXOs() {
        if (this.isAssetTransfer()) return $0757bc65e326b272$var$getEnoughUTXOs(this._allUTXOs, this.assetName, this.amount);
        return $0757bc65e326b272$var$getEnoughUTXOs(this._allUTXOs, this.wallet.baseCurrency, this.amount);
    }
    getBaseCurrencyAmount() {
        const fee = this.getFee();
        if (this.isAssetTransfer() === true) return fee;
        else return this.amount + fee;
    }
    getBaseCurrencyChange() {
        const enoughUTXOs = $0757bc65e326b272$var$getEnoughUTXOs(this._allUTXOs, this.wallet.baseCurrency, this.getBaseCurrencyAmount());
        let total = 0;
        for (let utxo of enoughUTXOs){
            if (utxo.assetName !== this.wallet.baseCurrency) continue;
            total = total + utxo.satoshis / 1e8;
        }
        const result = total - this.getBaseCurrencyAmount();
        return $0757bc65e326b272$export$1778fb2d99201af(result);
    }
    getAssetChange() {
        const enoughUTXOs = $0757bc65e326b272$var$getEnoughUTXOs(this._allUTXOs, this.assetName, this.amount);
        let total = 0;
        for (let utxo of enoughUTXOs){
            if (utxo.assetName !== this.assetName) continue;
            total = total + utxo.satoshis / 1e8;
        }
        return total - this.amount;
    }
    isAssetTransfer() {
        return this.assetName !== this.wallet.baseCurrency;
    }
    async getOutputs() {
        const outputs = {};
        if (this.isAssetTransfer() === true) {
            const changeAddressBaseCurrency = await this.wallet.getChangeAddress();
            //Validate: change address cant be toAddress
            if (changeAddressBaseCurrency === this.toAddress) throw new (0, $e16394a5869d8429$export$2191b9da168c6cf0)("Change address cannot be the same as toAddress");
            outputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();
            const index = this.wallet.getAddresses().indexOf(changeAddressBaseCurrency);
            const changeAddressAsset = this.wallet.getAddresses()[index + 2];
            //Validate change address can never be the same as toAddress
            if (changeAddressAsset === this.toAddress) throw new (0, $e16394a5869d8429$export$2191b9da168c6cf0)("Change address cannot be the same as toAddress");
            if (this.getAssetChange() > 0) outputs[changeAddressAsset] = {
                transfer: {
                    [this.assetName]: this.getAssetChange()
                }
            };
            outputs[this.toAddress] = {
                transfer: {
                    [this.assetName]: this.amount
                }
            };
        } else {
            const changeAddressBaseCurrency = await this.wallet.getChangeAddress();
            outputs[this.toAddress] = this.amount;
            outputs[changeAddressBaseCurrency] = this.getBaseCurrencyChange();
        }
        return outputs;
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
        const utxos = this.predictUTXOs();
        const assumedSizePerUTXO = 300;
        const bytes = (utxos.length + 1) * assumedSizePerUTXO;
        const kb = bytes / 1024;
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
function $0757bc65e326b272$export$1778fb2d99201af(number) {
    return parseFloat(number.toFixed(2));
}
function $0757bc65e326b272$var$sortBySatoshis(u1, u2) {
    if (u1.satoshis > u2.satoshis) return 1;
    if (u1.satoshis === u2.satoshis) return 0;
    return -1;
}
function $0757bc65e326b272$var$getEnoughUTXOs(utxos, asset, amount) {
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
        const error = new (0, $e16394a5869d8429$export$b276096bbba16879)("You do not have " + amount + " " + asset);
        throw error;
    }
    return result;
}
function $0757bc65e326b272$var$getSpendableMempool(mempool) {
    /*
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
*/ const mySet = new Set();
    for (let item of mempool){
        if (!item.prevtxid) continue;
        const value = item.prevtxid + "_" + item.prevout;
        mySet.add(value);
    }
    const spendable = mempool.filter((item)=>{
        if (item.satoshis < 0) return false;
        const value = item.txid + "_" + item.index;
        return mySet.has(value) === false;
    });
    //UTXO object need to have an outputIndex property, not index
    spendable.map((s)=>s.outputIndex = s.index);
    return spendable;
}


(0, ($parcel$interopDefault($4aiOY$ravenrebelsravencoinsigntransaction))).sign; //"Idiocracy" but prevents bundle tools such as PARCEL to strip this dependency out on build.
//sight rate burger maid melody slogan attitude gas account sick awful hammer
//OH easter egg ;)
const $fdd8716063277f2b$var$WIF = "Kz5U4Bmhrng4o2ZgwBi5PjtorCeq2dyM7axGQfdxsBSwCKi5ZfTw";
async function $fdd8716063277f2b$export$322a62cff28f560a(WIF, wallet, onlineMode) {
    const privateKey = (0, ($parcel$interopDefault($4aiOY$ravenrebelsravencoinkey))).getAddressByWIF(wallet.network, WIF);
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
        if (assetName === wallet.baseCurrency) outputs[address] = (0, $0757bc65e326b272$export$1778fb2d99201af)(amount - fixedFee);
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
    const signedHex = (0, ($parcel$interopDefault($4aiOY$ravenrebelsravencoinsigntransaction))).sign(wallet.network, rawHex, UTXOs, privateKeys);
    result.rawTransaction = signedHex;
    if (onlineMode === true) result.transactionId = await rpc("sendrawtransaction", [
        signedHex
    ]);
    return result;
}



const $bf36305bcbc0cb23$var$URL_MAINNET = "https://rvn-rpc-mainnet.ting.finance/rpc";
const $bf36305bcbc0cb23$var$URL_TESTNET = "https://rvn-rpc-testnet.ting.finance/rpc";
class $bf36305bcbc0cb23$export$bcca3ea514774656 {
    setBaseCurrency(currency) {
        this.baseCurrency = currency;
    }
    getBaseCurrency() {
        return this.baseCurrency;
    }
    /**
   * Sweeping a private key means to send all the funds the address holds to your your wallet.
   * The private key you sweep do not become a part of your wallet.
   *
   * NOTE: the address you sweep needs to cointain enough RVN to pay for the transaction
   *
   * @param WIF the private key of the address that you want move funds from
   * @returns either a string, that is the transaction id or null if there were no funds to send
   */ sweep(WIF, onlineMode) {
        const wallet = this;
        return (0, $fdd8716063277f2b$export$322a62cff28f560a)(WIF, wallet, onlineMode);
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
        let url = $bf36305bcbc0cb23$var$URL_MAINNET;
        //VALIDATION
        if (!options) throw Error("option argument is mandatory");
        if (options.offlineMode === true) this.offlineMode = true;
        if (!options.mnemonic) throw Error("option.mnemonic is mandatory");
        url = options.rpc_url || url;
        password = options.rpc_password || url;
        username = options.rpc_username || url;
        if (options.network) {
            this.network = options.network;
            this.setBaseCurrency($bf36305bcbc0cb23$export$af0c167f1aa2328f(options.network));
        }
        if (options.network === "rvn-test" && !options.rpc_url) url = $bf36305bcbc0cb23$var$URL_TESTNET;
        this.rpc = (0, $4aiOY$ravenrebelsravencoinrpc.getRPC)(username, password, url);
        this._mnemonic = options.mnemonic;
        //Generating the hd key is slow, so we re-use the object
        const hdKey = (0, ($parcel$interopDefault($4aiOY$ravenrebelsravencoinkey))).getHDKey(this.network, this._mnemonic);
        const coinType = (0, ($parcel$interopDefault($4aiOY$ravenrebelsravencoinkey))).getCoinType(this.network);
        const ACCOUNT = 0;
        //DERIVE ADDRESSES BIP44, external 20 unused (that is no history, not no balance)
        /*
    if (options.minAmountOfAddresses) {
      for (let i = 0; i < options.minAmountOfAddresses; i++) {
        const o = RavencoinKey.getAddressPair(
          this.network,
          this._mnemonic,
          ACCOUNT,
          this.addressPosition
        );
        this.addressObjects.push(o.external);
        this.addressObjects.push(o.internal);
        this.addressPosition++;
      }
    }

    */ const minAmountOfAddresses = Number.isFinite(options.minAmountOfAddresses) ? options.minAmountOfAddresses : 0;
        let doneDerivingAddresses = false;
        while(doneDerivingAddresses === false){
            //We add new addresses to tempAddresses so we can check history for the last 20
            const tempAddresses = [];
            for(let i = 0; i < 20; i++){
                const external = (0, ($parcel$interopDefault($4aiOY$ravenrebelsravencoinkey))).getAddressByPath(this.network, hdKey, `m/44'/${coinType}'/${ACCOUNT}'/0/${this.addressPosition}`);
                const internal = (0, ($parcel$interopDefault($4aiOY$ravenrebelsravencoinkey))).getAddressByPath(this.network, hdKey, `m/44'/${coinType}'/${ACCOUNT}'/1/${this.addressPosition}`);
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
        const asdf = await this.rpc((0, $4aiOY$ravenrebelsravencoinrpc.methods).getaddressbalance, [
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
    /*
    //even addresses are external, odd address are internal/changes
    for (let counter = 0; counter < addresses.length; counter++) {
      //Internal addresses should be even numbers
      if (external && counter % 2 !== 0) {
        continue;
      }
      //Internal addresses should be odd numbers
      if (external === false && counter % 2 === 0) {
        continue;
      }
      const address = addresses[counter];

      //If an address has tenth of thousands of transactions, getHistory will throw an exception

      const hasHistory = await this.hasHistory([address]);

      if (hasHistory === false) {
        if (external === true) {
          this.receiveAddress = address;
        }
        if (external === false) {
          this.changeAddress = address;
        }
        return address;
      }
    }
*/ }
    async getHistory() {
        const assetName = ""; //Must be empty string, NOT "*"
        const addresses = this.getAddresses();
        const deltas = this.rpc((0, $4aiOY$ravenrebelsravencoinrpc.methods).getaddressdeltas, [
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
        const method = (0, $4aiOY$ravenrebelsravencoinrpc.methods).getaddressmempool;
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
        return this.rpc((0, $4aiOY$ravenrebelsravencoinrpc.methods).getaddressutxos, params);
    }
    async getUTXOs() {
        return this.rpc((0, $4aiOY$ravenrebelsravencoinrpc.methods).getaddressutxos, [
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
    async send(options) {
        const { amount: amount , toAddress: toAddress  } = options;
        let { assetName: assetName  } = options;
        if (!assetName) assetName = this.baseCurrency;
        //Validation
        if (!toAddress) throw Error("Wallet.send toAddress is mandatory");
        if (!amount) throw Error("Wallet.send amount is mandatory");
        const changeAddress = await this.getChangeAddress();
        if (changeAddress === toAddress) throw new Error("Change address cannot be the same as toAddress");
        const transaction = new (0, $0757bc65e326b272$export$febc5573c75cefb0)({
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
        const signed = (0, ($parcel$interopDefault($4aiOY$ravenrebelsravencoinsigntransaction))).sign(this.network, raw, transaction.getUTXOs(), privateKeys);
        const id = await this.rpc("sendrawtransaction", [
            signed
        ]);
        const sendResult = {
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
                UTXOs: transaction.getUTXOs()
            },
            transactionId: id
        };
        return sendResult;
    }
    async getAssets() {
        const includeAssets = true;
        const params = [
            {
                addresses: this.getAddresses()
            },
            includeAssets
        ];
        const balance = await this.rpc((0, $4aiOY$ravenrebelsravencoinrpc.methods).getaddressbalance, params);
        //Remove baseCurrency
        const result = balance.filter((obj)=>{
            return obj.assetName !== this.baseCurrency;
        });
        return result;
    }
    async getBalance() {
        const includeAssets = false;
        const params = [
            {
                addresses: this.getAddresses()
            },
            includeAssets
        ];
        const balance = await this.rpc((0, $4aiOY$ravenrebelsravencoinrpc.methods).getaddressbalance, params);
        return balance.balance / (0, $de29b860155088a6$export$ffff6aea08fd9487);
    }
    constructor(){
        this.rpc = (0, $4aiOY$ravenrebelsravencoinrpc.getRPC)("anonymous", "anonymous", $bf36305bcbc0cb23$var$URL_MAINNET);
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
var $bf36305bcbc0cb23$export$2e2bcd8739ae039 = {
    createInstance: $bf36305bcbc0cb23$export$99152e8d49ca4e7d
};
async function $bf36305bcbc0cb23$export$99152e8d49ca4e7d(options) {
    const wallet = new $bf36305bcbc0cb23$export$bcca3ea514774656();
    await wallet.init(options);
    return wallet;
}
function $bf36305bcbc0cb23$export$af0c167f1aa2328f(network) {
    const map = {
        evr: "EVR",
        "evr-test": "EVR",
        rvn: "RVN",
        "rvn-test": "RVN"
    };
    return map[network];
}


//# sourceMappingURL=index.cjs.map
