import { AccountAddress, ContractAddress } from "@concordium/web-sdk";
import { Buffer } from "buffer/";

import { Address } from "./Cis2Types";
export class ConcordiumDeserializer {
	private buffer: Buffer;
	private counter: number;

	constructor(buffer: Buffer) {
		this.buffer = buffer;
		this.counter = 0;
	}

	readVector<T>(itemDesrialFn: () => T, sizeLength: number = 4): T[] {
		let ret: T[] = [];
		let vectorLength: number;
		switch (sizeLength) {
			case 2:
				vectorLength = this.readUInt16();
				break;
			case 4:
				vectorLength = this.readUInt32();
				break;
			default:
				throw new Error(`Invalid vector size length: ${sizeLength}`);
		}

		for (let i = 0; i < vectorLength; i++) {
			const item = itemDesrialFn.apply(this);
			ret.push(item);
		}

		return ret;
	}

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

	readEnumType() {
		return this.readUInt8();
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

	readString(): string {
		let size = this.readUInt16();
		return this.readBytes(size).toString("utf8");
	}

	readUInt8() {
		let ret = this.buffer.readUInt8(this.counter);
		this.counter++;

		return ret;
	}

	readUInt16() {
		const ret = this.buffer.readUInt16LE(this.counter);
		this.counter += 2;

		return ret;
	}

	readUInt32(): number {
		const ret = this.buffer.readUInt32LE(this.counter);
		this.counter += 4;

		return ret;
	}

	readUBigInt(): bigint {
		return this.readBytes(8).readBigUInt64LE(0) as bigint;
	}

	readBool(): boolean {
		return this.readByte() === 1;
	}

	readByte() {
		return this.readBytes(1)[0];
	}

	readBytes(bytesLength: number) {
		let ret = this.buffer.subarray(this.counter, this.counter + bytesLength);
		this.counter += bytesLength;

		return Buffer.from(ret);
	}
}
