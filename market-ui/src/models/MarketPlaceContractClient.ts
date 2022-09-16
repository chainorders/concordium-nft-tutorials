import { Buffer } from "buffer/";
import { WalletApi } from "@concordium/browser-wallet-api-helpers";
import {
	AccountTransactionType,
	ContractAddress,
	SchemaVersion,
	serializeUpdateContractParameters,
	UpdateContractPayload,
} from "@concordium/web-sdk";

import {
	MARKET_CONTRACT_SCHEMA_BASE64,
	TRANSFER_ENERGY,
} from "../Constants";
import { TokenListItem } from "./TokenListItem";
import { toGtu, waitForTransaction } from "./Utils";

export class MarketplaceClient {
	static async transfer(marketContractAddress: ContractAddress, item: TokenListItem, provider: WalletApi) {
		let account = await provider.getMostRecentlySelectedAccount();

		if (!account) {
			return Promise.reject("Account not found");
		}

		const paramJson = {
			nft_contract_address: {
				index: item.contract.index.toString(),
				subindex: item.contract.subIndex.toString(),
			},
			token_id: item.tokenId,
			to: account,
		};

		const marketContractSchemaBuffer = Buffer.from(
			MARKET_CONTRACT_SCHEMA_BASE64,
			"base64"
		);

		const parameter = serializeUpdateContractParameters(
			"Market-NFT",
			"transfer",
			paramJson,
			marketContractSchemaBuffer,
			SchemaVersion.V2
		);

		let txnhash = await provider.sendTransaction(
			account,
			AccountTransactionType.UpdateSmartContractInstance,
			{
				amount: toGtu(item.price),
				contractAddress: marketContractAddress,
				maxContractExecutionEnergy: TRANSFER_ENERGY,
				receiveName: "Market-NFT.transfer",
				parameter,
			} as UpdateContractPayload,
			paramJson,
			MARKET_CONTRACT_SCHEMA_BASE64,
			2
		);

		return waitForTransaction(provider, txnhash);
	}
}
