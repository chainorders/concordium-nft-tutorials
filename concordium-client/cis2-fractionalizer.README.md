- Perquisites

  - A CIS2 Compatible Contract Instance with atleast 1 minted token (Please see [cis2-multi instructions](./cis2-multi.README.md) to do the same)

- Initialize Smart Contract

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init <MODULE_REF> --contract CIS2-Fractionalizer --sender $ACCOUNT --energy 3000
  ```

- Transfer CIS2 Token to the Fractionalizer Contract

  ```
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2164 --entrypoint transfer --parameter-json ../sample-artifacts/cis2-fractionalizer/cis2-multi-transfer.json --schema ../cis2-multi/schema.bin --sender $ACCOUNT --energy 6000
  ```

- Mint

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2163 --entrypoint mint --parameter-json ../sample-artifacts/cis2-fractionalizer/mint.json --schema ../cis2-fractionalizer/schema.bin --sender $ACCOUNT --energy 6000
  ```

- Burn

  We transfer some part of the amount of the minted tokens back to the contract address to burn the tokens

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2163 --entrypoint transfer --parameter-json ../sample-artifacts/cis2-fractionalizer/burn-20.json --schema ../cis2-fractionalizer/schema.bin --sender $ACCOUNT --energy 6000
  ```
  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2163 --entrypoint transfer --parameter-json ../sample-artifacts/cis2-fractionalizer/burn-80.json --schema ../cis2-fractionalizer/schema.bin --sender $ACCOUNT --energy 6000
  ```

- [View CIS2-Multi](./cis2-multi.README.md)
