# Interaction with Concordium Smart Contracts

`market-ui` is a React based frontend DAPP. It interacts with the deployed on-chain marketplace-contract & cis2-multi contracts. To allow a user to

- Buy a Token
- Sell a Token
- Mint a Token
- Initialize a new instance of Marketplace Contract
- Initialize a new instance of CIS2-Multi Contract

## Setup

- Install [Concordium chrome extension wallet](https://github.com/Concordium/concordium-browser-wallet/tree/main/packages/browser-wallet).
- Create a new Concordium Account and get initial balance.
- [Install yarn](https://classic.yarnpkg.com/lang/en/docs/install/#debian-stable)
- Install Dependencies
  ```bash
  yarn install
  ```
- Set Configuration
  Various following [configuration params](./src/Constants.ts) are explained and initialized with default values. Which can be used with Concordium Testnet.
  - `MARKET_CONTRACT_ADDRESS` : Default value for deployed and initialized market place contract address.
  - `MARKET_CONTRACT_SCHEMA` : HEX string of `schema.bin` file got from compilation of rust code of marketplace-contract
  - `MARKETPLACE_CONTRACT_INFO.moduleRef` : Module reference of deployed module with marketplace-contract.
  - `MULTI_CONTRACT_MODULE_REF`: Module reference of deployed module with CIS2-Multi contract
  - `MULTI_CONTRACT_SCHEMA` : HEX string of `schema.bin` file got from compilation of rust code of cis2-multi
  - `IPFS_GATEWAY_URL`: gateway url for the IPFS gateway

## Deploy

Currently the browser wallet does not allow to deploy modules to Concordium chain. However node-cli and concordium client can be used to deploy contracts

## Interact

- Start the frontend
  ```bash
  yarn start
  ```
  This should start the server and you should be able to view the frontend at [http://localhost:3000](http://localhost:3000). If default port is used.
- The UI provides following pages
  - Buy : A list of all the tokens listed for sale on marketplace
  - Sell : UI to add an owned token to the marketplace to be sold
  - Mint : UI to interact with token contract and mint new tokens
  - Create Marketplace : UI to initialize a new instance of Marketplace contract and use its address instead of the default one.

## Code Structure

There are two high level parts to the code base

- React components that enable to user to use the rendered UI to interact with the clients to communicate with concordium chain.
- Intermediatory layer that enables interaction between UI and concordium chain. This mainly comprises of
  - Clients
  - Deserializer(s)

### React Components

- Pages

  - [Add Nft Page](./src/pages/AddNftPage.tsx)

    Its a workflow of the of the following ordered list.

    - [Cis2FindInstance](#cis2findinstance)
    - [Cis2OperatorOf](#cis2operatorof)
    - [Cis2UpdateOperator](#cis2updateoperator)
    - [Cis2BalanceOf](#cis2balanceof)
    - [MarketplaceAdd](#marketplaceadd)

  - [List Nft Page](./src/pages/ListNftPage.tsx)

    Uses [Marketplace List](#marketplacelist) Component. To Display a list of NFT's for the input Marketplace Contract.

  - [Mint Nft Page](./src/pages/MintNftPage.tsx)
    Its a workflow of the of the following ordered list.
    - [Cis2FindInstanceOrInit](#cis2findinstanceorinit)
    - [Cis2MetadataPrepare](#cis2metadataprepare)
    - [Cis2NftMint](#cis2nftmint)

- Components : CIS2 Contract

  - [CIS2BalanceOf](./src/components/Cis2BalanceOf.tsx)
    Uses [Cis2Client](#cis2client) to get the balance of a CIS2 Token for the input account and displays an error message if the balance <= 0

  - [CIS2FindInstance](./src/components/Cis2FindInstance.tsx)

    - Uses [ConcordiumContractClient](#concordiumcontractclient) to get info about a Concordium Smart Contract.
    - Uses [Cis2Client](#cis2client) to check if the instance supports CIS2 protocol.
    - Displays an error if the contract does not exist or does not support CIS2.

  - [Cis2FindInstanceOrInit](./src/components/Cis2FindInstanceOrInit.tsx)

    - Either Finds an Existing Instance using [Cis2FindInstance](#cis2findinstance)
    - Or Initializes the instance using [Cis2Init](#cis2init)

  - [Cis2Init](./src/components/Cis2Init.tsx)
    Uses [Cis2Client](#cis2client) and Initializes a new CIS2-NFT contract.

  - [Cis2MetadataDisplay](./src/components/Cis2MetadataDisplay.tsx)
    Simply displays Metadata of an NFT. The [structure of the metadata](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json) should match the one defined in the CIS2-NFT protocol.

  - [Cis2MetadataPrepare](./src/components/Cis2MetadataPrepare.tsx)
    Checks if the provided metadata url is correct. By trying to download the content.

  - [Cis2NftMint](./src/components/Cis2NftMint.tsx)
    Uses [Cis2Client](#cis2client) to mint a new token/NFT.

  - [Cis2OperatorOf](./src/components/Cis2OperatorOf.tsx)
    Uses [Cis2Client](#cis2client) to to check if the Marketplace Contract is an owner of input account in input CIS2-NFT contract.

  - [Cis2UpdateOperator](./src/components/Cis2UpdateOperator.tsx)
    Uses [Cis2Client](#cis2client) to update the account operator to Marketplace Contract in CIS-NFT contract.

  - [Nft](./src/components/Nft.tsx)
    - Takes an input [MetadataUrl](https://proposals.concordium.software/CIS/cis-2.html#metadataurl).
    - Fetches the [Metadata Json](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json)
    - Displays the NFT image or an alternative error message.

- Components : Marketplace

  - [Marketplace Add](./src/components/MarketplaceAdd.tsx)
    Uses [MarketplaceClient](#marketplaceclient) to adds an Token/NFT to the list of buyable NFTs.

  - [Marketplace List](./src/components/MarketplaceList.tsx)
    Uses [MarketplaceClient](#marketplaceclient) to gets a list of buyable NFTs

  - [Marketplace Transfer](./src/components/MarketplaceTransfer.tsx)
    Uses [MarketplaceClient](#marketplaceclient) to allow users to pay for an NFT and buy transfer it to their ownership.

### Chain Interaction

- Clients

  - [Cis2 Client](./src/models/Cis2Client.ts)
    Provides interface to interact with [CIS2-NFT onchain contract](https://proposals.concordium.software/CIS/cis-2.html).
    CIS2 client provides methods to call various functions exposed by cis2-multi contract and [cis2 standard](https://proposals.concordium.software/CIS/cis-2.html) in general.
      - `isOperator` : calls [`operatorOf`](https://proposals.concordium.software/CIS/cis-2.html#operatorof) and returns wether the input contract address can operate on the input token.
      - `ensureSupportsCis2`: calls [`supports`](https://proposals.concordium.software/CIS/cis-0.html#supports). and throws an error if the input contract does not support CIS2 standard.
      - `balanceOf`: calls [`balanceOf`](https://proposals.concordium.software/CIS/cis-2.html#balanceof) function to fetch the balance of token for input address.
      - `getTokenMetadata`: calls [`tokenMetadata`](https://proposals.concordium.software/CIS/cis-2.html#tokenmetadata) function to get the Metadata Url for a particular token. The contents of the token metadata is defined to be in [this](https://proposals.concordium.software/CIS/cis-2.html#example-token-metadata-fungible) format
      - `updateOperator` : calls [`updateOperator`](https://proposals.concordium.software/CIS/cis-2.html#updateoperator) function to update the operator of a token.
      - `mint` : calls the `mint` function of the cis2 token contract. To add a new token to the contract state.
      - `isValidTokenId` : its a utility function that checks if the input token is a valid token id according to the TokenId type used in the CIS2 token contract. CIS2 standard defines a variety of numeric types which can be used as a token Id. Read more about them [here](https://proposals.concordium.software/CIS/cis-2.html#tokenid)

  - [Marketplace Client](./src/models/Cis2Client.ts)
    Provides interface to interact with a on chain [Marketplace Contract](../marketplace-contract/)
    - `list` : calls `list` function of market place contract to fetch a list of buyable tokens.
    - `add` :  calls `add` function and enables to add a new token to the marketplace contract. So that it can be fetched using `list` function. 
    - `transfer` : calls `transfer` function of marketplace contract which allows anyone to buy a token at the listed price.

  - [Concordium Contract Client](./src/models/ConcordiumContractClient.ts)
    Provides methods to interact with any on chain contract. Ex Init Contract, Invoke Contract & Update Contract.

- Deserializer

  - [Cis2 Deserializer](./src/models/Cis2Deserializer.ts)
    Used by Clients to be able to deserialize byte arrays to [CIS2 types](https://proposals.concordium.software/CIS/cis-2.html#general-types-and-serialization). Represented in code by [Cis2 Types](./src/models/Cis2Types.ts)

  - [Concordium Deserializer](./src/models/ConcordiumDeserializer.ts)
    Used by clients to be able to deserialize bytes arrays to general Concordium Types like Account Address & Contract Address.

  - [Generic Deserializer](./src/models/GenericDeserializer.ts)
    Used by higher level Deserializer to deserialize generic types like numbers and strings from byte arrays. Its a wrapper over Buffer and keeps a counter of the bytes already read from the buffer.

  - [Marketplace Deserializer](./src/models/MarketplaceDeserializer.ts)
    Used by clients to Deserialize Market Place contract return types. Represented by the file [MarketplaceTypes](./src/models/MarketplaceTypes.ts)
