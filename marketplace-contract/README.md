## Build

- ### [Install tools for development](https://developer.concordium.software/en/mainnet/smart-contracts/guides/setup-tools.html#setup-tools)
- ### [Build the Smart Contract Module](https://developer.concordium.software/en/mainnet/smart-contracts/guides/compile-module.html)
  - Make sure your working directory is [marketplace-contract](./) ie `cd marketplace-contract`.
  - Execute the following commands
    ```bash
    marketplace-contract$ cargo concordium build --out ./module.wasm --schema-out ./schema.bin
    ```
  - You should have [module file](./module.wasm) & [schema file](./schema.bin) if everything has executed normally
