import { methods } from "@ravenrebels/ravencoin-rpc";
import { Wallet } from "./ravencoinWallet";
import { BalanceRoot } from "./Types";

export async function getAssets(wallet: Wallet, addresses: string[]) {
  const includeAssets = true;
  const params = [{ addresses: addresses }, includeAssets];
  const balance = (await wallet.rpc(methods.getaddressbalance, params)) as BalanceRoot[];

  // Filter out the base currency (e.g. RVN or EVR)
  // and add a 'value' property which is the balance in full units
  return balance
    .filter((obj: BalanceRoot) => obj.assetName !== wallet.baseCurrency)
    .map((obj: BalanceRoot) => {
      return {
        ...obj,
        value: obj.balance / 1e8,
      };
    });
}
