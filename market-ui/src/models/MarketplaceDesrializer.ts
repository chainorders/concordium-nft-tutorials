import { Cis2Deserializer } from "./Cis2Deserializer";
import { TokenList, TokenListItem } from "./MarketplaceTypes";

export class MarketplaceDeserializer extends Cis2Deserializer {
	readTokenList(): TokenList {
		return this.readVector(this.readTokenListItem, 2);
	}

	readTokenListItem(): TokenListItem {
		let tokenId = this.readTokenId();
		let contract = this.readContractAddress();
		let price = this.readUBigInt();

		return { tokenId, contract, price };
	}
}
