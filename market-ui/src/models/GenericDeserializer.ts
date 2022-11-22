import { Buffer } from "buffer/";
import { constants } from "crypto";

/**
 * Handles deserialization from the underlying buffer.
 */
export class GenericDeserializer {
	private buffer: Buffer;

	/**
	 * Counter of how many bytes have been read from the input buffer.
	 */
	private counter: number;

	constructor(buffer: Buffer) {
		this.buffer = buffer;
		this.counter = 0;
	}

	readVector<T>(itemDesrialFn: () => T, sizeLength: number = 4): T[] {
		let ret: T[] = [];
		const vectorLength = this.readNumberByByteSize(sizeLength);

		for (let i = 0; i < vectorLength; i++) {
			const item = itemDesrialFn.apply(this);
			ret.push(item);
		}

		return ret;
	}

	readEnumType(): number {
		return this.readUInt8();
	}

	readString(sizeLength = 2): string {
		const size = this.readNumberByByteSize(sizeLength);
		return this.readBytes(size).toString("utf8");
	}

	private readNumberByByteSize(sizeLength: number): number {
		switch (sizeLength) {
			case 1:
				return this.readUInt8();
			case 2:
				return this.readUInt16();
			case 4:
				return this.readUInt32();
			default:
				throw new Error(`Invalid vector size length: ${sizeLength}`);
		}
	}

	readUInt8(): number {
		let ret = this.buffer.readUInt8(this.counter);
		this.counter++;

		return ret;
	}

	readUInt16(): number {
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
		const ret = this.buffer.readBigUInt64LE(this.counter) as bigint;
		this.counter += 8;

		return ret;
	}

	readBool(): boolean {
		return this.readByte() === 1;
	}

	readByte(): number {
		return this.readBytes(1)[0];
	}

	readBytes(bytesLength: number): Buffer {
		let ret = this.buffer.subarray(this.counter, this.counter + bytesLength);
		this.counter += bytesLength;

		return Buffer.from(ret);
	}
}
