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
    - Copy the file in root named [concordium-backup.concordiumwallet](./concordium-backup.concordiumwallet).
* ## [Create & Upload NFT Image & Metadata to IPFS](./nft-metadata.README.md)
* ## [Build Smart Contract](./cis2-nft/README.md)
* ## Interact with Smart Contract
    - ### Start the testnet node.
        ```bash
        docker-compose up node
        ```
        *The testnetnode takes sometime to catch up so let it run for sometime.*
        
        The [docker compose configuration](./docker-compose.yml) is inspired from the [docker docs](https://developer.concordium.software/en/mainnet/net/guides/run-node.html#run-a-testnet-node) from Concordium. 

    - ### We cover the following ways to interact with the smart contract.
        - [Using Rust CLI](./rust-cli-cis2-nft.README.md). Using [`concordium-client`](https://developer.concordium.software/en/mainnet/smart-contracts/guides/on-chain-index.html) which is a pre built client offered by Concordium to interact with the node
        - [Using Node CLI](./node-cli/README.md). Using Node enviornment with provided code samples.