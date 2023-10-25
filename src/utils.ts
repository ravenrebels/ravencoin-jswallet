import { IUTXO } from "./Types";

export function removeDuplicates(originalArray: IUTXO[]) {
  const uniqueArray: IUTXO[] = [];
  const seen = new Set();

  originalArray.forEach((item: IUTXO) => {
    const uniqueIdentifier = item.txid + item.outputIndex;

    if (!seen.has(uniqueIdentifier)) {
      seen.add(uniqueIdentifier);
      uniqueArray.push(item);
    }
  });

  return uniqueArray;
}
