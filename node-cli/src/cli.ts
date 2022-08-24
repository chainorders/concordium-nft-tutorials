import * as commander from "commander";
import "./shims";
import * as fs from "fs-extra";
import {
  AccountTransactionType,
  decryptMobileWalletExport,
  DeployModulePayload,
  deserializeContractState,
  GtuAmount,
  InitContractPayload,
  ModuleReference,
  SchemaVersion,
  serializeUpdateContractParameters,
  UpdateContractPayload,
} from "@concordium/node-sdk";
import { sendAccountTransaction, viewContract as invokeContract } from "./node-client/node-interactions";
import { Buffer } from "buffer/";
import pkg from "fs-extra";
import { DeployModuleArgs, InitContractArgs, UpdateContractArgs, ViewContractArgs } from "./node-client/types";
import { writeFileSync } from "fs";
const { readFileSync } = pkg;

const cli = new commander.Command();

// Decrypt Wallet
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

// Deploy Module
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
      .option("--wait", "Should wait for transaction finalization", false)
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
            args.wait,
          ),
      )
  );
}
setupCliDeployModule(cli);

// Init Contract
function setupCliInitContract(cli: commander.Command) {
  return (
    cli
      .command("init")
      .description(`Initializes a Smart Contract`)
      .requiredOption("--module <module>", "Module Reference")
      .requiredOption("--energy <energy>", "Maximum Contract Execution Energy", (v) => BigInt(v), 6000n)
      .requiredOption("--contract <contract>", "Contract name")
      // Sender Account Args
      .requiredOption("--sender <sender>", "Sender Account Address. This should be the owner of the Contract")
      .requiredOption("--sign-key <signKey>", "Account Signing Key")
      // Node Client args
      .requiredOption("--auth-token <authToken>", "Concordium Node Auth Token", "rpcadmin")
      .requiredOption("--ip <ip>", "Concordium Node IP", "127.0.0.1")
      .requiredOption("--port <port>", "Concordum Node Port", (v) => parseInt(v), 10001)
      .requiredOption("--timeout <timeout>", "Concordium Node request timeout", (v) => parseInt(v), 15000)
      .option("--wait", "Should wait for transaction finalization", false)
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
            args.wait,
          ),
      )
  );
}
setupCliInitContract(cli);

// Update Contract
function setupCliUpdateContract(cli: commander.Command, updateContractAction: string) {
  return (
    cli
      .command(updateContractAction)
      .description(`${updateContractAction} an NFT`)
      .requiredOption("--params <params>", "params file path", (f) => fs.realpathSync(f), `../nft-artifacts/${updateContractAction}-params.json`)
      .requiredOption("--schema <schema>", "Contract schema file path", (f) => fs.realpathSync(f))
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
      .option("--wait", "Should wait for transaction finalization", false)
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
            args.wait,
          ),
      )
  );
}
// Mint
setupCliUpdateContract(cli, "mint");

// Transfer
setupCliUpdateContract(cli, "transfer");

// Invoke Contract
function setupCliInvokeContract(cli: commander.Command) {
  cli
    .command("view")
    .description(`View Contract state`)
    .requiredOption(
      "--schema <schema>",
      "Contract schema file path",
      (f) => fs.realpathSync(f),
      "../dist/smart-contract/schema.bin",
    )
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

cli
  .parseAsync(process.argv)
  .catch((e) => console.error(e))
  .then((res) => console.log("cli exited"));
cli.showHelpAfterError().showSuggestionAfterError().allowUnknownOption(false);
