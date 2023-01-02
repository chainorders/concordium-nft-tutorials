## Process of Auctions

Auctions contract allows the Instantiator to create an Auction for any possible CIS2 Tokens. The participation of the auction is controlled by a Participation Tokens which needs to be specified while Instantiating the Auction Contract and represented by the field `participation_token` in the [init.json file](../sample-artifacts/cis2-auctions/init.json)

## CLI Interactions

- Deploy

  ```bash
  export ACCOUNT=new
  export GRPC_IP=127.0.0.1
  export GRPC_PORT=10001

  concordium-client module deploy ./module.wasm --sender $ACCOUNT --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT
  ```

- Initialize Smart Contract

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract init ed8cee6895f1ded9559e8027da76080788f00364be5f7a7831852d77fa62e8b9 --contract auction --sender $ACCOUNT --energy 3000 --schema ../cis2-auctions/schema.bin --parameter-json ../sample-artifacts/cis2-auctions/init.json
  ```

- CIS2 Requirements
  To read more about the CIS2 tokens and its interactions please go through the steps in the [file](../concordium-client/cis2-multi.README.md)

  ```bash
  ## This is the Contract Subindex of the CIS2 Multi Contract.
  export CIS2_CONTRACT=2371
  ```

  - Mint Participation Token

    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update $CIS2_CONTRACT --entrypoint mint --parameter-json ../sample-artifacts/cis2-auctions/mint-participation.json --schema ../cis2-multi/schema.bin --sender $ACCOUNT --energy 6000
    ```

  - Add Participant (Transfer Participation Token)

    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update $CIS2_CONTRACT --entrypoint transfer --parameter-json ../sample-artifacts/cis2-auctions/transfer-participation.json --schema ../cis2-multi/schema.bin --sender $ACCOUNT --energy 6000
    ```

  - Mint Auction Token

    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update $CIS2_CONTRACT --entrypoint mint --parameter-json ../sample-artifacts/cis2-auctions/mint-auction.json --schema ../cis2-multi/schema.bin --sender $ACCOUNT --energy 6000
    ```

  - Start Auction (Transfer Auction Token)
    ```bash
    concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update $CIS2_CONTRACT --entrypoint transfer --parameter-json ../sample-artifacts/cis2-auctions/transfer-auction.json --schema ../cis2-multi/schema.bin --sender $ACCOUNT --energy 6000
    ```

- Bid

  ```bash
  ## Contract Index of the `auction` contract.
  export CONTRACT=2372
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update $CONTRACT --entrypoint bid --sender $ACCOUNT --energy 6000
  ```

- View State

  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract invoke $CONTRACT --entrypoint view --schema ../cis2-auctions/schema.bin --energy 6000
  ```

  **Sample output**

  ```json
  {
  	"auction_state": {
  		"NotSoldYet": [
  			{
  				"amount": "1",
  				"contract": {
  					"index": 2371,
  					"subindex": 0
  				},
  				"token_id": "02"
  			}
  		]
  	},
  	"end": "2023-01-10T00:00:00Z",
  	"highest_bidder": {
  		"Some": ["48x2Uo8xCMMxwGuSQnwbqjzKtVqK5MaUud4vG7QEUgDmYkV85e"]
  	},
  	"minimum_raise": 10,
  	"participants": ["48x2Uo8xCMMxwGuSQnwbqjzKtVqK5MaUud4vG7QEUgDmYkV85e"],
  	"participation_token": {
  		"contract": {
  			"index": 2371,
  			"subindex": 0
  		},
  		"token_id": "01"
  	}
  }
  ```

- Finalize Auction
  ```bash
  concordium-client --grpc-ip $GRPC_IP --grpc-port $GRPC_PORT contract update $CONTRACT --entrypoint finalize --sender $ACCOUNT --energy 6000
  ```
