import { Buffer } from "buffer/";
import { Cis2Deserializer } from "./cis2Deserializer";

import { ViewState, Metadata, StateItem, ViewAddressState, ContractTokenId, Address } from "./cis2Types";

export class Cis2NftViewStateDeserializer extends Cis2Deserializer {
  constructor(hex: string) {
    super(Buffer.from(hex, "hex"));
  }

  readViewState(): ViewState {
    let state = this.readVector(this.readStateItem);
    let allTokens = this.readVector(this.readTokenId);
    let metadata = this.readVector(this.readMetadata);

    return { state, allTokens, metadata };
  }

  readMetadata(): Metadata {
    let tokenId = this.readTokenId();
    let tokenMetadata = this.readTokenMetadata();

    return { tokenId, tokenMetadata };
  }

  readStateItem(): StateItem {
    let address = this.readAddress();
    let viewAddressState = this.readViewAddressState();

    return { address, viewAddressState };
  }

  readViewAddressState(): ViewAddressState {
    let ownedTokens: ContractTokenId[] = this.readVector(this.readTokenId);
    let operators: Address[] = this.readVector(this.readAddress);

    return { operators, ownedTokens };
  }
}
