import { Buffer } from "buffer/";
import { ModuleReference } from "@concordium/web-sdk";
import {
	Cis2ContractInfo,
	ContractInfo,
} from "./models/ConcordiumContractClient";

export const MARKET_CONTRACT_ADDRESS = {
	index: BigInt(1871),
	subindex: BigInt(0),
};
const MARKET_CONTRACT_SCHEMA =
	"FFFF02010000000A0000004D61726B65742D4E465401001400010000000A000000636F6D6D697373696F6E03030000000300000061646400140005000000140000006E66745F636F6E74726163745F616464726573730C08000000746F6B656E5F69641D000500000070726963650A07000000726F79616C747903080000007175616E746974791B25000000040000006C69737401140101000000100114000700000008000000746F6B656E5F69641D0008000000636F6E74726163740C0500000070726963650A050000006F776E65720B07000000726F79616C7479030D0000007072696D6172795F6F776E65720B080000007175616E746974791B25000000080000007472616E7366657200140005000000140000006E66745F636F6E74726163745F616464726573730C08000000746F6B656E5F69641D0002000000746F0B050000006F776E65720B080000007175616E746974791B25000000";
export const MARKETPLACE_CONTRACT_INFO: ContractInfo = {
	contractName: "Market-NFT",
	schemaBuffer: Buffer.from(MARKET_CONTRACT_SCHEMA, "hex"),
};
const NFT_CONTRACT_MODULE_REF =
	"3ff8f9804fe1b17564c7e0bd7e506de246d3446408b3753fe619055b6bd8398f";
const NFT_CONTRACT_SCHEMA =
	"ffff020100000008000000434953322d4e465400090000000900000062616c616e63654f6602100114000200000008000000746f6b656e5f69641d0007000000616464726573731502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c10011b25000000040000006d696e7400140002000000050000006f776e65721502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c06000000746f6b656e7312001d001400020000000300000075726c1601040000006861736816010a0000006f70657261746f724f66021001140002000000050000006f776e65721502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c07000000616464726573731502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c1001010f000000736574496d706c656d656e746f72730014000200000002000000696416000c000000696d706c656d656e746f727310020c08000000737570706f727473021001160010011503000000090000004e6f537570706f72740207000000537570706f72740209000000537570706f72744279010100000010000c0d000000746f6b656e4d657461646174610210011d0010011400020000000300000075726c160104000000686173681502000000040000004e6f6e650204000000536f6d650101000000132000000002080000007472616e7366657200100114000500000008000000746f6b656e5f69641d0006000000616d6f756e741b250000000400000066726f6d1502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c02000000746f1502000000070000004163636f756e7401010000000b08000000436f6e747261637401020000000c160104000000646174611d010e0000007570646174654f70657261746f720010011400020000000600000075706461746515020000000600000052656d6f7665020300000041646402080000006f70657261746f721502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c04000000766965770114000300000005000000737461746510020f1502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c1400020000000c0000006f776e65645f746f6b656e7310021d00090000006f70657261746f727310021502000000070000004163636f756e7401010000000b08000000436f6e747261637401010000000c0a000000616c6c5f746f6b656e7310021d00080000006d6574616461746110020f1d001400020000000300000075726c160104000000686173681601";
export const CIS2_NFT_CONTRACT_INFO: Cis2ContractInfo = {
	contractName: "CIS2-NFT",
	moduleRef: new ModuleReference(NFT_CONTRACT_MODULE_REF),
	schemaBuffer: Buffer.from(NFT_CONTRACT_SCHEMA, "hex"),
	tokenIdByteSize: 4,
	tokenAmountByteSize: 1
};
const MULTI_CONTRACT_MODULE_REF =
	"312f99d6406868e647359ea816e450eac0ecc4281c2665a24936e6793535c9f6";
const MULTI_CONTRACT_SCHEMA =
	"FFFF02010000000A000000434953322D4D756C7469000A0000000900000062616C616E63654F6606100114000200000008000000746F6B656E5F69641D0007000000616464726573731502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C10011B2500000015040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015060000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F7202040000006D696E7404140002000000050000006F776E65721502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C06000000746F6B656E7312021D000F1400020000000300000075726C1601040000006861736816011B2500000015040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015060000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F72020F0000006F6E526563656976696E67434953320315040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015060000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F72020A0000006F70657261746F724F66061001140002000000050000006F776E65721502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C07000000616464726573731502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C10010115040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015060000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F72020F000000736574496D706C656D656E746F72730414000200000002000000696416000C000000696D706C656D656E746F727310020C15040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015060000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720208000000737570706F727473061001160010011503000000090000004E6F537570706F72740207000000537570706F72740209000000537570706F72744279010100000010000C15040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015060000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F72020D000000746F6B656E4D657461646174610610011D0010011400020000000300000075726C160104000000686173681502000000040000004E6F6E650204000000536F6D65010100000013200000000215040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015060000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F7202080000007472616E7366657204100114000500000008000000746F6B656E5F69641D0006000000616D6F756E741B250000000400000066726F6D1502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C02000000746F1502000000070000004163636F756E7401010000000B08000000436F6E747261637401020000000C160104000000646174611D0115040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015060000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F72020E0000007570646174654F70657261746F720410011400020000000600000075706461746515020000000600000052656D6F7665020300000041646402080000006F70657261746F721502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C15040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015060000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720204000000766965770114000200000005000000737461746510020F1502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C1400020000000800000062616C616E63657310020F1D001B25000000090000006F70657261746F727310021502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C06000000746F6B656E7310021D00";
export const CIS2_MULTI_CONTRACT_INFO: Cis2ContractInfo = {
	contractName: "CIS2-Multi",
	moduleRef: new ModuleReference(MULTI_CONTRACT_MODULE_REF),
	schemaBuffer: Buffer.from(MULTI_CONTRACT_SCHEMA, "hex"),
	tokenIdByteSize: 1,
	tokenAmountByteSize: 8
};
export const IPFS_GATEWAY_URL = "https://ipfs.io/ipfs";
export const tokenIdToNftImageFileName = (
	originalFileName: string,
	tokenId: string
) => {
	const ext = originalFileName.substring(originalFileName.lastIndexOf("."));

	return `nft_${tokenId}.${ext}`;
};
export const tokenIdToNftMetadataFileName = (tokenId: string) => {
	return `nft_${tokenId}_metadata.json`;
};
