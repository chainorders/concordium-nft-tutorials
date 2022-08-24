# NFT Minting : Node Cli : CIS2-NFT

## Deploy Contract Module

```bash
ts-node ./src/cli.ts deploy \
--wasm ../dist/smart-contract/module.wasm \
--sender <ACCOUNT-ADDRESS> \
--sign-key <SIGN-KEY>
```

- This will output the Explorer URL
  ```bash
  Transaction sent to node : true
  Transaction Hash : 42380f621e07becf80d880a1749150d8aeae707c98abb0b42f8228ed3e0801aa
  url : https://dashboard.testnet.concordium.com/lookup/42380f621e07becf80d880a1749150d8aeae707c98abb0b42f8228ed3e0801aa
  ```
- Check the transaction on the explorer and note the `<Module Hash>`

## Initializing Contract

```bash
ts-node ./src/cli.ts init --module <Module Hash> --sender <ACCOUNT-ADDRESS> --sign-key <SIGN-KEY>
```

## Mint NFT : Update Contract
```bash
ts-node ./src/cli.ts mint --params ../nft-artifacts/mint-params.json --schema ../dist/smart-contract/schema.bin --index 789 --sender <ACCOUNT-ADDRESS> --sign-key <SIGN-KEY>
```

## Transfer NFT : Update Contract
```
ts-node ./src/cli.ts transfer --params ../nft-artifacts/transfer-params.json --schema ../dist/smart-contract/schema.bin --index 789 --sender <ACCOUNT-ADDRESS> --sign-key <SIGN-KEY>
```

## View Balance : Invoke Contract
```
ts-node src/cli.ts view --index 789 --sender 48x2Uo8xCMMxwGuSQnwbqjzKtVqK5MaUud4vG7QEUgDmYkV85e
```
This will print contracts state to console. 