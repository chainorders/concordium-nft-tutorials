export interface ClientCreateArgs {
  authToken?: string;
  ip?: string;
  port?: number;
  timeout?: number;
}

export interface SenderAccountArgs {
  signKey: string;
  sender: string;
}

export interface DeployModuleArgs extends ClientCreateArgs, SenderAccountArgs {
  wasm: string;
}

export interface InitContractArgs extends ClientCreateArgs, SenderAccountArgs {
  module: string;
  energy: bigint;
  contract: string;
}

export interface UpdateContractArgs extends ClientCreateArgs, SenderAccountArgs {
  params: string;
  schema: string;
  energy: number;
  contract: string;
  function: string;
  index: bigint;
  subIndex: bigint;
}

export interface ViewContractArgs extends ClientCreateArgs {
  schema: string;
  contract: string;
  function: string;
  index: bigint;
  subIndex: bigint;
  sender: string;
}
