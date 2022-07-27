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
    After completing this step you should see [cargo-concordium](./dist/cargo-concordium/cargo-concordium) file. *This file will only be available after the building process is complete*

    You can [read more about `cargo-concordium`](https://developer.concordium.software/en/mainnet/smart-contracts/guides/setup-tools.html#cargo-concordium). 
    
    Currently we need to build it from the source because the latest released version does not contain support for CIS2 standard types. [Read the change log here](https://github.com/Concordium/concordium-wasm-smart-contracts/blob/main/cargo-concordium/CHANGELOG.md#unreleased-changes)
* ## Build concordium-client
    ```
    docker-compose up concordium-client-build
    ```
    After completing this step you should see [concordium-client](./dist/concordium-client/concordium-client) file. *This file will only be available after the building process is complete*

    You can [read more about `concordium-client`](https://developer.concordium.software/en/mainnet/net/references/concordium-client.html#concordium-client)
    
     Currently we need to build it from the source because the latest released version does not contain support for CIS2 standard types. [Read the change log here](https://github.com/Concordium/concordium-client/blob/main/ChangeLog.md#unreleased)
* ## Get into smart contract development env
    - Start Testnet Concordium node & Wait for it to catchup. You can compare the block height from the logs wih [the block height from CCD Scan](https://testnet.ccdscan.io/blocks)
        ```
        docker-compose up node
        ```
        **After this step you should see the [node files](./dist/node/)**. *This file will only be available after node is run atleast once.*
    - Start Development Container 
        ```
        docker-compose up dev-env
        ```
    - Use vscode to [Attach to running container](https://code.visualstudio.com/docs/remote/attach-container#_attach-to-a-docker-container)
* ## Setup development env
    - Initialize concordium-client config
        ```bash
        concordium-client config init
        ```
        **After this step you should see the [concordium clients files](./dist/concordium-client-config/)**. *This file will only be available after the above command is run once. Since this file is created by `concordium-client`*
    - Import Wallet
        ```bash
        concordium-client config account import /concordium-backup.concordiumwallet
        ```
        **After this step you should see the accounts imported to [accounts directory](./dist/concordium-client-config/accounts/)**

    - Now lets set the imported account name to an ENV variable so that its easier to use in subsequent steps
        ```
        export SENDER=<ACCOUNT-NAME>
        ```
* ## Build Smart Contract
    ### Command
    ```bash
    cd /src
    cargo concordium build --schema-embed --schema-out /out/schema.bin --out /out/module.wasm
    ```
    **After this step you should see built [wasm file](./dist/smart-contract/module.wasm) and [binary schema file](./dist/smart-contract/schema.bin)**

    ### Output
    ```bash
    root@92bb22f57b9b:/src# cargo concordium build --schema-embed --schema-out /out/schema.bin --out /out/module.wasm
    Compiling cis2-nft v0.1.0 (/src)
    Finished release [optimized] target(s) in 1.81s
    Compiling cis2-nft v0.1.0 (/src)
    Finished release [optimized] target(s) in 1.73s

    Module schema includes:

        Contract schema: 'CIS2-NFT' in total 989 B.
        receive
            - 'balanceOf'       : 81 B
            - 'mint'            : 85 B
            - 'operatorOf'      : 112 B
            - 'setImplementors' : 34 B
            - 'supports'        : 59 B
            - 'tokenMetadata'   : 63 B
            - 'transfer'        : 144 B
            - 'updateOperator'  : 95 B
            - 'view'            : 190 B

    Total size of the module schema is 1008 B
    Writing schema to /out/schema.bin.
    Embedding schema into module.

    Finished smart contract module 82.537 kB
    ```
* ## Deploy Module (Smart Contract)
    ### Command
    ```bash
    concordium-client module deploy /out/module.wasm --sender $SENDER --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT
    ```
    You can [read more](https://developer.concordium.software/en/mainnet/net/references/concordium-client.html#concordium-client) about `concordium-client` and its cli params like `--grpc-ip` & `--grpc-port`
    ### Output
    ```bash
    root@92bb22f57b9b:/src# concordium-client module deploy /out/module.wasm --sender $SENDER --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT
    Using default energy amount of 90951 NRG.
    Deploy the module '/out/module.wasm'.
    Allowing up to 90951 NRG to be spent as transaction fee.
    Confirm [yN]: y
    y
    Deploying module...
    Enter password for credential with index 0 and signing key with index 0: 
    Transaction '70a2d7a651fe64f4b47fd8a89fb2b5d2307157c184ac7566b2bb239ec48ae157' sent to the baker.
    Waiting for the transaction to be committed and finalized.
    You may skip this step by interrupting the command using Ctrl-C (pass flag '--no-wait' to do this by default).
    The transaction will still get processed and may be queried using
    'concordium-client transaction status 70a2d7a651fe64f4b47fd8a89fb2b5d2307157c184ac7566b2bb239ec48ae157'.
    [23:31:02] Waiting for the transaction to be committed..........
    Transaction is committed into block 740db62917e1afddad9d1b38835ff140e2e5d70e603ff84f56fe1c8777ba6cbd with status "success" and cost 116.083022 CCD (90950 NRG).
    [23:31:18] Waiting for the transaction to be finalized....
    Transaction is finalized into block 740db62917e1afddad9d1b38835ff140e2e5d70e603ff84f56fe1c8777ba6cbd with status "success" and cost 116.083022 CCD (90950 NRG).
    [23:31:24] Transaction finalized.
    Module successfully deployed with reference: 'e73703bf7eab7b39495145d43d85b7e03b35840c4d40c5b80c34504f446fbe67'.
    ```
    **The last line contains module reference. We will be using this in subsequent steps.**
    - Name the module
        ##### Command
        ```bash
        concordium-client module name <MODULE-REFERENCE> --name nftmodule
        ```
        ##### Output
        ```bash
        root@92bb22f57b9b:/src# concordium-client module name e73703bf7eab7b39495145d43d85b7e03b35840c4d40c5b80c34504f446fbe67 --name nftmodule
        Module reference e73703bf7eab7b39495145d43d85b7e03b35840c4d40c5b80c34504f446fbe67 was successfully named 'nftmodule'.
        ```
* ## Initialize Smart Contract
    ### Command
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init nftmodule --contract CIS2-NFT --sender $SENDER --energy 3000
    ```
    
    ### Output
    ```bash
    root@92bb22f57b9b:/src# concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init nftmodule --contract CIS2-NFT --sender $SENDER --energy 3000
    Initialize contract 'CIS2-NFT' from module 'e73703bf7eab7b39495145d43d85b7e03b35840c4d40c5b80c34504f446fbe67' with no parameters. Sending 0.000000 CCD.
    Allowing up to 3000 NRG to be spent as transaction fee.
    Transaction expires on Tue, 26 Jul 2022 23:45:23 UTC.
    Confirm [yN]: y
    y
    Enter password for credential with index 0 and signing key with index 0: 
    Transaction '043cd4d70a71bcc2555f5b52de8627da88026ca12cc760b5540a9f4a2607be49' sent to the baker.
    Waiting for the transaction to be committed and finalized.
    You may skip this step by interrupting the command using Ctrl-C (pass flag '--no-wait' to do this by default).
    The transaction will still get processed and may be queried using
    'concordium-client transaction status 043cd4d70a71bcc2555f5b52de8627da88026ca12cc760b5540a9f4a2607be49'.
    [23:35:29] Waiting for the transaction to be committed........
    Transaction is finalized into block 809597224b1e76c4257650484909703a33f7274098a31e6f8c6fe0a53d377d53 with status "success" and cost 3.227623 CCD (2528 NRG).
    [23:35:40] Transaction finalized.
    Contract successfully initialized with address: {"index":770,"subindex":0}
    ```

    - Name the contract instance. So thats it's easier to work with
        ##### Command
        ```
        concordium-client contract name <INDEX> --name nft
        ```
        
        ##### Output
        ```
        root@92bb22f57b9b:/src# concordium-client contract name 770 --name nft
        Contract address {"index":770,"subindex":0} was successfully named 'nft'.
        ```
* ## Prepare NFT & NFT Metadata
    - ### IPFS
        - Start the IPFS Nodes
            ```bash
            docker-compose up ipfs
            ```
        - Open the Web UI [http://localhost:5001/webui](http://localhost:5001/webui). Read more about [Web UI](https://github.com/ipfs/ipfs-webui)
            
            If you face any errors related to the UI not being able to find the server. Check & Change the Cross Origin Headers in the [config file](./dist/ipfs/ipfs_data/config) and then restart the IPFS container. Which can be just done by pressing cntrl-c and running the Start command again.
            ```json
            {
                "API": {
                    "HTTPHeaders": {
                    "Access-Control-Allow-Origin": ["*"],
                    "Access-Control-Allow-Methods": ["PUT", "POST"]
                    }
                },
                ...
            }
        ```
    - ### Prepare NFT Image 
        - Click on files tab on the left side and upload any image [file to IPFS](https://docs.ipfs.io/basics/desktop-app/#add-local-files). For a sample you can use [this image](./nft-artifacts/nft.jpg). *This has been downloaded from <a href='https://www.freepik.com/vectors/nft-background'>Nft background vector created by starline - www.freepik.com</a>*
        - Notice that you can copy / share the file url from this [interface](https://github.com/ipfs/ipfs-webui/blob/main/docs/screenshots/ipfs-webui-files.png) on the [IPFS web UI](http://localhost:5001/webui)
        - The final uploaded url should look something like this [https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q?filename=nft.jpg](https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q?filename=nft.jpg)

    - ### Prepare NFT Metadata
        - According to CIS Standards the metadata should be a [json file in the particular format](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json). See an [example for NFT's](https://proposals.concordium.software/CIS/cis-2.html#example-token-metadata-non-fungible)
        - For this sample you can use the [metadata file](./nft-artifacts/nft-metadata.json)
        - Upload the metadata file to the IPFS node using the same steps that were taken to upload the NFT image and copy the Metadata Url. It should be something like this. [https://ipfs.io/ipfs/QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E?filename=nft-metadata.json](https://ipfs.io/ipfs/QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E?filename=nft-metadata.json)

* ## Mint NFT
    ### Command
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update nft --entrypoint mint --parameter-json /nft-artifacts/mint-params.json --schema /out/schema.bin --sender $SENDER --energy 6000
    ```

    ### Output
    ```bash
    root@92bb22f57b9b:/src#     concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update nft --entrypoint mint --parameter-json /nft-artifacts/mint-params.json --schema /out/schema.bin --sender $SENDER --energy 6000
    Update contract 'CIS2-NFT' using the function 'mint' with JSON parameters from '/nft-artifacts/mint-params.json'. Sending 0.000000 CCD.
    Allowing up to 6000 NRG to be spent as transaction fee.
    Transaction expires on Tue, 26 Jul 2022 23:47:42 UTC.
    Confirm [yN]: y
    y
    Enter password for credential with index 0 and signing key with index 0: 
    Transaction 'e6ccc2bade93514eeb10ef83a7da47858eeb06b724d5dd47fbdd18964dc7b7b0' sent to the baker.
    Waiting for the transaction to be committed and finalized.
    You may skip this step by interrupting the command using Ctrl-C (pass flag '--no-wait' to do this by default).
    The transaction will still get processed and may be queried using
    'concordium-client transaction status e6ccc2bade93514eeb10ef83a7da47858eeb06b724d5dd47fbdd18964dc7b7b0'.
    [23:37:47] Waiting for the transaction to be committed.........
    Transaction is finalized into block ae7a54416126f3e8faee40882ad13df68794bd62d7dd934efb11650137c3fa11 with status "success" and cost 4.190292 CCD (3282 NRG).
    [23:38:01] Transaction finalized.
    Successfully updated contract instance {"index":770,"subindex":0} ('nft') using the function 'mint'.
    ```
* ## View Contract State
    ### Command
    ```
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke  nft --entrypoint view
    ```

    ### Output
    ```
    root@92bb22f57b9b:/src# concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke  nft --entrypoint view
    Invocation resulted in success:
    - Energy used: 2096 NRG 
    - Return value:
        {
            "all_tokens": [
                "00000001"
            ],
            "metadata": [
                [
                    "00000001",
                    {
                        "url": "https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q?filename=nft.jpg"
                    }
                ]
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
                            "00000001"
                        ]
                    }
                ]
            ]
        }
    ```
* ## Transfer NFT
    ### Command
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update nft --entrypoint transfer --parameter-json /nft-artifacts/transfer-params.json --schema /out/schema.bin --sender $SENDER --energy 6000
    ```

    ### Output
    ```bash
    root@92bb22f57b9b:/src#     concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update nft --entrypoint transfer --parameter-json /nft-artifacts/transfer-params.json --schema /out/schema.bin --sender $SENDER --energy 6000
    Update contract 'CIS2-NFT' using the function 'transfer' with JSON parameters from '/nft-artifacts/transfer-params.json'. Sending 0.000000 CCD.
    Allowing up to 6000 NRG to be spent as transaction fee.
    Transaction expires on Tue, 26 Jul 2022 23:49:58 UTC.
    Confirm [yN]: y
    y
    Enter password for credential with index 0 and signing key with index 0: 
    Transaction '7ed27e089adb112e0fa31829a0675e93d3204bdd71a23c532f1c45573bcc0ccb' sent to the baker.
    Waiting for the transaction to be committed and finalized.
    You may skip this step by interrupting the command using Ctrl-C (pass flag '--no-wait' to do this by default).
    The transaction will still get processed and may be queried using
    'concordium-client transaction status 7ed27e089adb112e0fa31829a0675e93d3204bdd71a23c532f1c45573bcc0ccb'.
    [23:40:02] Waiting for the transaction to be committed....
    Transaction is finalized into block 820b860ed1d95973f6c3852f27989bbb49682c285992246fee6eb66338a860d1 with status "success" and cost 3.859614 CCD (3023 NRG).
    [23:40:05] Transaction finalized.
    Successfully updated contract instance {"index":770,"subindex":0} ('nft') using the function 'transfer'.
    ```
* ## Check updated State
    ### Command
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke  nft --entrypoint view
    ```

    ### Output
    ```
    root@92bb22f57b9b:/src# concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke  nft --entrypoint view
    Invocation resulted in success:
    - Energy used: 2139 NRG 
    - Return value:
        {
            "all_tokens": [
                "00000001"
            ],
            "metadata": [
                [
                    "00000001",
                    {
                        "url": "https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q?filename=nft.jpg"
                    }
                ]
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
                        "owned_tokens": []
                    }
                ]
            ]
        }
    ```