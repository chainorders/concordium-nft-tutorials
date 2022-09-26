import { ConcordiumDeserializer } from "./ConcordiumDeserializer";
import {
	ContractBalanceOfQueryResponse,
	ContractTokenAmount,
	OperatorOfQueryResponse,
	SupportResult,
	SupportsQueryResponse,
	MetadataUrl,
} from "./Cis2Types";

/**
 * Handles Deserialization of CIS2 types from underlying Buffer.
 */
export class Cis2Deserializer extends ConcordiumDeserializer {
	readTokenId(): string {
		let tokenByteSize = this.readUInt8();
		const tokenId = this.readBytes(tokenByteSize).toString("hex");

		return tokenId;
	}

	readTokenMetadata(): MetadataUrl {
		this.readBytes(2);
		let url = this.readString();
		let hash = this.readString();

		console.log("url", url);
		console.log("hash", hash);
		return { url, hash: "" };
	}

	readSupportsQueryResponse(): SupportsQueryResponse {
		const results = this.readVector(this.readSupportResult, 2);

		return {
			results,
		};
	}

	readSupportResult(): SupportResult {
		let type = this.readEnumType();

		switch (type) {
			case 0:
				return { type: "NoSupport" };
			case 1:
				return { type: "Support" };
			case 2:
				return {
					type: "SupportBy",
					supportBy: this.readVector(this.readContractAddress),
				};
			default:
				throw new Error("invalid support result type");
		}
	}

	readOperatorOfQueryResponse(): OperatorOfQueryResponse {
		return this.readVector(this.readBool, 2);
	}

	readBalanceOfQueryResponse(): ContractBalanceOfQueryResponse {
		return this.readVector(this.readTokenAmount, 2);
	}

	readTokenAmount(): ContractTokenAmount {
		return this.readUInt8();
	}
}
