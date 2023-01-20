
const bitcore = require("bitcore-lib");
const coininfo = require("coininfo");

const { getRPC, methods } = require("@ravenrebels/ravencoin-rpc");
const RavencoinKey = require("@ravenrebels/ravencoin-key");
import { IAddressMetaData } from "./Types";
const { ONE_FULL_COIN } = require("./contants");

const URL_MAINNET = "https://rvn-rpc-mainnet.ting.finance/rpc";
const URL_TESTNET = "https://rvn-rpc-testnet.ting.finance/rpc"
//Default rpc 
let rpc = getRPC(
    "anonymous",
    "anonymous",
    "https://rvn-rpc-mainnet.ting.finance/rpc"
);
let _mnemonic = "";
const ACCOUNT = 0;


const addressObjects: Array<IAddressMetaData> = [];

let numberOfUnusedAddresses = 0;
function getAddresses(): Array<string> {
    const addresses = addressObjects.map(obj => {
        return obj.address
    });
    return addresses;
}

export interface IOptions {
    rpc_username?: string;
    rpc_password?: string;
    rpc_url?: string;
    mnemonic: string;
    network?: "rvn" | "rvn-test";
}

export  async function init(options: IOptions) {

    //VALIDATION
    if (!options) {
        throw Error("option argument is mandatory");
    }
    if (!options.mnemonic) {
        throw Error("option.mnemonic is mandatory");
    }
    if (options.rpc_username && options.rpc_password && options.rpc_url) {

        rpc = getRPC(options.rpc_username, options.rpc_password, options.rpc_url);
    }

    if (options.network === "rvn-test" && !options.rpc_url) {
        rpc = getRPC("anonymous", "anonymous", URL_TESTNET);
    }

    //DERIVE ADDRESSES BIP44, 20 unused (that is no history, not no balance)
    //TODO improve performance by creating blocks of 20 addresses and check history for all 20 at once
    //That is one history lookup intead of 20
    _mnemonic = options.mnemonic;
    let unusedAddresses = 0;
    let position = 0;
    while (unusedAddresses < 20) {

        const network = options.network || "rvn";
        const o = RavencoinKey.getAddressPair(network, _mnemonic, ACCOUNT, position);
        addressObjects.push(o.external);
        addressObjects.push(o.internal);

        if (await hasHistory([o.external.address]) === true) {
            unusedAddresses = 0;
        }
        else {
            unusedAddresses++;
        }
        position++;
    }
    console.log("Derived", position, "addresses");

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

 