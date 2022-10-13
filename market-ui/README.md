## Prerequisites

- A deployed market place contract supporing the [Schema](https://developer.concordium.software/en/mainnet/smart-contracts/general/contract-schema.html) of the [Marketplace Contract](../marketplace-contract/src/lib.rs). The Index & Subindex of the deployed contract needs to be updated in [Contants](./src/Constants.ts).
- [Schema](https://developer.concordium.software/en/mainnet/smart-contracts/general/contract-schema.html) of the deployed marketplace contract needs to be updated in [Contants](./src/Constants.ts)
- Module reference of a CIS2 compliant smart contract. The module reference needs to be updated in [Contants](./src/Constants.ts)
- [Concordium Browser Wallet](https://github.com/Concordium/concordium-browser-wallet/tree/main/packages/browser-wallet) running as an extention. WIth atleast one account setup.

## Code Structure

### Pages

- #### [Add Nft Page](./src/pages/AddNftPage.tsx)

  Its a workflow of the of the following ordered list.

  - [Cis2FindInstance](#cis2findinstance)
  - [Cis2OperatorOf](#cis2operatorof)
  - [Cis2UpdateOperator](#cis2updateoperator)
  - [Cis2BalanceOf](#cis2balanceof)
  - [MarketplaceAdd](#marketplaceadd)

- #### [List Nft Page](./src/pages/ListNftPage.tsx)

  Uses [Marketplace List](#marketplacelist) Component. To Display a list of NFT's for the input Marketplace Contract.

- #### [Mint Nft Page](./src/pages/MintNftPage.tsx)
  Its a workflow of the of the following ordered list.
  - [Cis2FindInstanceOrInit](#cis2findinstanceorinit)
  - [Cis2MetadataPrepare](#cis2metadataprepare)
  - [Cis2NftMint](#cis2nftmint)

### Components : CIS2 Contract

- #### [CIS2BalanceOf](./src/components/Cis2BalanceOf.tsx)

  Uses [Cis2Client](#cis2client) to get the balance of a CIS2 Token for the input account and displays an error message if the balance <= 0

- #### [CIS2FindInstance](./src/components/Cis2FindInstance.tsx)

  - Uses [ConcordiumContractClient](#concordiumcontractclient) to get info about a Concordium Smart Contract.
  - Uses [Cis2Client](#cis2client) to check if the instance supports CIS2 protocol.

  Displays an error if the contract does not exist or does not support CIS2.

- #### [Cis2FindInstanceOrInit](./src/components/Cis2FindInstanceOrInit.tsx)

  - Either Finds an Existing Instance using [Cis2FindInstance](#cis2findinstance)
  - Or Initializes the instance using [Cis2Init](#cis2init)

- #### [Cis2Init](./src/components/Cis2Init.tsx)

  Uses [Cis2Client](#cis2client) and Initializes a new CIS2-NFT contract.

- #### [Cis2MetadataDisplay](./src/components/Cis2MetadataDisplay.tsx)

  Simply displays Metadata of an NFT. The [structure of the metadata](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json) should match the one defined in the CIS2-NFT protocol.

- #### [Cis2MetadataPrepare](./src/components/Cis2MetadataPrepare.tsx)

  Checks if the provided metadata url is correct. By trying to download the content.

- #### [Cis2NftMint](./src/components/Cis2NftMint.tsx)

  Uses [Cis2Client](#cis2client) to mint a new token/NFT.

- #### [Cis2OperatorOf](./src/components/Cis2OperatorOf.tsx)

  Uses [Cis2Client](#cis2client) to to check if the Marketplace Contract is an owner of input account in input CIS2-NFT contract.

- #### [Cis2UpdateOperator](./src/components/Cis2UpdateOperator.tsx)

  Uses [Cis2Client](#cis2client) to update the account operator to Marketplace Contract in CIS-NFT contract.

- #### [Nft](./src/components/Nft.tsx)
  - Takes an input [MetadataUrl](https://proposals.concordium.software/CIS/cis-2.html#metadataurl).
  - Fetches the [Metdata Json](https://proposals.concordium.software/CIS/cis-2.html#token-metadata-json)
  - Displays the NFT image or an alternative error message.

### Components : Marketplace

- #### [Marketplace Add](./src/components/MarketplaceAdd.tsx)

  Uses [MarketplaceClient](#marketplaceclient) to adds an Token/NFT to the list of buyable NFTs.

- #### [Marketplace List](./src/components/MarketplaceList.tsx)

  Uses [MarketplaceClient](#marketplaceclient) to gets a list of buyable NFTs

- #### [Marketplace Transfer](./src/components/MarketplaceTransfer.tsx)
  Uses [MarketplaceClient](#marketplaceclient) to allow users to pay for an NFT and buy transfer it to their ownership.

### Clients

- #### [Cis2Client](./src/models/Cis2Client.ts)

  Provides interface to interact with [CIS2-NFT onchain contract](https://proposals.concordium.software/CIS/cis-2.html).

- #### [MarketplaceClient](./src/models/Cis2Client.ts)

  Provides interface to interact with a on chain [Marketplace Contract](../marketplace-contract/)

- #### [ConcordiumContractClient](./src/models/ConcordiumContractClient.ts)
  Provides methods to interact with any on chain contract. Ex Init Contract, Invoke Contract & Update Contract.

### Deserializers

- #### [Cis2Deserializer](./src/models/Cis2Deserializer.ts)

  Used by Clients to be able to deserialize byte arrays to [CIS2 types](https://proposals.concordium.software/CIS/cis-2.html#general-types-and-serialization). Represented in code by [Cis2 Types](./src/models/Cis2Types.ts)

- #### [ConcordiumDeserializer](./src/models/ConcordiumDeserializer.ts)

  Used by clients to be able to deserialize bytes arrays to general Concordium Types like Account Address & Contract Address.

- #### [GenericDeserializer](./src/models/GenericDeserializer.ts)

  Used by higher level Deserializers to deserialize generic types like numbers and strings from byte arrays. Its a wapper over Buffer and keeps a counter of the bytes already read from the buffer.

- #### [MarketplaceDeserializer](./src/models/MarketplaceDeserializer.ts)

  Used by clients to Deserialize Market Place contract return types. Refresented by the file [MarketplaceTypes](./src/models/MarketplaceTypes.ts)

## Available Scripts

In the project directory, you can run:

### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `yarn run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
