- Initialize Smart Contract

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init market --contract Market-NFT --parameter-json ../sample-artifacts/marketplace/init.json --sender $ACCOUNT --energy 3000 --schema ../marketplace-contract/schema.bin
  ```

  - Name the contract instance. So thats it's easier to work with
    ```
    export MARKETPLACE_CONTRACT=1587
    ```

- Update Token Operator

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 983 --entrypoint updateOperator --parameter-json ../sample-artifacts/marketplace/update-operator.json --schema ./dist/smart-contract/schema.bin --sender $ACCOUNT --energy 6000
  ```

  Please note that this command is being issued to the CIS2 TOken contract. So that Marketplace contract gets the authority to transfer tokens on behalf of the seller.

- Add Token

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update $MARKETPLACE_CONTRACT --entrypoint add --parameter-json ../sample-artifacts/marketplace/add.json --schema ../marketplace-contract/schema.bin --sender $ACCOUNT --energy 10000
  ```

- List Token

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke $MARKETPLACE_CONTRACT --entrypoint list --schema ../marketplace-contract/schema.bin
  ```

- Transfer Token
  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update $MARKETPLACE_CONTRACT --entrypoint transfer --parameter-json ../sample-artifacts/marketplace/transfer.json --schema ../marketplace-contract/schema.bin --sender $ACCOUNT --energy 6000
  ```
