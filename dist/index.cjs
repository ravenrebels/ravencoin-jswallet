var $4aiOY$ravenrebelsravencoinkey = require("@ravenrebels/ravencoin-key");
var $4aiOY$ravenrebelsravencoinrpc = require("@ravenrebels/ravencoin-rpc");
var $4aiOY$buffer = require("buffer");
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



const $30fffeab88bbc1c2$var$ONE_HUNDRED_MILLION = 1e8;
function $30fffeab88bbc1c2$export$24d1144bbf44c6c6(rpc, addresses) {
    return rpc("getaddressdeltas", [
        {
            addresses: addresses,
            assetName: ""
        }
    ]);
}
function $30fffeab88bbc1c2$export$4e309754b4830e29(rpc, signedTransaction) {
    const p = rpc("sendrawtransaction", [
        signedTransaction
    ]);
    p.catch((e)=>{
        console.log("send raw transaction");
        console.dir(e);
    });
    return p;
}
function $30fffeab88bbc1c2$export$4e98a95db76a53e1(rpc, rawTransactionHex, privateKeys) {
    const s = rpc("signrawtransaction", [
        rawTransactionHex,
        null,
        privateKeys
    ]);
    return s;
}
function $30fffeab88bbc1c2$export$fcbdf06914f0237a(rpc, raw) {
    return rpc("decoderawtransaction", [
        raw
    ]);
}
function $30fffeab88bbc1c2$export$b7bc66c041203976(rpc, id) {
    return rpc("getrawtransaction", [
        id,
        true
    ]);
}
function $30fffeab88bbc1c2$export$3c514ecc803e4adc(rpc, inputs, outputs) {
    return rpc("createrawtransaction", [
        inputs,
        outputs
    ]);
}
async function $30fffeab88bbc1c2$export$f78173835dcde49f(rpc, address) {
    return rpc("validateaddress", [
        address
    ]);
}
function $30fffeab88bbc1c2$export$df96cd8d56be0ab1(rpc, addresses) {
    const includeAssets = true;
    const promise = rpc("getaddressbalance", [
        {
            addresses: addresses
        },
        includeAssets
    ]);
    return promise;
}
function $30fffeab88bbc1c2$export$1021589f9720f1bb(list) {
    //Remember, sort mutates the underlaying array
    //Sort by satoshis, lowest first to prevent dust.
    return list.sort(function(a, b) {
        if (a.satoshis > b.satoshis) return 1;
        if (a.satoshis < b.satoshis) return -1;
        return 0;
    });
}
async function $30fffeab88bbc1c2$export$2c023684d71dad7(rpc, addresses) {
    const list = await rpc("getaddressutxos", [
        {
            addresses: addresses
        }
    ]);
    $30fffeab88bbc1c2$export$1021589f9720f1bb(list);
    return list;
}
function $30fffeab88bbc1c2$export$61ff118ad91d2b8c(rpc, addresses, assetName) {
    const assets = rpc("getaddressutxos", [
        {
            addresses: addresses,
            assetName: assetName
        }
    ]);
    return assets;
}
function $30fffeab88bbc1c2$export$11b542b4427a1a57(rpc, addresses) {
    /*
  Seems like getaddressutxos either return RVN UTXOs or asset UTXOs
  Never both.
  So we make two requests and we join the answer
  */ const raven = rpc("getaddressutxos", [
        {
            addresses: addresses
        }
    ]);
    const assets = rpc("getaddressutxos", [
        {
            addresses: addresses,
            assetName: "*"
        }
    ]);
    return Promise.all([
        raven,
        assets
    ]).then((values)=>{
        const all = values[0].concat(values[1]);
        return all;
    });
}
async function $30fffeab88bbc1c2$export$6bbaa6939a98b630(rpc) {
    const ids = await rpc("getrawmempool", []);
    const result = [];
    for (const id of ids){
        const transaction = await $30fffeab88bbc1c2$export$b7bc66c041203976(rpc, id);
        result.push(transaction);
    }
    return result;
}
function $30fffeab88bbc1c2$export$6a4ffba0c6186ae7(UTXOs) {
    const inputs = UTXOs.map(function(bla) {
        //OK we have to convert from "unspent" format to "vout"
        const obj = {
            txid: bla.txid,
            vout: bla.outputIndex,
            address: bla.address
        };
        return obj;
    });
    return inputs;
}



