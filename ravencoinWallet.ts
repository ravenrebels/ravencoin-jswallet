import * as bitcore from "bitcore-lib";
const coininfo = require("coininfo");
import { getRPC, methods } from "@ravenrebels/ravencoin-rpc";
import RavencoinKey from "@ravenrebels/ravencoin-key";
import { IAddressMetaData } from "./Types";
import { ONE_FULL_COIN } from "./contants";

const rpc = getRPC(
    "anonymous",
    "anonymous",
    "https://rvn-rpc-mainnet.ting.finance/rpc"
);
let _mnemonic = "switch enact token move brush universe cave trick dignity seek craft alone";
const ACCOUNT = 0;

//@ts-ignore 
const addressObjects: Array<IAddressMetaData> = [];


let numberOfUnusedAddresses = 0;

function getAddresses(): Array<string> {
    const addresses = addressObjects.map(obj => {
        return obj.address
    });
    return addresses;
}
function init(mnemonic) {
    _mnemonic = mnemonic
    for (let i = 0; i < 100; i++) {
        const o = RavencoinKey.getAddressPair("rvn", mnemonic, ACCOUNT, i);
        addressObjects.push(o.external);
        addressObjects.push(o.internal);
    }

    return {
        getAddresses, getBalance, getReceiveAddress, getUTXOs, send,
    }
}
async function hasHistory(addresses: Array<string>): Promise<boolean> {

    const includeAssets = true;
    const obj = {
        addresses,
    };
    const asdf = await rpc(methods.getaddresstxids, [obj, includeAssets]);
    return asdf.length > 0;
}

async function getReceiveAddress() {

    const addresses = getAddresses();

    //even addresses are external, odd address are internal/changes
    //Get the first external address we can find that lack history
    for (let counter = 0; counter < addresses.length; counter++) {
        if (counter % 2 !== 0) {
            continue;
        }
        const address = addresses[counter];

        //If an address has tenth of thousands of transactions, getHistory will throw an exception

        const asdf = await hasHistory([address]);

        if (asdf === false) {
            return address;
        }

    }

    //IF we have not found one, return the first address
    return addresses[0];
}

async function getChangeAddress() {
    const addresses = getAddresses();

    //even addresses are external, odd address are internal/changes
    //Get the first internal address we can find that lack history
    for (let counter = 0; counter < addresses.length; counter++) {
        if (counter % 1 !== 0) {
            continue;
        }
        const address = addresses[counter];

        //If an address has tenth of thousands of transactions, getHistory will throw an exception

        const asdf = await hasHistory([address]);

        if (asdf === false) {
            return address;
        }
    }

    //IF we have not found one, return the first address
    return addresses[1];
}
function getUTXOs() {
    return rpc(methods.getaddressutxos, [{ addresses: getAddresses() }]);
}


function getPrivateKeyByAddress(address: string) {

    const f = addressObjects.find(a => a.address === address);

    if (!f) {
        return undefined;
    }
    return f.WIF;

}
async function send(toAddress: string, amount: number) {

    if (amount < 0) {
        throw Error("Amount cannot be negative");
    }
    if (!toAddress) {
        throw Error("toAddress seems invalid");
    }
    const addresses = getAddresses();
    const UTXOs = await getUTXOs();

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

    const balance = await rpc(methods.getaddressbalance, [
        { addresses: addresses },
    ]);
    if (balance.balance) {
        const b = balance.balance / 1e8;

        if (b < amount) {
            throw Error("Not enough money, " + b);
        }

    }

    //GET UNSPENT TRANSACTION OUTPUTS
    const unspent = await rpc(methods.getaddressutxos, [
        { addresses: addresses },
    ]);

    if (unspent.length === 0) {

        throw Error("No unspent transactions outputs");
    }


    const transaction = new bitcore.Transaction();
    const utxoObjects = UTXOs.map(u => new bitcore.Transaction.UnspentOutput(u))

    const privateKeys = utxoObjects.map(utxo => {
        const addy = utxo.address.toString();
        const key = getPrivateKeyByAddress(addy);
        const privateKey = new bitcore.PrivateKey(key);
        return privateKey;
    });

    transaction.from(utxoObjects);
    transaction.fee(ONE_FULL_COIN * 0.02);
    transaction.to(toAddress, amount * ONE_FULL_COIN);
    transaction.change(addresses[1]); //TODO make dynamic
    transaction.sign(privateKeys);

    return await rpc(methods.sendrawtransaction, [transaction.serialize()])

}
async function getBalance() {

    const params = [{ "addresses": getAddresses() }];
    const balance = await rpc(methods.getaddressbalance, params);

    return balance.balance / ONE_FULL_COIN;
}

export default {
    init
}