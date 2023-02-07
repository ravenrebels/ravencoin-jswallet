import {Networks as $93qLg$Networks, Transaction as $93qLg$Transaction, PrivateKey as $93qLg$PrivateKey} from "bitcore-lib";
import {ravencoin as $93qLg$ravencoin} from "coininfo";
import {getRPC as $93qLg$getRPC, methods as $93qLg$methods} from "@ravenrebels/ravencoin-rpc";
import $93qLg$ravenrebelsravencoinkey from "@ravenrebels/ravencoin-key";
import {Buffer as $93qLg$Buffer} from "buffer";

const $de17ee1c983f5fa9$var$ONE_HUNDRED_MILLION = 1e8;
function $de17ee1c983f5fa9$export$24d1144bbf44c6c6(rpc, addresses) {
    return rpc("getaddressdeltas", [
        {
            addresses: addresses,
            assetName: ""
        }
    ]);
}
function $de17ee1c983f5fa9$export$4e309754b4830e29(rpc, signedTransaction) {
    const p = rpc("sendrawtransaction", [
        signedTransaction.hex
    ]);
    p.catch((e)=>{
        console.log("send raw transaction");
        console.dir(e);
    });
    return p;
}
function $de17ee1c983f5fa9$export$4e98a95db76a53e1(rpc, rawTransactionHex, privateKeys) {
    const s = rpc("signrawtransaction", [
        rawTransactionHex,
        null,
        privateKeys
    ]);
    return s;
}
function $de17ee1c983f5fa9$export$fcbdf06914f0237a(rpc, raw) {
    return rpc("decoderawtransaction", [
        raw
    ]);
}
function $de17ee1c983f5fa9$export$b7bc66c041203976(rpc, id) {
    return rpc("getrawtransaction", [
        id,
        true
    ]);
}
function $de17ee1c983f5fa9$export$3c514ecc803e4adc(rpc, inputs, outputs) {
    return rpc("createrawtransaction", [
        inputs,
        outputs
    ]);
}
async function $de17ee1c983f5fa9$export$f78173835dcde49f(rpc, address) {
    return rpc("validateaddress", [
        address
    ]);
}
function $de17ee1c983f5fa9$export$df96cd8d56be0ab1(rpc, addresses) {
    const includeAssets = true;
    const promise = rpc("getaddressbalance", [
        {
            addresses: addresses
        },
        includeAssets
    ]);
    return promise;
}
function $de17ee1c983f5fa9$export$1021589f9720f1bb(list) {
    //Remember, sort mutates the underlaying array
    //Sort by satoshis, lowest first to prevent dust.
    return list.sort(function(a, b) {
        if (a.satoshis > b.satoshis) return 1;
        if (a.satoshis < b.satoshis) return -1;
        return 0;
    });
}
async function $de17ee1c983f5fa9$export$c6afdd36019bc4f0(rpc, addresses) {
    const list = await rpc("getaddressutxos", [
        {
            addresses: addresses
        }
    ]);
    $de17ee1c983f5fa9$export$1021589f9720f1bb(list);
    return list;
}
function $de17ee1c983f5fa9$export$61ff118ad91d2b8c(rpc, addresses, assetName) {
    const assets = rpc("getaddressutxos", [
        {
            addresses: addresses,
            assetName: assetName
        }
    ]);
    return assets;
}
function $de17ee1c983f5fa9$export$11b542b4427a1a57(rpc, addresses) {
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
async function $de17ee1c983f5fa9$export$6bbaa6939a98b630(rpc) {
    const ids = await rpc("getrawmempool", []);
    const result = [];
    for (const id of ids){
        const transaction = await $de17ee1c983f5fa9$export$b7bc66c041203976(rpc, id);
        result.push(transaction);
    }
    return result;
}
function $de17ee1c983f5fa9$export$6a4ffba0c6186ae7(UTXOs) {
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




const $9de421449659004c$export$ffff6aea08fd9487 = 1e8;





var $8a6a99603cc26764$require$Buffer = $93qLg$Buffer;
async function $8a6a99603cc26764$var$isValidAddress(rpc, address) {
    const obj = await $de17ee1c983f5fa9$export$f78173835dcde49f(rpc, address);
    return obj.isvalid === true;
}
function $8a6a99603cc26764$var$sumOfUTXOs(UTXOs) {
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
*/ async function $8a6a99603cc26764$var$getFee(rpc, inputs, outputs) {
    const ONE_KILOBYTE = 1024;
    //Create a raw transaction to get an aproximation for transaction size.
    const raw = await $de17ee1c983f5fa9$export$3c514ecc803e4adc(rpc, inputs, outputs);
    //Get the length of the string bytes not the string
    //This is NOT the exact size since we will add an output for the change address to the transaction
    //Perhaps we should calculate size plus 10%?
    const size = $8a6a99603cc26764$require$Buffer.from(raw).length / ONE_KILOBYTE;
    console.log("Size of raw transaction", size);
    let fee = 0.02;
    //TODO should ask the "blockchain" **estimatesmartfee**
    return fee * Math.max(1, size);
}
async function $8a6a99603cc26764$var$_send(options) {
    const { amount: amount , assetName: assetName , fromAddressObjects: fromAddressObjects , toAddress: toAddress , rpc: rpc  } = options;
    const sendResult = {
        transactionId: "undefined",
        debug: {}
    };
    const MAX_FEE = 4;
    const isAssetTransfer = assetName !== "RVN";
    //VALIDATION
    if (await $8a6a99603cc26764$var$isValidAddress(rpc, toAddress) === false) throw Error("Invalid address " + toAddress);
    if (amount < 0) throw Error("Cant send less than zero");
    const addresses = fromAddressObjects.map((a)=>a.address);
    //TODO change addresses should be checked with the blockchain,
    //find first unused change address
    const ravencoinChangeAddress = addresses[1];
    const assetChangeAddress = addresses[3];
    let UTXOs = await $de17ee1c983f5fa9$export$c6afdd36019bc4f0(rpc, addresses);
    //Remove UTXOs that are currently in mempool
    const mempool = await $de17ee1c983f5fa9$export$6bbaa6939a98b630(rpc);
    UTXOs = UTXOs.filter((UTXO)=>$8a6a99603cc26764$export$9ffd76c05265a057(mempool, UTXO) === false);
    const enoughRavencoinUTXOs = $8a6a99603cc26764$export$aef5e6c96bd29914(UTXOs, isAssetTransfer ? 1 : amount + MAX_FEE);
    //Sum up the whole unspent amount
    let unspentRavencoinAmount = $8a6a99603cc26764$var$sumOfUTXOs(enoughRavencoinUTXOs);
    if (unspentRavencoinAmount <= 0) throw Error("Not enough RVN to transfer asset, perhaps your wallet has pending transactions");
    sendResult.debug.unspentRVNAmount = unspentRavencoinAmount.toLocaleString();
    if (isAssetTransfer === false) {
        if (amount > unspentRavencoinAmount) throw Error("Insufficient funds, cant send " + amount.toLocaleString() + " only have " + unspentRavencoinAmount.toLocaleString());
    }
    const rvnAmount = isAssetTransfer ? 0 : amount;
    const inputs = $de17ee1c983f5fa9$export$6a4ffba0c6186ae7(enoughRavencoinUTXOs);
    const outputs = {};
    //Add asset inputs
    if (isAssetTransfer === true) await $8a6a99603cc26764$var$addAssetInputsAndOutputs(rpc, addresses, assetName, amount, inputs, outputs, toAddress, assetChangeAddress);
    else if (isAssetTransfer === false) outputs[toAddress] = rvnAmount;
    const fee = await $8a6a99603cc26764$var$getFee(rpc, inputs, outputs);
    sendResult.debug.assetName = assetName;
    sendResult.debug.fee = fee;
    sendResult.debug.rvnAmount = 0;
    const ravencoinChangeAmount = unspentRavencoinAmount - rvnAmount - fee;
    sendResult.debug.rvnChangeAmount = ravencoinChangeAmount;
    //Obviously we only add change address if there is any change
    if ($8a6a99603cc26764$var$getTwoDecimalTrunc(ravencoinChangeAmount) > 0) outputs[ravencoinChangeAddress] = $8a6a99603cc26764$var$getTwoDecimalTrunc(ravencoinChangeAmount);
    //Now we have enough UTXos, lets create a raw transactions
    const raw = await $de17ee1c983f5fa9$export$3c514ecc803e4adc(rpc, inputs, outputs);
    sendResult.debug.rawUnsignedTransaction = raw;
    const privateKeys = {};
    inputs.map(function(input) {
        const addy = input.address;
        const addressObject = fromAddressObjects.find((a)=>a.address === addy);
        if (addressObject) privateKeys[addy] = addressObject.WIF;
    });
    sendResult.debug.privateKeys = privateKeys;
    //Sign the transaction
    const keys = Object.values(privateKeys);
    const signedTransactionPromise = $de17ee1c983f5fa9$export$4e98a95db76a53e1(rpc, raw, keys);
    signedTransactionPromise.catch((e)=>{
        console.dir(e);
    });
    const signedTransaction = await signedTransactionPromise;
    sendResult.debug.signedTransaction = signedTransaction;
    const txid = await $de17ee1c983f5fa9$export$4e309754b4830e29(rpc, signedTransaction);
    sendResult.transactionId = txid;
    return sendResult;
}
async function $8a6a99603cc26764$var$addAssetInputsAndOutputs(rpc, addresses, assetName, amount, inputs, outputs, toAddress, assetChangeAddress) {
    let assetUTXOs = await $de17ee1c983f5fa9$export$61ff118ad91d2b8c(rpc, addresses, assetName);
    const mempool = await $de17ee1c983f5fa9$export$6bbaa6939a98b630(rpc);
    assetUTXOs = assetUTXOs.filter((UTXO)=>$8a6a99603cc26764$export$9ffd76c05265a057(mempool, UTXO) === false);
    const _UTXOs = $8a6a99603cc26764$export$aef5e6c96bd29914(assetUTXOs, amount);
    const tempInputs = $de17ee1c983f5fa9$export$6a4ffba0c6186ae7(_UTXOs);
    tempInputs.map((item)=>inputs.push(item));
    outputs[toAddress] = {
        transfer: {
            [assetName]: amount
        }
    };
    const assetSum = $8a6a99603cc26764$var$sumOfUTXOs(_UTXOs);
    //Only add change address if needed
    if (assetSum - amount > 0) outputs[assetChangeAddress] = {
        transfer: {
            [assetName]: assetSum - amount
        }
    };
}
function $8a6a99603cc26764$var$getTwoDecimalTrunc(num) {
    //Found answer here https://stackoverflow.com/questions/11832914/how-to-round-to-at-most-2-decimal-places-if-necessary
    //In JavaScript the number 77866.98 minus 111 minus 0.2 equals 77755.95999999999
    //We want it to be 77755.96
    return Math.trunc(num * 100) / 100;
}
async function $8a6a99603cc26764$export$89db4734f6c919c4(rpc, fromAddressObjects, toAddress, amount, assetName) {
    return $8a6a99603cc26764$var$_send({
        rpc: rpc,
        fromAddressObjects: fromAddressObjects,
        toAddress: toAddress,
        amount: amount,
        assetName: assetName
    });
}
function $8a6a99603cc26764$export$aef5e6c96bd29914(utxos, amount) {
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
            const value = utxo.satoshis / (0, $9de421449659004c$export$ffff6aea08fd9487);
            tempAmount = tempAmount + value;
            returnValue.push(utxo);
        }
    });
    //Did we use a MASSIVE amount of UTXOs to safisfy this transaction?
    //In this case check if we do have one single UTXO that can satisfy our needs
    if (returnValue.length > 10) {
        const largerUTXO = utxos.find((utxo)=>utxo.satoshis / (0, $9de421449659004c$export$ffff6aea08fd9487) > amount);
        if (largerUTXO) //Send this one UTXO that covers it all
        return [
            largerUTXO
        ];
    }
    return returnValue;
}
function $8a6a99603cc26764$export$9ffd76c05265a057(mempool, UTXO) {
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




const $c3676b79c37149df$var$URL_MAINNET = "https://rvn-rpc-mainnet.ting.finance/rpc";
const $c3676b79c37149df$var$URL_TESTNET = "https://rvn-rpc-testnet.ting.finance/rpc";
//Avoid singleton (anti-pattern)
//Meaning multiple instances of the wallet must be able to co-exist
class $c3676b79c37149df$var$Wallet {
    rpc = (0, $93qLg$getRPC)("anonymous", "anonymous", $c3676b79c37149df$var$URL_MAINNET);
    _mnemonic = "";
    addressObjects = [];
    receiveAddress = "";
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
        let username = "anonymous";
        let password = "anonymous";
        let url = $c3676b79c37149df$var$URL_MAINNET;
        //VALIDATION
        if (!options) throw Error("option argument is mandatory");
        if (!options.mnemonic) throw Error("option.mnemonic is mandatory");
        url = options.rpc_url || url;
        password = options.rpc_password || url;
        username = options.rpc_username || url;
        if (options.network === "rvn-test" && !options.rpc_url) url = $c3676b79c37149df$var$URL_TESTNET;
        this.rpc = (0, $93qLg$getRPC)(username, password, url);
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
        const asdf = await this.rpc((0, $93qLg$methods).getaddresstxids, [
            obj,
            includeAssets
        ]);
        return asdf.length > 0;
    }
    async _getFirstUnusedAddress(external) {
        //First, check if lastReveivedAddress
        if (external === true && this.receiveAddress) {
            const asdf = await this.hasHistory([
                this.receiveAddress
            ]);
            if (asdf === false) {
                console.log("Receive address no need to change");
                return this.receiveAddress;
            }
        }
        const addresses = this.getAddresses();
        //even addresses are external, odd address are internal/changes
        for(let counter = 0; counter < addresses.length; counter++){
            if (external && counter % 2 !== 0) continue;
            const address = addresses[counter];
            //If an address has tenth of thousands of transactions, getHistory will throw an exception
            const asdf = await this.hasHistory([
                address
            ]);
            if (asdf === false) {
                if (external === true) this.receiveAddress = address;
                return address;
            }
        }
        //IF we have not found one, return the first address
        return addresses[0];
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
    async send(options) {
        const { amount: amount , assetName: assetName , toAddress: toAddress  } = options;
        //Validation
        if (!toAddress) throw Error("Wallet.send  toAddress is mandatory");
        if (!amount) throw Error("Wallet.send  amount is mandatory");
        if (assetName && assetName !== "RVN") return $8a6a99603cc26764$export$89db4734f6c919c4(this.rpc, this.addressObjects, toAddress, amount, assetName);
        else return this._sendRavencoin(toAddress, amount);
    }
    async _sendRavencoin(toAddress, amount) {
        if (amount < 0) throw Error("Amount cannot be negative");
        if (!toAddress) throw Error("toAddress seems invalid");
        const addresses = this.getAddresses();
        const sendResult = {
            transactionId: "",
            debug: {}
        };
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
        const balance = await this.rpc((0, $93qLg$methods).getaddressbalance, [
            {
                addresses: addresses
            }
        ]);
        if (balance.balance) {
            const b = balance.balance / (0, $9de421449659004c$export$ffff6aea08fd9487);
            if (b < amount) throw Error("Not enough money, " + b);
        }
        //GET UNSPENT TRANSACTION OUTPUTS
        let allUnspent = await this.getUTXOs();
        const mempool = await $de17ee1c983f5fa9$export$6bbaa6939a98b630(this.rpc);
        //Filter out UTXOs currently in mempool
        allUnspent = allUnspent.filter((UTXO)=>$8a6a99603cc26764$export$9ffd76c05265a057(mempool, UTXO) === false);
        //GET ENOUGH UTXOs FOR THIS TRANSACTION
        const unspent = $8a6a99603cc26764$export$aef5e6c96bd29914(allUnspent, amount + 1 /*to cover the fee*/ );
        if (unspent.length === 0) throw Error("No unspent transactions outputs");
        console.log("Will use", unspent.length, "UTXO to send", amount);
        let amo = 0;
        unspent.map((utxo)=>amo += utxo.satoshis / 1e8);
        console.log("Amount of UTXO", amo);
        const transaction = new $93qLg$Transaction();
        const utxoObjects = unspent.map((u)=>new $93qLg$Transaction.UnspentOutput(u));
        const changeAddress = await this._getFirstUnusedAddress(false);
        const privateKeys = utxoObjects.map((utxo)=>{
            const addy = utxo.address.toString();
            const key = this.getPrivateKeyByAddress(addy);
            const privateKey = new $93qLg$PrivateKey(key);
            return privateKey;
        });
        transaction.from(utxoObjects);
        transaction.to(toAddress, amount * (0, $9de421449659004c$export$ffff6aea08fd9487));
        transaction.change(changeAddress);
        //UPDATE FEE
        transaction.fee(transaction.getFee() * 100);
        sendResult.debug.fee = transaction.getFee() * 100;
        console.log("OK want to send", amount, "has got", amo, "and fee is", transaction.getFee() / 1e8);
        transaction.sign(privateKeys);
        const id = await this.rpc((0, $93qLg$methods).sendrawtransaction, [
            transaction.serialize()
        ]);
        sendResult.transactionId = id;
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
        const balance = await this.rpc((0, $93qLg$methods).getaddressbalance, params);
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
                addresses: this.getAddresses()
            },
            includeAssets
        ];
        const balance = await this.rpc((0, $93qLg$methods).getaddressbalance, params);
        return balance.balance / (0, $9de421449659004c$export$ffff6aea08fd9487);
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
