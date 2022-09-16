## Build
- ### [Install tools for development](https://developer.concordium.software/en/mainnet/smart-contracts/guides/setup-tools.html#setup-tools)
- ### [Build the Smart Contract Module](https://developer.concordium.software/en/mainnet/smart-contracts/guides/compile-module.html)
    - Make sure your working directory is [marketplace-contract](./) ie `cd marketplace-contract`.
    - Execute the following commands
        ```bash
        marketplace-contract$ mkdir -p ../dist/marketplace-contract
        marketplace-contract$ cargo concordium build --out ../dist/marketplace-contract/module.wasm --schema-out ../dist/marketplace-contract/schema.bin
        ```
    - You should have [module file](../dist/marketplace-contract/schema.bin) & [schema file](../dist/marketplace-contract/schema.bin) if everything has executed normally