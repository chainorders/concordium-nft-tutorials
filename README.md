* ## Download and [Install Docker Compose](https://docs.docker.com/compose/install/)
* ## Clone this repo
    - `git clone`
    - Initialize Submodules 
        ```
        git submodule update --init --recursive
        ```
* ## Download concordium testnet wallet
    - [For IOS, IPhone](https://developer.concordium.software/en/mainnet/net/installation/downloads-testnet.html#ios)
    - [For Android](https://developer.concordium.software/en/mainnet/net/installation/downloads-testnet.html#android) 
* ## [Create Testnet Account](https://developer.concordium.software/en/mainnet/net/guides/create-account.html)
* ## [Export wallet](https://developer.concordium.software/en/mainnet/net/guides/export-import.html#export-import) 
    - copy the file in root named [concordium-backup.concordiumwallet](./concordium-backup.concordiumwallet). This way it will be copied to the Docker Container in the [dev-env](./dev-env.Dockerfile)
* ## Build cargo-concordium
    ```
    docker-compose up cargo-concordium-build
    ```
    After completing this step you should see [cargo-concordium](./dist/cargo-concordium/cargo-concordium) file
* ## Build concordium-client
    ```
    docker-compose up concordium-client-build
    ```
    After completing this step you should see [concordium-client](./dist/concordium-client/concordium-client) file
* ## Get into smart contract development env
    - Start Testnet Concordium node & Wait for it to catchup. You can compare the block height from the logs wih [the block height from CCD Scan](https://testnet.ccdscan.io/blocks)
        ```
        docker-compose up node
        ```
        **After this step you should see the [node files](./dist/node/)**
    - Start Development Container 
        ```
        docker-compose up dev-env
        ```
    - [Attach to running container](https://code.visualstudio.com/docs/remote/attach-container#_attach-to-a-docker-container)
* ## Setup development env
    - Initialize concordium-client config
        ```bash
        concordium-client config init
        ```
        **After this step you should see the [concordium clients files](./dist/concordium-client-config/)**
    - Import Wallet
        ```bash
        concordium-client config account import /concordium-backup.concordiumwallet
        ```
        **After this step you should see the accounts imported to [accounts directory](./dist/concordium-client-config/accounts/)**

        Now lets set the imported account name to an ENV variable so that its easier to use in subsequent steps
        ```
        export SENDER=<ACCOUNT-NAME>
        ```
* ## Build Smart Contract
    ```bash
    cd /src/examples/cis2-nft

    cargo concordium build --schema-embed --schema-out /out/schema.bin --out /out/module.wasm
    ```
* ## Deploy Module (Smart Contract)
    ```bash
    concordium-client module deploy /out/module.wasm --sender $SENDER --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT
    ```

    Sample Output
    ```bash
    root@abf8d1a35412:/src/examples/cis2-nft# concordium-client module deploy /out/module.wasm --sender $SENDER --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT
    Using default energy amount of 85113 NRG.
    Deploy the module '/out/module.wasm'.
    Allowing up to 85113 NRG to be spent as transaction fee.
    Confirm [yN]: y
    y
    Deploying module...
    Enter password for credential with index 0 and signing key with index 0: 
    Transaction '10b7d2d806c581680547a441d76e476de61a2f1276e0951e8835c36f04ccdc28' sent to the baker.
    Waiting for the transaction to be committed and finalized.
    You may skip this step by interrupting the command using Ctrl-C (pass flag '--no-wait' to do this by default).
    The transaction will still get processed and may be queried using
    'concordium-client transaction status 10b7d2d806c581680547a441d76e476de61a2f1276e0951e8835c36f04ccdc28'.
    [22:04:50] Waiting for the transaction to be committed......
    Transaction is committed into block f99188206161e2fe37a43f89acdfb22864ef63266616d27f4e083b0a97d3ba6a with status "success" and cost 109.098562 CCD (85112 NRG).
    [22:04:57] Waiting for the transaction to be finalized....
    Transaction is finalized into block f99188206161e2fe37a43f89acdfb22864ef63266616d27f4e083b0a97d3ba6a with status "success" and cost 109.098562 CCD (85112 NRG).
    [22:05:03] Transaction finalized.
    Module successfully deployed with reference: '8279c704546524d70f2bcd26965b2cd27c851ea30a8fd81e283e139b2e482f18'.
    ```
    **The last line contains module reference. We will be using this in subsequent steps.**
    - Name the module
    ```bash
    concordium-client module name <MODULE-REFERENCE> --name nftmodule
    ```
    Sample Output
    ```bash
    root@abf8d1a35412:/src/examples/cis2-nft# concordium-client module name 8279c704546524d70f2bcd26965b2cd27c851ea30a8fd81e283e139b2e482f18 --name nftmodule
    Module reference 8279c704546524d70f2bcd26965b2cd27c851ea30a8fd81e283e139b2e482f18 was successfully named 'nftmodule'.
    ```
* ## Initialize Smart Contract
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init nftmodule --contract CIS2-NFT --sender $SENDER --energy 3000
    ```
    Sample Output
    ```bash
    root@abf8d1a35412:/src/examples/cis2-nft# concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init nftmodule --contract CIS2-NFT --sender new --energy 3000
    Initialize contract 'CIS2-NFT' from module '8279c704546524d70f2bcd26965b2cd27c851ea30a8fd81e283e139b2e482f18' with no parameters. Sending 0.000000 CCD.
    Allowing up to 3000 NRG to be spent as transaction fee.
    Transaction expires on Sun, 24 Jul 2022 22:29:28 UTC.
    Confirm [yN]: y
    y
    Enter password for credential with index 0 and signing key with index 0: 
    Transaction 'c8e1bca14b41e2c7eb225477a1ca06ec1bf0e739824720b2ee69d30d90adf586' sent to the baker.
    Waiting for the transaction to be committed and finalized.
    You may skip this step by interrupting the command using Ctrl-C (pass flag '--no-wait' to do this by default).
    The transaction will still get processed and may be queried using
    'concordium-client transaction status c8e1bca14b41e2c7eb225477a1ca06ec1bf0e739824720b2ee69d30d90adf586'.
    [22:19:34] Waiting for the transaction to be committed...............
    Transaction is committed into block ab8a5dcb25ce1ff559e5fd264487846fafd3dcbd68ffffd7b54386360fcf7657 with status "success" and cost 3.087913 CCD (2409 NRG).
    [22:20:01] Waiting for the transaction to be finalized....
    Transaction is finalized into block ab8a5dcb25ce1ff559e5fd264487846fafd3dcbd68ffffd7b54386360fcf7657 with status "success" and cost 3.087913 CCD (2409 NRG).
    [22:20:07] Transaction finalized.
    Contract successfully initialized with address: {"index":756,"subindex":0}
    ```

    Now lets name this contract instance so thats its easier to use in subsequent steps.
    ```
    concordium-client contract name <INDEX> --name nft
    ```
    
    Sample Output
    ```
    concordium-client contract name 756 --name nft
    Contract address {"index":756,"subindex":0} was successfully named 'nft'.
    ```
* ## Prepare NFT
    [CIS2 NFT Smart Contract](./concordium-rust-smart-contracts/examples/cis2-nft/src/lib.rs) available currently as an example does not allow any customizations to the NFT and has a hardcoded Metadata URL. 
* ## Mint NFT
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update nft --entrypoint mint --parameter-json /nft-artifacts/mint-params.json --schema /out/schema.bin --sender $SENDER --energy 6000
    ```

    Sample Output
    ```bash
    root@f715fb3c011e:/src/examples/cis2-nft# concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update nft --entrypoint mint --parameter-json /nft-artifacts/mint-params.json --schema /out/schema.bin --sender $SENDER --energy 6000
    Update contract 'CIS2-NFT' using the function 'mint' with JSON parameters from '/nft-artifacts/mint-params.json'. Sending 0.000000 CCD.
    Allowing up to 6000 NRG to be spent as transaction fee.
    Transaction expires on Mon, 25 Jul 2022 02:05:34 UTC.
    Confirm [yN]: y
    y
    Enter password for credential with index 0 and signing key with index 0: 
    Transaction '10b9dd87735f88537bbff0a32084024dd8323f5239d316670df4aab8d6428547' sent to the baker.
    ```
* ## View Contract State
    ```
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke  nft --entrypoint view
    ```

    Sample Output
    ```
    root@f715fb3c011e:/src/examples/cis2-nft# concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke  nft --entrypoint view
    Invocation resulted in success:
    - Energy used: 1949 NRG 
    - Return value:
        {
            "all_tokens": [
                "00000001",
                "00000002",
                "00000003"
            ],
            "state": [
                [
                    {
                        "Account": [
                            "48x2Uo8xCMMxwGuSQnwbqjzKtVqK5MaUud4vG7QEUgDmYkV85e"
                        ]
                    },
                    {
                        "operators": [],
                        "owned_tokens": [
                            "00000001",
                            "00000002",
                            "00000003"
                        ]
                    }
                ]
            ]
        }
    ```
* ## Transfer NFT
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update nft --entrypoint transfer --parameter-json /nft-artifacts/transfer-params.json --schema /out/schema.bin --sender $SENDER --energy 6000
    ```

    Sample Output
    ```bash
    root@f715fb3c011e:/src/examples/cis2-nft# concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update nft --entrypoint transfer --parameter-json /nft-artifacts/transfer-params.json --schema /out/schema.bin --sender $SENDER --energy 6000
    Update contract 'CIS2-NFT' using the function 'transfer' with JSON parameters from '/nft-artifacts/transfer-params.json'. Sending 0.000000 CCD.
    Allowing up to 6000 NRG to be spent as transaction fee.
    Transaction expires on Mon, 25 Jul 2022 02:23:26 UTC.
    Confirm [yN]: y
    y
    Enter password for credential with index 0 and signing key with index 0: 
    Transaction '12fc9597922379aff93049de491eb9463776b21b80f53f6219962b08a13b940c' sent to the baker.
    Waiting for the transaction to be committed and finalized.
    You may skip this step by interrupting the command using Ctrl-C (pass flag '--no-wait' to do this by default).
    The transaction will still get processed and may be queried using
    'concordium-client transaction status 12fc9597922379aff93049de491eb9463776b21b80f53f6219962b08a13b940c'.
    [02:13:31] Waiting for the transaction to be committed.....
    Transaction is committed into block eafa6ad0e0601aa848a181bf768b8d4c421fa37f95b2e1efded9eac7b5dab207 with status "success" and cost 3.797785 CCD (2949 NRG).
    [02:13:35] Waiting for the transaction to be finalized....
    Transaction is finalized into block eafa6ad0e0601aa848a181bf768b8d4c421fa37f95b2e1efded9eac7b5dab207 with status "success" and cost 3.797785 CCD (2949 NRG).
    [02:13:41] Transaction finalized.
    Successfully updated contract instance {"index":756,"subindex":0} ('nft') using the function 'transfer'.
    ```
* ## Check updated State
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke  nft --entrypoint view
    ```

    And you should see something like this
    ```
    root@f715fb3c011e:/src/examples/cis2-nft# concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke  nft --entrypoint view
    Invocation resulted in success:
    - Energy used: 1995 NRG 
    - Return value:
        {
            "all_tokens": [
                "00000001",
                "00000002",
                "00000003"
            ],
            "state": [
                [
                    {
                        "Account": [
                            "47da8rxVf4vFuF21hFypBJ3eGibxGSuricuAHnUpVbZjLeB4ML"
                        ]
                    },
                    {
                        "operators": [],
                        "owned_tokens": [
                            "00000001"
                        ]
                    }
                ],
                [
                    {
                        "Account": [
                            "48x2Uo8xCMMxwGuSQnwbqjzKtVqK5MaUud4vG7QEUgDmYkV85e"
                        ]
                    },
                    {
                        "operators": [],
                        "owned_tokens": [
                            "00000002",
                            "00000003"
                        ]
                    }
                ]
            ]
        }
    ```