class $e16394a5869d8429$export$2191b9da168c6cf0 extends Error {
    constructor(message){
        super(message); // (1)
        this.name = "ValidationError"; // (2)
    }
}
class $e16394a5869d8429$export$66c44d927ffead98 extends Error {
    constructor(message){
        super(message); // (1)
        this.name = "InvalidAddressError"; // (2)
    }
}
class $e16394a5869d8429$export$b276096bbba16879 extends Error {
    constructor(message){
        super(message); // (1)
        this.name = "InsufficientFundsError"; // (2)
    }
}



var $827163bad133a0dc$require$Buffer = $4aiOY$buffer.Buffer;
async function $827163bad133a0dc$var$isValidAddress(rpc, address) {
    const obj = await $30fffeab88bbc1c2$export$f78173835dcde49f(rpc, address);
    return obj.isvalid === true;
}
function $827163bad133a0dc$var$sumOfUTXOs(UTXOs) {
    let unspentRavencoinAmount = 0;
    UTXOs.map(function(item) {
        const newValue = item.satoshis / 1e8;
        unspentRavencoinAmount = unspentRavencoinAmount + newValue;
    });
    return unspentRavencoinAmount;
}
/*

    "Chicken and egg" situation.
    We need to calculate how much we shall pay in fees based on the size of the transaction.
    When adding inputs/outputs for the fee, we increase the fee.

    Lets start by first assuming that we will pay 1 RVN in fee (that is sky high).
    Than we check the size of the transaction and then we just adjust the change output so the fee normalizes
*/ async function $827163bad133a0dc$var$getFee(rpc, inputs, outputs) {
    const ONE_KILOBYTE = 1024;
    //Create a raw transaction to get an aproximation for transaction size.
    const raw = await $30fffeab88bbc1c2$export$3c514ecc803e4adc(rpc, inputs, outputs);
    //Get the length of the string bytes not the string
    //This is NOT the exact size since we will add an output for the change address to the transaction
    //Perhaps we should calculate size plus 10%?
    const size = $827163bad133a0dc$require$Buffer.from(raw).length / ONE_KILOBYTE;
    console.log("Size of raw transaction", size);
    let fee = 0.02;
    //TODO should ask the "blockchain" **estimatesmartfee**
    return fee * Math.max(1, size);
}
function $827163bad133a0dc$var$getDefaultSendResult() {
    const sendResult = {
        transactionId: "undefined",
        debug: {
            assetName: "",
            assetUTXOs: [],
            fee: 0,
            inputs: [],
            outputs: null,
            rvnChangeAmount: 0,
            rvnUTXOs: [],
            unspentRVNAmount: "",
            rvnAmount: 0
        }
    };
    return sendResult;
}
async function $827163bad133a0dc$export$89db4734f6c919c4(options) {
    const { amount: amount , assetName: assetName , baseCurrency: baseCurrency , changeAddress: changeAddress , changeAddressAssets: changeAddressAssets , fromAddressObjects: fromAddressObjects , network: network , toAddress: toAddress , rpc: rpc  } = options;
    const sendResult = $827163bad133a0dc$var$getDefaultSendResult();
    const MAX_FEE = 4;
    const isAssetTransfer = assetName !== baseCurrency;
    //VALIDATION
    if (await $827163bad133a0dc$var$isValidAddress(rpc, toAddress) === false) throw new (0, $e16394a5869d8429$export$66c44d927ffead98)("Invalid address " + toAddress);
    if (amount < 0) throw new (0, $e16394a5869d8429$export$2191b9da168c6cf0)("Cant send less than zero");
    const addresses = fromAddressObjects.map((a)=>a.address);
    //Do we have enough of the asset?
    if (isAssetTransfer === true) {
        if (!changeAddressAssets) throw new (0, $e16394a5869d8429$export$2191b9da168c6cf0)("No changeAddressAssets");
        const b = await $30fffeab88bbc1c2$export$df96cd8d56be0ab1(rpc, addresses);
        const a = b.find((asset)=>asset.assetName === assetName);
        if (!a) throw new (0, $e16394a5869d8429$export$b276096bbba16879)("You do not have any " + assetName);
        const balance = a.balance / (0, $de29b860155088a6$export$ffff6aea08fd9487);
        if (balance < amount) throw new (0, $e16394a5869d8429$export$b276096bbba16879)("You do not have " + amount + " " + assetName);
    }
    let allBaseCurrencyUTXOs = await $30fffeab88bbc1c2$export$2c023684d71dad7(rpc, addresses);
    //Remove UTXOs that are currently in mempool
    const mempool = await $30fffeab88bbc1c2$export$6bbaa6939a98b630(rpc);
    allBaseCurrencyUTXOs = allBaseCurrencyUTXOs.filter((UTXO)=>$827163bad133a0dc$export$9ffd76c05265a057(mempool, UTXO) === false);
    const enoughBaseCurrencyUTXOs = $827163bad133a0dc$export$aef5e6c96bd29914(allBaseCurrencyUTXOs, isAssetTransfer ? 1 : amount + MAX_FEE);
    //Sum up the whole unspent amount
    let unspentBaseCurrencyAmount = $827163bad133a0dc$var$sumOfUTXOs(enoughBaseCurrencyUTXOs);
    if (unspentBaseCurrencyAmount <= 0) throw new (0, $e16394a5869d8429$export$b276096bbba16879)("Not enough RVN to transfer asset, perhaps your wallet has pending transactions");
    sendResult.debug.unspentRVNAmount = unspentBaseCurrencyAmount.toLocaleString();
    if (isAssetTransfer === false) {
        if (amount > unspentBaseCurrencyAmount) throw new (0, $e16394a5869d8429$export$b276096bbba16879)("Insufficient funds, cant send " + amount.toLocaleString() + " only have " + unspentBaseCurrencyAmount.toLocaleString());
    }
    const baseCurrencyAmountToSpend = isAssetTransfer ? 0 : amount;
    sendResult.debug.rvnUTXOs = enoughBaseCurrencyUTXOs;
    const inputs = $30fffeab88bbc1c2$export$6a4ffba0c6186ae7(enoughBaseCurrencyUTXOs);
    const outputs = {};
    //Add asset inputs
    sendResult.debug.assetUTXOs = [];
    if (isAssetTransfer === true) {
        if (!changeAddressAssets) throw new (0, $e16394a5869d8429$export$2191b9da168c6cf0)("changeAddressAssets is mandatory when transfering assets");
        const assetUTXOs = await $827163bad133a0dc$var$addAssetInputsAndOutputs(rpc, addresses, assetName, amount, inputs, outputs, toAddress, changeAddressAssets);
        sendResult.debug.assetUTXOs = assetUTXOs;
    } else if (isAssetTransfer === false) outputs[toAddress] = baseCurrencyAmountToSpend;
    const fee = await $827163bad133a0dc$var$getFee(rpc, inputs, outputs);
    sendResult.debug.assetName = assetName;
    sendResult.debug.fee = fee;
    sendResult.debug.rvnAmount = 0;
    const baseCurrencyChangeAmount = unspentBaseCurrencyAmount - baseCurrencyAmountToSpend - fee;
    sendResult.debug.rvnChangeAmount = baseCurrencyChangeAmount;
    //Obviously we only add change address if there is any change
    if ($827163bad133a0dc$var$getTwoDecimalTrunc(baseCurrencyChangeAmount) > 0) outputs[changeAddress] = $827163bad133a0dc$var$getTwoDecimalTrunc(baseCurrencyChangeAmount);
    //Now we have enough UTXos, lets create a raw transactions
    sendResult.debug.inputs = inputs;
    sendResult.debug.outputs = outputs;
    const raw = await $30fffeab88bbc1c2$export$3c514ecc803e4adc(rpc, inputs, outputs);
    sendResult.debug.rawUnsignedTransaction = raw;
    //OK lets find the private keys (WIF) for input addresses
    const privateKeys = {};
    inputs.map(function(input) {
        const addy = input.address;
        const addressObject = fromAddressObjects.find((a)=>a.address === addy);
        if (addressObject) privateKeys[addy] = addressObject.WIF;
    });
    sendResult.debug.privateKeys = privateKeys;
    let UTXOs = [];
    if (enoughBaseCurrencyUTXOs) UTXOs = UTXOs.concat(enoughBaseCurrencyUTXOs);
    if (sendResult.debug.assetUTXOs) UTXOs = UTXOs.concat(sendResult.debug.assetUTXOs);
    try {
        const signedTransaction = (0, $4aiOY$ravenrebelsravencoinsigntransaction.sign)(network, raw, UTXOs, privateKeys);
        sendResult.debug.signedTransaction = signedTransaction;
        const txid = await $30fffeab88bbc1c2$export$4e309754b4830e29(rpc, signedTransaction);
        sendResult.transactionId = txid;
    } catch (e) {
        sendResult.debug.error = e;
    }
    return sendResult;
}
async function $827163bad133a0dc$var$addAssetInputsAndOutputs(rpc, addresses, assetName, amount, inputs, outputs, toAddress, changeAddressAssets) {
    let assetUTXOs = await $30fffeab88bbc1c2$export$61ff118ad91d2b8c(rpc, addresses, assetName);
    const mempool = await $30fffeab88bbc1c2$export$6bbaa6939a98b630(rpc);
    assetUTXOs = assetUTXOs.filter((UTXO)=>$827163bad133a0dc$export$9ffd76c05265a057(mempool, UTXO) === false);
    const _UTXOs = $827163bad133a0dc$export$aef5e6c96bd29914(assetUTXOs, amount);
    const tempInputs = $30fffeab88bbc1c2$export$6a4ffba0c6186ae7(_UTXOs);
    tempInputs.map((item)=>inputs.push(item));
    outputs[toAddress] = {
        transfer: {
            [assetName]: amount
        }
    };
    const assetSum = $827163bad133a0dc$var$sumOfUTXOs(_UTXOs);
    const needsChange = assetSum - amount > 0;
    if (needsChange) outputs[changeAddressAssets] = {
        transfer: {
            [assetName]: assetSum - amount
        }
    };
    return _UTXOs; //Return the UTXOs used for asset transfer
}
function $827163bad133a0dc$var$getTwoDecimalTrunc(num) {
    //Found answer here https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
    //In JavaScript the number 77866.98 minus 111 minus 0.2 equals 77755.95999999999
    //We want it to be 77755.96
    return Math.trunc(num * 100) / 100;
}
function $827163bad133a0dc$export$aef5e6c96bd29914(utxos, amount) {
    /*
  Scenario ONE
  Bob has 300 UTXO with 1 RVN each.
  Bob has one UTXO with 400 RVN.

  Bob intends to send 300 RVN
  In this case the best thing to do is to use the single 400 UTXO

  SCENARIO TWO

  Alice have tons of small UTXOs like 0.03 RVN, 0.2 RVN, she wants to send 5 RVN.
  In this case it makes sense to clean up the "dust", so you dont end up with a lot of small change.


  */ //For small transactions,start with small transactions first.
    let tempAmount = 0;
    const returnValue = [];
    utxos.map(function(utxo) {
        if (utxo.satoshis !== 0 && tempAmount < amount) {
            const value = utxo.satoshis / (0, $de29b860155088a6$export$ffff6aea08fd9487);
            tempAmount = tempAmount + value;
            returnValue.push(utxo);
        }
    });
    //Did we use a MASSIVE amount of UTXOs to safisfy this transaction?
    //In this case check if we do have one single UTXO that can satisfy our needs
    if (returnValue.length > 10) {
        const largerUTXO = utxos.find((utxo)=>utxo.satoshis / (0, $de29b860155088a6$export$ffff6aea08fd9487) > amount);
        if (largerUTXO) //Send this one UTXO that covers it all
        return [
            largerUTXO
        ];
    }
    return returnValue;
}
function $827163bad133a0dc$export$9ffd76c05265a057(mempool, UTXO) {
    function format(transactionId, index) {
        return transactionId + "_" + index;
    }
    const listOfUTXOsInMempool = [];
    mempool.map((transaction)=>{
        transaction.vin.map((vin)=>{
            const id = format(vin.txid, vin.vout);
            listOfUTXOsInMempool.push(id);
        });
    });
    const index = listOfUTXOsInMempool.indexOf(format(UTXO.txid, UTXO.outputIndex));
    const isInMempool = index > -1;
    return isInMempool;
}


