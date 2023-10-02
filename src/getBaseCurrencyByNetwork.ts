import { ChainType } from "./Types";


export function getBaseCurrencyByNetwork(network: ChainType): string {
  const map = {
    evr: "EVR",
    "evr-test": "EVR",
    rvn: "RVN",
    "rvn-test": "RVN",
  };
  return map[network];
}
