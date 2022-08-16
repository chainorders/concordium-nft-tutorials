## Build
- ### [Install tools for development](https://developer.concordium.software/en/mainnet/smart-contracts/guides/setup-tools.html#setup-tools)
- ### [Build the Smart Contract Module](https://developer.concordium.software/en/mainnet/smart-contracts/guides/compile-module.html)
    - Make sure your working directory is [cis2-nft](./) ie `cd cis2-nft`.
    - Execute the following commands
        ```bash
        cis2-nft$ mkdir ../dist/smart-contract -p
        cis2-nft$ cargo concordium build --out ../dist/smart-contract/module.wasm --schema-out ../dist/smart-contract/schema.bin
        ```
    - You should have [module file](../dist/smart-contract/schema.bin) & [schema file](../dist/smart-contract/schema.bin) if everything has executed normally