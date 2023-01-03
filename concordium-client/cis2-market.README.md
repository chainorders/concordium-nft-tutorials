- Initialize Smart Contract

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init market --contract Market-NFT --parameter-json ../sample-artifacts/marketplace/init.json --sender $ACCOUNT --energy 3000 --schema ../cis2-market/schema.bin
  ```

  - Name the contract instance. So thats it's easier to work with
    ```
    export MARKETPLACE_CONTRACT=2098
    ```

- Update Token Operator

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2097 --entrypoint updateOperator --parameter-json ../sample-artifacts/marketplace/update-operator.json --schema ../cis2-multi/schema.bin --sender $ACCOUNT --energy 6000
  ```

  Please note that this command is being issued to the CIS2 TOken contract. So that Marketplace contract gets the authority to transfer tokens on behalf of the seller.

- Add Token

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2099 --entrypoint add --parameter-json ../sample-artifacts/marketplace/add.json --schema ../cis2-market/schema.bin --sender $ACCOUNT --energy 10000
  ```

- List Token

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke 2099 --entrypoint list --schema ../cis2-market/schema.bin
  ```

- Transfer Token
  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2099 --entrypoint transfer --parameter-json ../sample-artifacts/marketplace/transfer.json --schema ../cis2-market/schema.bin --sender $ACCOUNT --energy 6000 --amount 1
  ```
