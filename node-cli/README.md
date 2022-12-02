# Interaction with Concordium Smart Contracts

- This is a simple node project with support for typescript.
- Support for parsing input cli args is done via [Commander](https://www.npmjs.com/package/commander). As can be seen in the [cli.ts](./src/cli.ts) file

## Setup

- Add Dependencies & [ts-node](https://www.npmjs.com/package/ts-node)
  ```
  yarn install
  yarn add -g ts-node
  ```
- Decrypt Mobile Export

  - Execute Command
    ```bash
    ts-node ./src/cli.ts decrypt --wallet ../concordium-backup.concordiumwallet --password <YOUR-PASSWORD> --out ../concordium-backup.concordiumwallet.json
    ```
  - This should create a decrypted credentials file [concordium-backup.concordiumwallet.json](../concordium-backup.concordiumwallet.json)
  - Open the file and search for account address and verifyKey
    ```json
    {
        "value": {
            "identities": [
                {
                    "identityProvider": {...},
                    "accounts": [
                        {
                            "address" : "<ACCOUNT ADDRESS>",
                            "accountKeys": {
                                "keys": {
                                    "0": {
                                        "0": {
                                            "signKey" : "<SIGN KEY>"
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            ]
        }
    }
    ```

- Node Cli project is created as a reference implementation to interact with different types of CIS2 contracts. In the same context following values can be used instead of following placeholders

  - CIS2-NFT
    - `<SCHEMA-FILE>` : [../cis2-nft/schema.bin](../cis2-nft/schema.bin)
    - `<WASM-FILE>` : [../cis2-nft/module.wasm](../cis2-nft/module.wasm)
    - `<CONTRACT-NAME>` : CIS2-NFT
    - `<MINT-PARAMS>` : [../sample-artifacts/cis2-nft/mint.json](../sample-artifacts/cis2-nft/mint.json)
    - `<TRANSFER-PARAMS>` : [../sample-artifacts/cis2-nft/transfer.json](../sample-artifacts/cis2-nft/transfer.json)
  - CIS2-Multi
    - `<SCHEMA-FILE>` : [../cis2-multi/schema.bin](../cis2-multi/schema.bin)
    - `<WASM-FILE>` : [../cis2-multi/module.wasm](../cis2-multi/module.wasm)
    - `<CONTRACT-NAME>` : CIS2-Multi
    - `<MINT-PARAMS>` : [../sample-artifacts/cis2-multi/mint.json](../sample-artifacts/cis2-multi/mint.json)
    - `<TRANSFER-PARAMS>` : [../sample-artifacts/cis2-multi/transfer.json](../sample-artifacts/cis2-multi/transfer.json)

## Deploy

Execute command

```bash
ts-node ./src/cli.ts deploy --wasm <WASM-FILE> --sender $ACCOUNT --sign-key $SIGN_KEY --wait
```

This will output the Explorer URL

```bash
Transaction sent to node : true
Transaction Hash : 42380f621e07becf80d880a1749150d8aeae707c98abb0b42f8228ed3e0801aa
url : https://dashboard.testnet.concordium.com/lookup/42380f621e07becf80d880a1749150d8aeae707c98abb0b42f8228ed3e0801aa
```

Check the transaction on the explorer and note the `<Module Hash>`

## Interact

- Initializing Contract

  ```bash
  ts-node ./src/cli.ts init --sender $ACCOUNT --sign-key $SIGN_KEY --contract <CONTRACT-NAME> --module <Module Hash> --wait
  ```

- Mint Token : Update Contract

  ```bash
  ts-node ./src/cli.ts mint --sender $ACCOUNT --sign-key $SIGN_KEY --wait --contract <CONTRACT-NAME> --schema <SCHEMA-FILE> --params <MINT-PARAMS> --index <CONTRACT-INDEX>
  ```

- Transfer Token : Update Contract

  ```bash
  ts-node ./src/cli.ts transfer --sender $ACCOUNT --sign-key $SIGN_KEY --wait --contract <CONTRACT-NAME> --schema <SCHEMA-FILE> --params <TRANSFER-PARAMS> --index <CONTRACT_INDEX>
  ```

- View Balance : Invoke Contract
  ```bash
  ts-node ./src/cli.ts view --sender $ACCOUNT --contract <CONTRACT-NAME> --schema <SCHEMA-FILE> --index <CONTRACT-INDEX>
  ```

This will print contracts state to console.
