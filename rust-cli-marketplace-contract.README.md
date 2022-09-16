* ## [Download concordium-client](https://developer.concordium.software/en/mainnet/net/installation/downloads-testnet.html#concordium-client-v4-0-4)
* ## Initialize concordium-client config
    ```bash
    concordium-client config init
    ```
    - Import Wallet
        ```bash
        concordium-client config account import concordium-backup.concordiumwallet
        ```
    - Now lets set the imported account name to an ENV variable so that its easier to use in subsequent steps
        ```bash
        export SENDER=<ACCOUNT-NAME>
        ```
    - Lets set the Node Endpoints as Env Variables. The values assume that the Node service of [`docker-compose.yml`](./docker-compose.yml) is running. `Port` is configured using the [.env](./.env) file
        ```bash
        export GRPC_IP=127.0.0.1
        export GRPC_PORT=10001
        ```
* ## Deploy Module (Smart Contract)
    ### Command
    ```bash
    concordium-client module deploy ./dist/marketplace-contract/module.wasm --sender $ACCOUNT --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT
    ```
    You can [read more](https://developer.concordium.software/en/mainnet/net/references/concordium-client.html#concordium-client) about `concordium-client` and its cli params like `--grpc-ip` & `--grpc-port`
    
    **The last line contains module reference. We will be using this in subsequent steps.**
    - Name the module
        ##### Command
        ```bash
        concordium-client module name <MODULE-REFERENCE> --name marketmodule
        ```
* ## Initialize Smart Contract
    ### Command
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init marketmodule --contract Market-NFT --sender $ACCOUNT --energy 3000
    ```

    - Name the contract instance. So thats it's easier to work with
        ##### Command
        ```
        concordium-client contract name <INDEX> --name marketplace
        ```

* ## Update NFT Operator
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 983 --entrypoint updateOperator --parameter-json ./nft-artifacts/update-operator-nft.json --schema ./dist/smart-contract/schema.bin --sender $ACCOUNT --energy 6000
    ```

* ## Add NFT
    ### Command
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 984 --entrypoint add --parameter-json ./nft-artifacts/add-marketplace.json --schema ./dist/marketplace-contract/schema.bin --sender $ACCOUNT --energy 10000
    ```

* ## List NFT
    ### Command
    ```
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke 984 --entrypoint list --schema ./dist/marketplace-contract/schema.bin
    ```

* ## Transfer NFT
    ### Command
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 984 --entrypoint transfer --parameter-json ./nft-artifacts/transfer-marketplace.json --schema ./dist/marketplace-contract/schema.bin --sender $ACCOUNT --energy 6000
    ```
    
* ## [Check updated State](#list-nft)
