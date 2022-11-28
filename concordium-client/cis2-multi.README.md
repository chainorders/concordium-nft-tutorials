- Initialize Smart Contract

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init <MODULE_REF> --contract CIS2-Multi --sender $SENDER --energy 3000
  ```

  Name the contract instance. So thats it's easier to work with

  ```
  concordium-client contract name <INDEX> --name token
  ```

- Mint

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update nft --entrypoint mint --parameter-json ../sample-artifacts/cis2/mint.json --schema ../cis2-multi/schema.bin --sender $SENDER --energy 6000
  ```

- View

  ```
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke token --entrypoint view
  ```

- Transfer

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update token --entrypoint transfer --parameter-json ../sample-artifacts/cis2/transfer.json --schema ../cis2-multi/schema.bin --sender $SENDER --energy 6000
  ```