const $bf36305bcbc0cb23$var$URL_MAINNET = "https://rvn-rpc-mainnet.ting.finance/rpc";
const $bf36305bcbc0cb23$var$URL_TESTNET = "https://rvn-rpc-testnet.ting.finance/rpc";
class $bf36305bcbc0cb23$export$bcca3ea514774656 {
    rpc = (0, $4aiOY$ravenrebelsravencoinrpc.getRPC)("anonymous", "anonymous", $bf36305bcbc0cb23$var$URL_MAINNET);
    _mnemonic = "";
    network = "rvn";
    addressObjects = [];
    receiveAddress = "";
    changeAddress = "";
    addressPosition = 0;
    baseCurrency = "RVN";
    offlineMode = false;
    setBaseCurrency(currency) {
        this.baseCurrency = currency;
    }
    getBaseCurrency() {
        return this.baseCurrency;
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
        //DERIVE ADDRESSES BIP44, external 20 unused (that is no history, not no balance)
        //TODO improve performance by creating blocks of 20 addresses and check history for all 20 at once
        //That is one history lookup intead of 20
        this._mnemonic = options.mnemonic;
        let isLast20ExternalAddressesUnused = false;
        const ACCOUNT = 0;
        while(isLast20ExternalAddressesUnused === false){
            const tempAddresses = [];
            for(let i = 0; i < 20; i++){
                const o = (0, ($parcel$interopDefault($4aiOY$ravenrebelsravencoinkey))).getAddressPair(this.network, this._mnemonic, ACCOUNT, this.addressPosition);
                this.addressObjects.push(o.external);
                this.addressObjects.push(o.internal);
                this.addressPosition++;
                tempAddresses.push(o.external.address + "");
            }
            if (this.offlineMode === true) //BREAK generation of addresses and do NOT check history on the network
            isLast20ExternalAddressesUnused = true;
            else //If no history, break
            isLast20ExternalAddressesUnused = false === await this.hasHistory(tempAddresses);
        }
    }
    async hasHistory(addresses) {
        const includeAssets = true;
        const obj = {
            addresses: addresses
        };
        const asdf = await this.rpc((0, $4aiOY$ravenrebelsravencoinrpc.methods).getaddresstxids, [
            obj,
            includeAssets
        ]);
        return asdf.length > 0;
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
        const addresses = this.getAddresses();
        //even addresses are external, odd address are internal/changes
        for(let counter = 0; counter < addresses.length; counter++){
            if (external && counter % 2 !== 0) continue;
            const address = addresses[counter];
            //If an address has tenth of thousands of transactions, getHistory will throw an exception
            const hasHistory = await this.hasHistory([
                address
            ]);
            if (hasHistory === false) {
                if (external === true) this.receiveAddress = address;
                return address;
            }
        }
        //IF we have not found one, return the first address
        return addresses[0];
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
        const changeAddress = await this.getChangeAddress();
        //Find the first change address after change address (emergency take the first).
        const addresses = this.getAddresses();
        let index = addresses.indexOf(changeAddress);
        if (index > addresses.length) index = 1;
        const changeAddressAssets = addresses[index + 2];
        console.log("Change address for assets became", changeAddressAssets);
        //Validation
        if (!toAddress) throw Error("Wallet.send  toAddress is mandatory");
        if (!amount) throw Error("Wallet.send amount is mandatory");
        const props = {
            fromAddressObjects: this.addressObjects,
            amount: amount,
            assetName: assetName,
            baseCurrency: this.baseCurrency,
            changeAddress: changeAddress,
            changeAddressAssets: changeAddressAssets,
            network: this.network,
            rpc: this.rpc,
            toAddress: toAddress
        };
        return $827163bad133a0dc$export$89db4734f6c919c4(props);
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
