# Sample [CIS2 Token](https://proposals.concordium.software/CIS/cis-2.html) tutorial Market & Minting on [Concordium](http://concordium.io)

Concordium is a science-based proof-of-stake blockchain created for all, with in particular business applications in mind. [Read more about concordium](https://www.concordium.com/about)

This repository provides sample implementations of following ways in which a developer can interact with an on chain contract on Concordium.

- Using Frontend React Code (using [Web SDK](https://github.com/Concordium/concordium-node-sdk-js/tree/main/packages/web) and [Concordium Browser Wallet](https://chrome.google.com/webstore/detail/concordium-wallet/mnnkpffndmickbiakofclnpoiajlegmg?hl=en-US))

Please do note that this is **not** an exhaustive list of the languages supported by concordium. There are are SDK's present to interact with the contracts using multiple other languages. A complete list can be found [here](https://developer.concordium.software/en/mainnet/net/guides/sdks-apis.html)

## Contents of Repository

- [CIS2 Token Contract](./cis2-multi/README.md)
- [CIS2 Market Contract](./cis2-multi/README.md)
- [Market React Application](./market-ui/README.md) : 
  React based frontend DAPP for marketplace contract. This is the typescript code which can be used with Concordium Browser Wallet to interact with CIS2-Multi and Marketplace Contract in Browser based environments. It has following features
  - Initialize a new CIS2 Token Contract
  - Mint a CIS2 Token
  - List a CIS2 Token on the Market
  - Buy a CIS2 Token from Market
  - Pinata (IPFS) based metadata Upload for the Token Metadata
- [Mint React Application](./mint-ui/README.md)
  React based frontend DAPP for [cis2-multi](./cis2-multi/src/lib.rs) contract. It allows to Initialize a new contract & mint a token.

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
  - Sell / Buy a CIS2 Token : Using [Frontend React Code](./market-ui/README.md)
  - Mint a CIS2 Token : Using [Frontend React Code](./mint-ui/README.md)
