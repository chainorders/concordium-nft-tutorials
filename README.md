# Step by step NFT tutorial on [Concordium](http://concordium.io)
Concordium is a science-based proof-of-stake blockchain created for all, with in particular business applications in mind. [Read more about concordium](https://www.concordium.com/about)

The NFT to be minted is [present here](./nft-artifacts/nft.jpg).

[Read more](./nft-artifacts/README.md) about all the artifacts present in [nft-artifacts](./nft-artifacts/) directory

**Following are the steps needed to Mint & Transfer a sample NFT on Concordium**
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
* ## Prepare NFT & NFT Metadata
    - ### CIS2 NFT & Metadata Standards
        - CIS Standard for [Token Metadata](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json). Also have a look at [Sample for NFT metadata json](https://proposals.concordium.software/CIS/cis-2.html#example-token-metadata-non-fungible)
    - ### [IPFS](https://ipfs.io/)
        - #### Start the IPFS Nodes.
        
            Its a dockerized version of IPFS kobu node. It it same as any hosted IPFS service but the files will only be accesing till the service is running. To have a more permament solution see [Pinata](#using-pinata-cli)
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
        - #### IPFS UI
            - ##### Prepare NFT Image 
                - Click on files tab on the left side and upload any image [file to IPFS](https://docs.ipfs.io/basics/desktop-app/#add-local-files). For a sample you can use [this image](./nft-artifacts/nft.jpg). *This has been downloaded from <a href='https://www.freepik.com/vectors/nft-background'>Nft background vector created by starline - www.freepik.com</a>*
                - Notice that you can copy / share the file url from this [interface](https://github.com/ipfs/ipfs-webui/blob/main/docs/screenshots/ipfs-webui-files.png) on the [IPFS web UI](http://localhost:5001/webui)
                - The final uploaded url should look something like this [https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q?filename=nft.jpg](https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q?filename=nft.jpg)
            - ##### Prepare NFT Metadata
                - According to CIS Standards the metadata should be a [json file in the particular format](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json). See an [example for NFT's](https://proposals.concordium.software/CIS/cis-2.html#example-token-metadata-non-fungible)
                - For this sample you can use the [metadata file](./nft-artifacts/nft-metadata.json)
                - Upload the metadata file to the IPFS node using the same steps that were taken to upload the NFT image and copy the Metadata Url. It should be something like this. [https://ipfs.io/ipfs/QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E?filename=nft-metadata.json](https://ipfs.io/ipfs/QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E?filename=nft-metadata.json)
            - ##### [Using a pinning service](https://docs.ipfs.tech/how-to/work-with-pinning-services/#use-an-existing-pinning-service)
        - ### IPFS CLI
            - #### Make Sure the [IPFS docker node is running](#start-the-ipfs-nodes)
            - #### Get IPFS node IP address
                ##### Command
                ```bash
                ping ipfs
                ```
                ##### Output
                ```bash
                root@895ac0d773c8:/src# ping ipfs
                PING ipfs (192.168.32.4) 56(84) bytes of data.
                64 bytes from nft-tutorials_ipfs_1.nft-tutorials_default (192.168.32.4): icmp_seq=1 ttl=64 time=0.166 ms
                64 bytes from nft-tutorials_ipfs_1.nft-tutorials_default (192.168.32.4): icmp_seq=2 ttl=64 time=0.106 ms
                ^C
                ```
            - #### Add NFT image to IPFS
                ##### Command
                ```bash
                ipfs --api /ip4/<IPFS IP ADDRESS>/tcp/5001 add /nft-artifacts/nft.jpg
                ```

                ##### Output
                ```bash
                root@895ac0d773c8:/src# ipfs --api /ip4/192.168.32.4/tcp/5001 add /nft-artifacts/nft.jpg
                added QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q nft.jpg
                690.75 KiB / 690.75 KiB [===============================================================================================] 100.00%
                ```
            - Add NFT Metadata to IPFS
                ##### Command
                ```bash
                ipfs --api /ip4/<IPFS IP ADDRESS>/tcp/5001 add /nft-artifacts/nft-metadata.json 
                ```

                ##### Output
                ```bash
                root@895ac0d773c8:/src# ipfs --api /ip4/192.168.32.4/tcp/5001 add /nft-artifacts/nft-metadata.json 
                added QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E nft-metadata.json
                ```
            - Get URLS
                - To get an HTTP url for the files you can directly use the format `https://ipfs.io/ipfs/<CID>`.
                
                    [Read more about this](https://docs.ipfs.tech/concepts/ipfs-gateway/#ipfs-gateway). Basically `ipfs.io` is the gateway that we are using.

                    So the Urls would be : 
                
                    - NFT Image : https://ipfs.io/ipfs/QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q
                    - Metadata JSON : https://ipfs.io/ipfs/QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E
            - [Using Pinning Service](https://docs.ipfs.tech/how-to/work-with-pinning-services/)
                - First of all [Why should we pin?](https://docs.pinata.cloud/faq#so-why-should-i-pin-my-content-with-pinata)
                - [Create a Pinata Account & Get JWT token](https://docs.pinata.cloud/pinata-api/pinning-services-api#pinning-services-api)
                - lets save the pinata JWT in ENV variable
                    ```bash
                    export JWT=<YOUR_JWT_TOKEN>
                    ```
                - Add pinata service
                    ```bash
                    ipfs --api /ip4/192.168.32.4/tcp/5001 pin remote service add pinata https://api.pinata.cloud/psa $JWT
                    ```
                - Pin the files
                    ```
                    ipfs --api /ip4/192.168.32.4/tcp/5001 pin remote add --service=pinata --name=nft.jpg QmV5REE3HJRLTHdmqG18Wc5PBF3Nc9W5dQL4Rp7MxBsx8q

                    ipfs --api /ip4/192.168.32.4/tcp/5001 pin remote add --service=pinata --name=nft-metadata.json QmdiX58nByHsFdAfJKL42wj6hPSQHdSSjDhwaJx2Tv5X3E
                    ```
    - ### Using Pinata CLI
        - [Create a Pinata Account & Get JWT token](https://docs.pinata.cloud/pinata-api/pinning-services-api#pinning-services-api)
        - Lets save the pinata JWT in ENV variable
            ```bash
            export JWT=<YOUR_JWT_TOKEN>
            ```
        - Configure the cli
            ```bash
            pinata-cli -a $JWT
            ```
        - Upload files
            ```
            pinata-cli -u /nft-artifacts/nft.jpg
            pinata-cli -u /nft-artifacts/nft-metadata.json
            ```
    - ### [Pinata UI](https://docs.pinata.cloud/nfts#how-to-upload-your-asset-with-pinata)
        Go to the Pin Manager, click the upload button, choose a file, and upload your file. When the upload is complete, you'll see your file in the grid and can copy the IPFS CID (the string of characters that starts with "Qm"). You'll need this CID later, so keep it handy. You can also come back to the Pin Manage page and copy it again at any time.
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
    root@ce56444bf2ef:/src# cargo concordium build --schema-embed --schema-out /out/schema.bin --out /out/module.wasm
        Compiling cis2-nft v0.1.0 (/src)
            Finished release [optimized] target(s) in 1.94s
        Compiling cis2-nft v0.1.0 (/src)
            Finished release [optimized] target(s) in 1.85s

        Module schema includes:

            Contract schema: 'CIS2-NFT' in total 1009 B.
            receive
                - 'balanceOf'       : 81 B
                - 'mint'            : 95 B
                - 'operatorOf'      : 112 B
                - 'setImplementors' : 34 B
                - 'supports'        : 59 B
                - 'tokenMetadata'   : 63 B
                - 'transfer'        : 144 B
                - 'updateOperator'  : 95 B
                - 'view'            : 200 B

        Total size of the module schema is 1028 B
        Writing schema to /out/schema.bin.
        Embedding schema into module.

            Finished smart contract module 87.130 kB
    ```
* ## Interact with Smart Contract
    - [Using Rust CLI](./rust-cli.README.md)
    - [Using Node CLI](./node-cli/README.md)