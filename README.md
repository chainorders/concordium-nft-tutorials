# Step by step [Token / CIS2](https://proposals.concordium.software/CIS/cis-2.html) tutorial on [Concordium](http://concordium.io)

Concordium is a science-based proof-of-stake blockchain created for all, with in particular business applications in mind. [Read more about concordium](https://www.concordium.com/about)

This repository provides sample implementations of following ways in which a developer can interact with an on chain contract on Concordium.

- Using [Concordium Client](<(https://developer.concordium.software/en/mainnet/smart-contracts/guides/on-chain-index.html)>)
- Using [Node SDK](https://www.npmjs.com/package/@concordium/node-sdk)
- Using Frontend React Code (using [Web SDK](https://github.com/Concordium/concordium-node-sdk-js/tree/main/packages/web) and [Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg?hl=en-US))

Please do note that this is **not** an exhaustive list of the languages supported by concordium. There are are SDK's present to interact with the contracts using multiple other languages. A complete list can be found [here](https://developer.concordium.software/en/mainnet/net/guides/sdks-apis.html)

## Contents of Repository

- [Contracts](./concordium-contracts/README.md)
  Concordium Sample Contracts with sample cli commands to interact using `concordium-client`.
- [market-ui](./concordium-contracts-react/market-ui/README.md)
  React based frontend DAPP for marketplace contract. This is the typescript code which can be used with Concordium Browser Wallet to interact with CIS2-Multi and Marketplace Contract in Browser based environments.
- [node-cli](./concordium-contracts-node-cli/node-cli/README.md)
  nodejs based, reference cli implementation for interacting with CIS2-Multi Smart Contract.
- Sample scripts for interacting with Smart Contract using Concordium Client
  - [For CIS2 Multi](./concordium-contracts/concordium-client/rust-cli-cis2-multi.README.md)
  - [For Marketplace Contract](./concordium-contracts/concordium-client/rust-cli-cis2-market.README.md)

## Get Started

Throughout this repository [Concordium Testnet](https://testnet.ccdscan.io/) is being used to demo the functionality.

- Perquisites

  - Download and [Install Docker Compose](https://docs.docker.com/compose/install/)
  - [Install tools for Smart Contract development](https://developer.concordium.software/en/mainnet/smart-contracts/guides/setup-tools.html#setup-tools)
  - Clone this Repository
  - Create Concordium Account & Wallet
    - Download concordium testnet wallet
      - [For IOS, IPhone](https://developer.concordium.software/en/mainnet/net/installation/downloads-testnet.html#ios)
      - [For Android](https://developer.concordium.software/en/mainnet/net/installation/downloads-testnet.html#android)
    - [Create Testnet Account](https://developer.concordium.software/en/mainnet/net/guides/create-account.html)
    - [Export wallet](https://developer.concordium.software/en/mainnet/net/guides/export-import.html#export-import) and then copy the file in root named [concordium-backup.concordiumwallet](./concordium-backup.concordiumwallet)

- Interact with Contracts
  - Using [Concordium Client](./concordium-contracts/concordium-client/README.md)
  - Using [Node SDK](./concordium-contracts-node-cli/node-cli/README.md)
  - Using [Frontend React Code](./concordium-contracts-react/market-ui/README.md)
