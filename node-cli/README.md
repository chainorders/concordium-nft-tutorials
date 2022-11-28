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

## Deploy

Execute command

```bash
ts-node ./src/cli.ts deploy --wasm ../dist/smart-contract-multi/module.wasm --sender $ACCOUNT --sign-key $SIGN_KEY
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
  ts-node ./src/cli.ts init --sender $ACCOUNT --sign-key $SIGN_KEY --contract CIS2-Multi --module <Module Hash>
  ```

- Mint Token : Update Contract

  ```bash
  ts-node ./src/cli.ts mint --sender $ACCOUNT --sign-key $SIGN_KEY --wait --contract CIS2-Multi --schema ../dist/smart-contract-multi/schema.bin --params ../sample-artifacts/cis2/mint.json --index <CONTRACT_INDEX>
  ```

- Transfer Token : Update Contract

  ```bash
  ts-node ./src/cli.ts transfer --sender $ACCOUNT --sign-key $SIGN_KEY --wait --contract CIS2-Multi --schema ../dist/smart-contract-multi/schema.bin --params ../sample-artifacts/cis2/transfer.json --index <CONTRACT_INDEX>
  ```

- View Balance : Invoke Contract
  ```bash
  ts-node ./src/cli.ts view --sender $ACCOUNT --contract CIS2-Multi --schema ../dist/smart-contract-multi/schema.bin --index <CONTRACT_INDEX>
  ```

This will print contracts state to console.
