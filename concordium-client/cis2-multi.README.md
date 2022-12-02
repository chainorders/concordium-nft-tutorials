- Initialize Smart Contract

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init cis2multi --contract CIS2-Multi --sender $ACCOUNT --energy 3000
  ```

- Mint

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2097 --entrypoint mint --parameter-json ../sample-artifacts/cis2-multi/mint.json --schema ../cis2-multi/schema.bin --sender $ACCOUNT --energy 6000
  ```

- View

  ```
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke 2097 --entrypoint view --schema ../cis2-multi/schema.bin
  ```

- Transfer

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2097 --entrypoint transfer --parameter-json ../sample-artifacts/cis2-multi/transfer.json --schema ../cis2-multi/schema.bin --sender $ACCOUNT --energy 6000
  ```
