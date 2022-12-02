# Interaction with Concordium Smart Contracts

## Setup

- Start Docker Testnet Node
  ```
  docker-compose up node
  ```

- Initialize Concordium Client
  ```bash
  concordium-client config init
  ```
- Import Wallet
  ```bash
  concordium-client config account import concordium-backup.concordiumwallet
  ```
- Setup Env Variables (Optional)
  ```bash
  export ACCOUNT=<ACCOUNT-NAME> ## This your account name in the exported wallet file
  export GRPC_IP=127.0.0.1 ## this is the default value if you use docker compose node
  export GRPC_PORT=10001 ## this is the default value if you use docker compose node
  ```

## Deploy Contracts

```bash
concordium-client module deploy <WASM-FILE-PATH> --sender $ACCOUNT --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT 
```
here the `WASM-FILE-PATH` can be 
- [cis2-nft wasm](../cis2-nft/module.wasm)
- [cis2-multi wasm](../cis2-multi/module.wasm)
- [marketplace wasm](../marketplace-contract/module.wasm)

You can [read more](https://developer.concordium.software/en/mainnet/net/references/concordium-client.html#concordium-client) about `concordium-client` and its cli params like `--grpc-ip` & `--grpc-port`

**The last line contains module reference. We will be using this in subsequent steps.**

Name the module

```bash
concordium-client module name <MODULE-REFERENCE> --name <MODULE-NAME>
```
Here lets for the context of this repository name our contracts in the following format. The same format will be used for interaction with contracts 
- for CIS2-NFT : cis2nft
- for CIS2-Multi : cis2multi
- for Marketplace Contract : market

## Interact with Contract

- [CIS2 NFT](./cis2-nft.README.md)
- [CIS2 Multi](./cis2-multi.README.md)
- [Marketplace](./marketplace-contract.README.md)