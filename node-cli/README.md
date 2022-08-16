# NFT Minting : Node Cli

Lets go through the minting and transferring process

## Setting up project

- This is a simple node project with support for typescript.
- Support for parsing input cli crgs is done via [Commander](https://www.npmjs.com/package/commander). As can be seen in the [cli.ts](./src/cli.ts) file
- Add Dependencies & [ts-node](https://www.npmjs.com/package/ts-node)
    ```
    yarn install
    yarn add -g ts-node
    ```
- Add Code in the [cli.ts](./src/cli.ts) file
  ```typescript
  const cli = new commander.Command();
  cli
    .parseAsync(process.argv)
    .catch((e) => console.error(e))
    .then((res) => console.log("cli exited"));
  cli.showHelpAfterError().showSuggestionAfterError().allowUnknownOption(false);
  ```
## Decrypting Mobile Wallet Export

- The [concordium-backup.concordiumwallet](../concordium-backup.concordiumwallet) previously explort via mobile wallet should be present
- Add Cli Command to Decrypt the Mobile wallet
  ```typescript
  function setupCliWalletDecryption(cli: commander.Command) {
    cli
      .command("decrypt")
      .description(`Decrypts wallet export`)
      .requiredOption("--wallet <wallet>", "Wallet export file path", "../concordium-backup.concordiumwallet")
      .requiredOption("--password <wallet>", "Wallet export password")
      .requiredOption("--out <out>", "Wallet out path", "../concordium-backup.decrypted.json")
      .action(async (args: { wallet: string; password: string; out: string }) => {
        const excryptedExport = JSON.parse(readFileSync(args.wallet, "utf8"));
        const decryptedExport = decryptMobileWalletExport(excryptedExport, args.password);
        writeFileSync(args.out, Buffer.from(JSON.stringify(decryptedExport)));
      });
  }
  setupCliWalletDecryption(cli);
  ```
- Call the cli
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
## Deploy Contract Module
- Add Cli command
    ```typescript
    function setupCliDeployModule(cli: commander.Command) {
        return (
            cli
            .command("deploy")
            .description(`Deploy Smart Contract Wasm Module`)
            .requiredOption("--wasm <wasm>", "Compile Module file path", "../dist/smart-contract/module.wasm")
            // Sender Account Args
            .requiredOption("--sign-key <signKey>", "Account Signing Key")
            .requiredOption("--sender <sender>", "Sender Account Address. This should be the owner of the Contract")
            // Node Client args
            .requiredOption("--auth-token <authToken>", "Concordium Node Auth Token", "rpcadmin")
            .requiredOption("--ip <ip>", "Concordium Node IP", "127.0.0.1")
            .requiredOption("--port <port>", "Concordum Node Port", (v) => parseInt(v), 10001)
            .requiredOption("--timeout <timeout>", "Concordium Node request timeout", (v) => parseInt(v), 15000)
            .action(
                async (args: DeployModuleArgs) =>
                await sendAccountTransaction(
                    args,
                    args.sender,
                    args.signKey,
                    // payload
                    { content: Buffer.from(readFileSync(args.wasm)) } as DeployModulePayload,
                    // Transaction Type
                    AccountTransactionType.DeployModule,
                ),
            )
        );
    }
    setupCliDeployModule(cli);
    ```
- Call Deploy Module Command
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
- Add Cli Command
    ```typescript
    function setupCliInitContract(cli: commander.Command) {
        return (
            cli
            .command("init")
            .description(`Initializes a Smart Contract`)
            .requiredOption("--module <module>", "Module Reference", "CIS2-NFT")
            .requiredOption("--energy <energy>", "Maximum Contract Execution Energy", (v) => BigInt(v), 6000n)
            .requiredOption("--contract <contract>", "Contract name", "CIS2-NFT")
            // Sender Account Args
            .requiredOption("--sender <sender>", "Sender Account Address. This should be the owner of the Contract")
            .requiredOption("--sign-key <signKey>", "Account Signing Key")
            // Node Client args
            .requiredOption("--auth-token <authToken>", "Concordium Node Auth Token", "rpcadmin")
            .requiredOption("--ip <ip>", "Concordium Node IP", "127.0.0.1")
            .requiredOption("--port <port>", "Concordum Node Port", (v) => parseInt(v), 10001)
            .requiredOption("--timeout <timeout>", "Concordium Node request timeout", (v) => parseInt(v), 15000)
            .action(
                async (args: InitContractArgs) =>
                await sendAccountTransaction(
                    args,
                    args.sender,
                    args.signKey,
                    // Payload
                    {
                    amount: new GtuAmount(0n),
                    moduleRef: new ModuleReference(args.module),
                    contractName: args.contract,
                    parameter: Buffer.from([]),
                    maxContractExecutionEnergy: args.energy,
                    } as InitContractPayload,
                    // Transaction Type
                    AccountTransactionType.InitializeSmartContractInstance,
                ),
            )
        );
    }
    setupCliInitContract(cli);
    ```
- Call the Cli Command
    ```bash
    ts-node ./src/cli.ts init --module <Module Hash> --sender <ACCOUNT-ADDRESS> --sign-key <SIGN-KEY>
    ```
## Mint NFT : Update Contract
- Add Cli command
    ```typescript
    function setupCliUpdateContract(cli: commander.Command, updateContractAction: string) {
        return (
        cli
        .command(updateContractAction)
        .description(`${updateContractAction} an NFT`)
        .requiredOption("--params <params>", "params file path", (f) => fs.realpathSync(f))
        .requiredOption(
            "--schema <schema>",
            "Contract schema file path",
            (f) => fs.realpathSync(f),
            "../dist/smart-contract/schema.bin",
        )
        .requiredOption("--energy <energy>", "Maximum Contract Execution Energy", (v) => BigInt(v), 6000n)
        .requiredOption("--contract <contract>", "Contract name", "CIS2-NFT")
        .requiredOption("--function <function>", "Contract function name to call", updateContractAction)
        .requiredOption("--index <index>", "Contract Address Index", (v) => BigInt(v))
        .requiredOption("--sub-index <subIndex>", "Contract Address Sub Index", (v) => BigInt(v), 0n)
        // Sender Account Args
        .requiredOption("--sender <sender>", "Sender Account Address. This should be the owner of the Contract")
        .requiredOption("--sign-key <signKey>", "Account Signing Key")
        // Node Client args
        .requiredOption("--auth-token <authToken>", "Concordium Node Auth Token", "rpcadmin")
        .requiredOption("--ip <ip>", "Concordium Node IP", "127.0.0.1")
        .requiredOption("--port <port>", "Concordum Node Port", (v) => parseInt(v), 10001)
        .requiredOption("--timeout <timeout>", "Concordium Node request timeout", (v) => parseInt(v), 15000)
        .action(
            async (args: UpdateContractArgs) =>
            await sendAccountTransaction(
                args,
                args.sender,
                args.signKey,
                // Payload
                {
                parameter: serializeUpdateContractParameters(
                    args.contract,
                    args.function,
                    JSON.parse(readFileSync(args.params).toString()),
                    Buffer.from(readFileSync(args.schema)),
                    SchemaVersion.V2,
                ),
                amount: new GtuAmount(0n),
                contractAddress: {
                    index: BigInt(args.index),
                    subindex: BigInt(args.subIndex),
                },
                receiveName: `${args.contract}.${args.function}`,
                maxContractExecutionEnergy: BigInt(args.energy),
                } as UpdateContractPayload,
                // Transaction Type
                AccountTransactionType.UpdateSmartContractInstance,
            ),
        )
    );
    }
    // Mint
    setupCliUpdateContract(cli, "mint");
    ```
- Call Cli command
    ```bash
    ts-node ./src/cli.ts mint --params ../nft-artifacts/mint-params.json --schema ../dist/smart-contract/schema.bin --index 789 --sender <ACCOUNT-ADDRESS> --sign-key <SIGN-KEY>
    ```
## Transfer NFT : Update Contract
- Add Cli Command
    ```typescript
    setupCliUpdateContract(cli, "transfer");
    ```

    Since Transfer NFT also uses Update Contract Transaction. Support for which was added while adding code to Mint NFT. No extra code is needed. 
- Call Cli Command
    ```
    ts-node ./src/cli.ts transfer --params ../nft-artifacts/transfer-params.json --schema ../dist/smart-contract/schema.bin --index 789 --sender <ACCOUNT-ADDRESS> --sign-key <SIGN-KEY>
    ```
## View Balance : Invoke Contract
- Add Cli Command
    ```typescript
    function setupCliInvokeContract(cli: commander.Command) {
        cli
        .command("view")
        .description(`View Contract state`)
        .requiredOption("--schema <schema>", "Contract schema file path", (f) => fs.realpathSync(f), "../dist/smart-contract/schema.bin")
        .requiredOption("--contract <contract>", "Contract name", "CIS2-NFT")
        .requiredOption("--function <function>", "Contract function name to call", "view")
        .requiredOption("--index <index>", "Contract Address Index", (v) => BigInt(v))
        .requiredOption("--sub-index <subIndex>", "Contract Address Sub Index", (v) => BigInt(v), 0n)
        // Sender Account Args
        .requiredOption("--sender <sender>", "Invoker Account Address")
        // Node Client args
        .requiredOption("--auth-token <authToken>", "Concordium Node Auth Token", "rpcadmin")
        .requiredOption("--ip <ip>", "Concordium Node IP", "127.0.0.1")
        .requiredOption("--port <port>", "Concordum Node Port", (v) => parseInt(v), 10001)
        .requiredOption("--timeout <timeout>", "Concordium Node request timeout", (v) => parseInt(v), 15000)
        .action(async (args: ViewContractArgs) => {
        const contractState = await invokeContract(args);
        const de = deserializeContractState(
            args.contract,
            Buffer.from(readFileSync(args.schema)),
            Buffer.from(contractState, "hex"),
        );
        console.log(de);
        });
    }
    setupCliInvokeContract(cli);
    ```
- Call Cli Command
    ```
    ts-node src/cli.ts view --index 789 --sender 48x2Uo8xCMMxwGuSQnwbqjzKtVqK5MaUud4vG7QEUgDmYkV85e
    ```
     This will print contracts state to console. 