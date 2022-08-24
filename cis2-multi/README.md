## Build
- ### [Install tools for development](https://developer.concordium.software/en/mainnet/smart-contracts/guides/setup-tools.html#setup-tools)
- ### [Build the Smart Contract Module](https://developer.concordium.software/en/mainnet/smart-contracts/guides/compile-module.html)
    - Make sure your working directory is [cis2-multi](./) ie `cd cis2-multi`.
    - Execute the following commands
        ```bash
        cis2-multi$ mkdir -p ../dist/smart-contract-multi
        cis2-multi$ cargo concordium build --out ../dist/smart-contract-multi/module.wasm --schema-out ../dist/smart-contract-multi/schema.bin
        ```
    - You should have [module file](../dist/smart-contract-multi/schema.bin) & [schema file](../dist/smart-contract-multi/schema.bin) if everything has executed normally