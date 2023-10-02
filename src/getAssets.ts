import { methods } from "@ravenrebels/ravencoin-rpc";
import { Wallet } from "./ravencoinWallet";

export async function getAssets(wallet:Wallet, addresses: string[]) {
  const includeAssets = true;
  const params = [{ addresses: addresses }, includeAssets];
  const balance = (await wallet.rpc(methods.getaddressbalance, params)) as any;

  //Remove baseCurrency
  const result = balance.filter((obj) => {
    return obj.assetName !== this.baseCurrency;
  });
  return result;
}
