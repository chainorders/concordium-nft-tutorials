import { ConcordiumDeserializer } from "./concordiumDeserializer";
import { TokenMetadata } from "./cis2Types";

export class Cis2Deserializer extends ConcordiumDeserializer {
  readTokenId(): string {
    let tokenByteSize = this.readUInt8();
    const tokenId = this.readBytes(tokenByteSize).toString("hex");

    return tokenId;
  }

  readTokenMetadata(): TokenMetadata {
    let url = this.readString(1);
    let hash = this.readString(1);

    return { url, hash };
  }
}
