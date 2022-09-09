import { ConcordiumDeserializer } from "./concordiumDeserializer";
import { TokenMetadata } from "./types";

export class Cis2Deserializer extends ConcordiumDeserializer {
  readTokenId(): string {
    let tokenByteSize = this.readUInt8();
    const tokenId = this.readBytes(tokenByteSize).toString("hex");

    return tokenId;
  }

  readTokenMetadata(): TokenMetadata {
    let url = this.readString();
    let hash = this.readString();

    return { url, hash };
  }
}
