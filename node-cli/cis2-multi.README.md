# NFT Minting : Node Cli : CIS2-NFT

## Deploy Contract Module

```bash
ts-node ./src/cli.ts deploy --wasm ../dist/smart-contract-multi/module.wasm --sender $ACCOUNT --sign-key $SIGN_KEY
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
ts-node ./src/cli.ts init --sender $ACCOUNT --sign-key $SIGN_KEY --contract CIS2-Multi --module <Module Hash> 
```
- Check the contract Index & SubIndex on the explorer (url).

## Mint NFT : Update Contract
```bash
ts-node ./src/cli.ts mint --sender $ACCOUNT --sign-key $SIGN_KEY --schema ../dist/smart-contract-multi/schema.bin --index 789 --params ../nft-artifacts/mint-multi.json
```

## Transfer NFT : Update Contract
```
ts-node ./src/cli.ts transfer --params ../nft-artifacts/transfer-params.json --schema ../dist/smart-contract-multi/schema.bin --index 789 --sender $ACCOUNT --sign-key $SIGN_KEY
```

## View Balance : Invoke Contract
```
ts-node src/cli.ts view --index 789 --sender 48x2Uo8xCMMxwGuSQnwbqjzKtVqK5MaUud4vG7QEUgDmYkV85e
```
This will print contracts state to console. 