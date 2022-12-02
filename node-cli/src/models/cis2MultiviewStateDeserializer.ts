import { Buffer } from "buffer/";
//@ts-ignore
import * as leb from "leb128";

import { Cis2Deserializer } from "./cis2Deserializer";
import { ViewState, ViewAddressState, Tuple, ContractTokenAmount } from "./cis2MultiTypes";
import { Address, ContractTokenId } from "./cis2Types";

const MAX_LEB_BYTE_VALUE = Math.pow(2, 7);

export class Cis2MultiViewStateDeserializer extends Cis2Deserializer {
  constructor(hex: string) {
    super(Buffer.from(hex, "hex"));
  }

  readViewState(): ViewState {
    let state = this.readVector(this.readStateTuple);
    let tokens = this.readVector(this.readTokenId2);

    return { state, tokens };
  }

  readTokenId2() {
    return this.readTokenId();
  }

  readStateTuple(): Tuple<Address, ViewAddressState> {
    let address = this.readAddress();
    let viewAddressState = this.readViewAddressState();
    return [address, viewAddressState];
  }

  readViewAddressState(): ViewAddressState {
    let balances: Tuple<ContractTokenId, ContractTokenAmount>[] = this.readVector(this.readBalanceTuple);
    let operators: Address[] = this.readVector(this.readAddress);

    return { operators, balances };
  }

  readBalanceTuple(): Tuple<ContractTokenId, ContractTokenAmount> {
    const tokenId = this.readTokenId();
    const amount = this.readTokenAmount();
    return [tokenId, amount];
  }

  readTokenAmount(): ContractTokenAmount {
    let buff = new Buffer(37);

    for (let index = 0; index <= 37; index++) {
      let byte = this.readUInt8();
      console.log(index, byte);
      buff[index] = byte;

      if (byte <= MAX_LEB_BYTE_VALUE) {
        break;
      }
    }

    return BigInt(leb.unsigned.decode(buff));
  }
}
