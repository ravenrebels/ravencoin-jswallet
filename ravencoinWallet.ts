import * as bitcore from "bitcore-lib";
import * as coininfo from "coininfo";


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



function init(mnemonic) {
    _mnemonic = mnemonic
    for (let i = 0; i < 100; i++) {
        const o = RavencoinKey.getAddressPair("rvn", mnemonic, ACCOUNT, i);

        addressObjects.push(o.external);
        addressObjects.push(o.internal);
    }

    return {
        getBalance, getUTXOs, send
    }
}
function getUTXOs() {
    const addresses = addressObjects.map(obj => {
        return obj.address
    });
    return rpc(methods.getaddressutxos, [{ addresses: addresses }]);
}


function getPrivateKeyByAddress(address: string) {

    const f = addressObjects.find(a => a.address === address);

    if (!f) {
        return null;
    }
    return f.WIF;

}
async function send(toAddress: string, amount: number) {

    const addresses = addressObjects.map(obj => {
        return obj.address
    });

    const UTXOs = await getUTXOs();

    //Add Ravencoin as Network to BITCORE
    //@ts-ignore

    const d = coininfo.ravencoin.main.toBitcore();
    d.name = "ravencoin";
    d.alias = "RVN";
    bitcore.Networks.add(d);

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
    const utxoObjects = UTXOs.map(u => bitcore.Transaction.UnspentOutput(u))

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

    /*
    var privateKeys = [
     new bitcore.PrivateKey('91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgwmaKkrx'),
     new bitcore.PrivateKey('91avARGdfge8E4tZfYLoxeJ5sGBdNJQH4kvjJoQFacbgww7vXtT')
   ];
    */



    return await rpc(methods.sendrawtransaction, [transaction.serialize()])

}
async function getBalance() {
    const addresses = addressObjects.map(obj => {
        return obj.address
    });

    const params = [{ "addresses": addresses }];

    const balance = await rpc(methods.getaddressbalance, params);

    return balance.balance / ONE_FULL_COIN;
}

export default {
    init
}