import { Buffer } from "buffer/";
import { ModuleReference } from "@concordium/web-sdk";
import { Cis2ContractInfo } from "./models/ConcordiumContractClient";

const MULTI_CONTRACT_MODULE_REF =
	"da837320c001172aea3908b5ed88cc06cfeb2436974d60585b4c9cfc61e34c8a";
const MULTI_CONTRACT_SCHEMA =
	"FFFF03010000000A000000434953322D4D756C7469000A0000000900000062616C616E63654F6606100114000200000008000000746F6B656E5F69641D0007000000616464726573731502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C10011B2500000015040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015070000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720212000000546F6B656E416C72656164794D696E74656402040000006D696E7404140002000000050000006F776E65721502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C06000000746F6B656E7312021D000F1400020000000300000075726C1601040000006861736816011B2500000015040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015070000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720212000000546F6B656E416C72656164794D696E746564020F0000006F6E526563656976696E67434953320315040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015070000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720212000000546F6B656E416C72656164794D696E746564020A0000006F70657261746F724F66061001140002000000050000006F776E65721502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C07000000616464726573731502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C10010115040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015070000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720212000000546F6B656E416C72656164794D696E746564020F000000736574496D706C656D656E746F72730414000200000002000000696416000C000000696D706C656D656E746F727310020C15040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015070000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720212000000546F6B656E416C72656164794D696E7465640208000000737570706F727473061001160010011503000000090000004E6F537570706F72740207000000537570706F72740209000000537570706F72744279010100000010000C15040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015070000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720212000000546F6B656E416C72656164794D696E746564020D000000746F6B656E4D657461646174610610011D0010011400020000000300000075726C160104000000686173681502000000040000004E6F6E650204000000536F6D65010100000013200000000215040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015070000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720212000000546F6B656E416C72656164794D696E74656402080000007472616E7366657204100114000500000008000000746F6B656E5F69641D0006000000616D6F756E741B250000000400000066726F6D1502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C02000000746F1502000000070000004163636F756E7401010000000B08000000436F6E747261637401020000000C160104000000646174611D0115040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015070000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720212000000546F6B656E416C72656164794D696E746564020E0000007570646174654F70657261746F720410011400020000000600000075706461746515020000000600000052656D6F7665020300000041646402080000006F70657261746F721502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C15040000000E000000496E76616C6964546F6B656E49640211000000496E73756666696369656E7446756E6473020C000000556E617574686F72697A65640206000000437573746F6D010100000015070000000B0000005061727365506172616D7302070000004C6F6746756C6C020C0000004C6F674D616C666F726D65640213000000496E76616C6964436F6E74726163744E616D65020C000000436F6E74726163744F6E6C790213000000496E766F6B65436F6E74726163744572726F720212000000546F6B656E416C72656164794D696E7465640204000000766965770114000200000005000000737461746510020F1502000000070000004163636F756E7401010000000B08000000436F6E747261637401010000000C1400020000000800000062616C616E63657310020F1D";
export const CIS2_MULTI_CONTRACT_INFO: Cis2ContractInfo = {
	contractName: "CIS2-Multi",
	moduleRef: new ModuleReference(MULTI_CONTRACT_MODULE_REF),
	schemaBuffer: Buffer.from(MULTI_CONTRACT_SCHEMA, "hex"),
	tokenIdByteSize: 1,
};
export const IPFS_GATEWAY_URL = "https://ipfs.io/ipfs";

export const CREATE_NEW_MARKETPLACE = true;

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
