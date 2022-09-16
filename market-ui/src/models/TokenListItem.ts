import * as buffer from "buffer/";

export interface ContractAddress {
	index: bigint;
	subIndex: bigint;
}

export class TokenListItem {
	/**
	 * Hex of token Id
	 */
	tokenId!: string;
	contract!: ContractAddress;
	price!: number;

	public toString() {
		return `${this.tokenId}${this.contract.index}${this.contract.subIndex}`
	}

	public static readArrayfromHex(hex: string): TokenListItem[] {
		console.log("hex", hex)
		let b = buffer.Buffer.from(hex, "hex");
		let readCounter = 0;

		let totalNfts = b.readUInt16LE(readCounter);
		readCounter += 2;

		let ret = new Array<TokenListItem>();

		for (let i = 0; i < totalNfts; i++) {
			let item = {} as TokenListItem;

			let tokenIdSize = b.readUInt8(readCounter);
			readCounter += 1;
			item.tokenId = buffer.Buffer.from(b.subarray(readCounter, readCounter + tokenIdSize)).toString("hex");
			readCounter += tokenIdSize;

			item.contract = {} as ContractAddress;

			item.contract.index = BigInt(b.readUIntLE(readCounter, 8));
			readCounter += 8;
			item.contract.subIndex = BigInt(b.readUIntLE(readCounter, 8));
			readCounter += 8;
			item.price = b.readUIntLE(readCounter, 8);
			readCounter += 8;
			ret.push(item);
		}

		return ret;
	}
}
