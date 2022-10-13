import { Buffer } from "buffer/";
import { Cis2Deserializer } from "./cis2Deserializer";
import { ViewState, ViewAddressState, Tuple, ContractTokenAmount } from "./cis2MultiTypes";
import { Address, ContractTokenId } from "./cis2Types";

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
    //todo: correct uleb128 decode.
    let num = this.readUInt8();
    return BigInt(num);
  }
}
