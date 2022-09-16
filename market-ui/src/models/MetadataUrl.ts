import { Buffer } from "buffer/";

export class MetadataUrl {
	url!: string;
	hash!: string;

	public static fromHex(hex: string): MetadataUrl {
        let b = Buffer.from(hex, 'hex');

        let readCounter = 0;
        b.readUInt16LE(readCounter);
        readCounter+=2;

        let urlByteSize = b.readUInt16LE(readCounter)
        readCounter+=2;

        const urlBytes = b.subarray(readCounter, readCounter + urlByteSize);
        let url = Buffer.from(urlBytes).toString('utf8');
        readCounter += urlByteSize;

        const isHashPresent = b.readUInt8(readCounter);
        readCounter+=1;

        let hash: string = "";
        if(isHashPresent === 1) {
            let hashBytes = b.subarray(readCounter);
            hash = Buffer.from(hashBytes).toString('hex')
        }

		return {
            url,
            hash
        } as MetadataUrl;
	}
}
