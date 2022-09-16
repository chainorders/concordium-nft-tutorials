import { ContractAddress } from "@concordium/web-sdk";

export type TokenIdU32 = number;
export type Address = string | ContractAddress;
export type ContractTokenId = string;
export type OperatorOfQueryResponse = boolean[];
export interface MetadataUrl {
	url: string;
	hash: string;
}

export interface SupportResult {
	type: "NoSupport" | "Support" | "SupportBy";
	supportBy?: ContractAddress[];
}
export interface SupportsQueryResponse {
	results: SupportResult[];
}

export type ParamAddress =
	| { Account: string[] }
	| { Contract: ContractAddress[] };
export interface OperatorOfQuery {
	owner: ParamAddress;
	address: ParamAddress;
}
export type OperatorUpdate = { Add: {} } | { Remove: {} };
export interface UpdateOperator {
	update: OperatorUpdate;
	operator: ParamAddress;
}
export type OperatorOfQueryParams = OperatorOfQuery[];
export type UpdateOperatorParams = UpdateOperator[];
export type TokenAmountU8 = number;
export type ContractTokenAmount = TokenAmountU8;
export interface IsTokenAmount {}
export type BalanceOfQueryResponse<T extends IsTokenAmount> = T[];
export type ContractBalanceOfQueryResponse =
	BalanceOfQueryResponse<ContractTokenAmount>;
export interface IsTokenId {}
export interface BalanceOfQuery<T extends IsTokenId> {
	token_id: T;
	address: ParamAddress;
}
export interface BalanceOfQueryParams<T extends IsTokenId> {
	queries: BalanceOfQuery<T>[];
}
export type ContractBalanceOfQueryParams =
	BalanceOfQueryParams<ContractTokenId>;

	export interface Metadata {
		name: string;
		description: string;
		display: Display;
		attributes: Attribute[];
	}
	
	export interface Display {
		url: string;
	}
	
	export interface Attribute {
		name: string;
		type: string;
		value: string;
	}