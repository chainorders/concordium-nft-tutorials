## Contents
- [nft-metadata.json](./nft-metadata.json)

    This is the CIS2 Compliant metadata. [Read more](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json) 
- [nft.jpeg](./nft.jpg)

    This is the NFT image. Which will represent the NFT on chain.
- [mint-params.json](./mint-params.json)

    Mint parameters for the Smart Contract. This contains
    - Owner Account
    - [Token Id](https://proposals.concordium.software/CIS/cis-2.html#tokenid)
    - [Metadata](https://proposals.concordium.software/CIS/cis-2.html#metadataurl)

    Minting process in the smart contract outputs 2 events for offchain use
    - [Mint Event](https://proposals.concordium.software/CIS/cis-2.html#mintevent)
    - [Token Metadata Event](https://proposals.concordium.software/CIS/cis-2.html#tokenmetadataevent)

- [transfer-params.json](./transfer-params.json)

    Transfer parameters for the smart contract. This contains
    - From Account
    - To Account
    - Token Id
    - Amount

    Transferring Process should emit
    - [Transfer Event](https://proposals.concordium.software/CIS/cis-2.html#transferevent)