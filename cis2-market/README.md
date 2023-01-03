## Build

- ### [Install tools for development](https://developer.concordium.software/en/mainnet/smart-contracts/guides/setup-tools.html#setup-tools)
- ### [Build the Smart Contract Module](https://developer.concordium.software/en/mainnet/smart-contracts/guides/compile-module.html)
  - Make sure your working directory is [cis2-market](./) ie `cd cis2-market`.
  - Execute the following commands
    ```bash
    cis2-market$ cargo concordium build --out ./module.wasm --schema-out ./schema.bin
    ```
  - You should have [module file](./module.wasm) & [schema file](./schema.bin) if everything has executed normally
