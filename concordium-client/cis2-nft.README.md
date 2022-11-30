- Initialize Smart Contract
  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init cis2nft --contract CIS2-NFT --sender $ACCOUNT --energy 3000
  ```
- Mint

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2095 --entrypoint mint --parameter-json ../sample-artifacts/cis2-nft/mint.json --schema ../cis2-nft/schema.bin  --sender $ACCOUNT --energy 6000
  ```

  **2095 here is the index of the contract that was initialized.**

- View Contract State

  ```
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke 2095 --entrypoint view --schema ../cis2-nft/schema.bin
  ```

- Transfer

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update 2095 --entrypoint transfer --parameter-json ../sample-artifacts/cis2-nft/transfer.json --schema ../cis2-nft/schema.bin --sender $ACCOUNT --energy 6000
  ```
