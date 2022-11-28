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
concordium-client module deploy ./marketplace-contract/module.wasm --sender $ACCOUNT --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT
```

Or

```bash
concordium-client module deploy ./cis2-multi/module.wasm --sender $ACCOUNT --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT
```

You can [read more](https://developer.concordium.software/en/mainnet/net/references/concordium-client.html#concordium-client) about `concordium-client` and its cli params like `--grpc-ip` & `--grpc-port`

**The last line contains module reference. We will be using this in subsequent steps.**

Name the module

```bash
concordium-client module name <MODULE-REFERENCE> --name market ## or token
```

## Interact with Contract

- [CIS2 Multi](./cis2-multi.README.md)
- [Marketplace](./marketplace-contract.README.md)
