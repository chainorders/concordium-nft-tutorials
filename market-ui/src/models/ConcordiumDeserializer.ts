import { AccountAddress, ContractAddress } from "@concordium/web-sdk";

import { Address } from "./Cis2Types";
import { GenericDeserializer } from "./GenericDeserializer";

export class ConcordiumDeserializer extends GenericDeserializer {
	readAddress(): Address {
		let addressType = this.readEnumType();

		let ret: Address;
		switch (addressType) {
			case 0:
				ret = this.readAccountAddress();
				break;
			case 1:
				ret = this.readContractAddress();
				break;
			default:
				throw Error("invalid address type:" + addressType);
		}

		return ret;
	}

	readContractAddress(): ContractAddress {
		let index = this.readUBigInt();
		let subindex = this.readUBigInt();

		return { index, subindex };
	}

	readAccountAddress(): string {
		let ret = this.readBytes(32);

		return AccountAddress.fromBytes(ret).address;
	}
}
