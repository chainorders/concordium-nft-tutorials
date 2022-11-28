import * as commander from "commander";
import "./shims";
import * as fs from "fs-extra";
import prompts from "prompts";
import {
  AccountTransactionType,
  decryptMobileWalletExport,
  DeployModulePayload,
  GtuAmount,
  InitContractPayload,
  ModuleReference,
  SchemaVersion,
  serializeUpdateContractParameters,
  sha256,
  UpdateContractPayload,
} from "@concordium/node-sdk";
import pinataSdk from "@pinata/sdk";
import { sendAccountTransaction, viewContract as invokeContract } from "./node-client/node-interactions";
import { Buffer } from "buffer/";
import {
  DeployModuleArgs,
  InitContractArgs,
  PinataUploadArgs,
  UpdateContractArgs,
  ViewContractArgs,
} from "./node-client/types";
import { Cis2MultiViewStateDeserializer } from "./models/cis2MultiviewStateDeserializer";
import path from "path";
import { MetadataUrl, MintParams } from "./models/cis2Types";

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
      const encryptedExport = JSON.parse(fs.readFileSync(args.wallet, "utf8"));
      const decryptedExport = decryptMobileWalletExport(encryptedExport, args.password);
      fs.writeFileSync(args.out, Buffer.from(JSON.stringify(decryptedExport)));
    });
}
setupCliWalletDecryption(cli);

// Deploy Module
function setupCliDeployModule(cli: commander.Command) {
  return (
    cli
      .command("deploy")
      .description(`Deploy Smart Contract Wasm Module`)
      .requiredOption("--wasm <wasm>", "Compile Module file path")
      // Sender Account Args
      .requiredOption("--sign-key <signKey>", "Account Signing Key")
      .requiredOption("--sender <sender>", "Sender Account Address. This should be the owner of the Contract")
      // Node Client args
      .requiredOption("--auth-token <authToken>", "Concordium Node Auth Token", "rpcadmin")
      .requiredOption("--ip <ip>", "Concordium Node IP", "127.0.0.1")
      .requiredOption("--port <port>", "Concordium Node Port", (v) => parseInt(v), 10001)
      .requiredOption("--timeout <timeout>", "Concordium Node request timeout", (v) => parseInt(v), 15000)
      .option("--wait", "Should wait for transaction finalization", false)
      .option("--wait", "Should wait for transaction finalization", false)
      .action(
        async (args: DeployModuleArgs) =>
          await sendAccountTransaction(
            args,
            args.sender,
            args.signKey,
            // payload
            { content: Buffer.from(fs.readFileSync(args.wasm)) } as DeployModulePayload,
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
      .requiredOption("--port <port>", "Concordium Node Port", (v) => parseInt(v), 10001)
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

/**
 *
 * @param cli Command
 * @param contractFnName Name of the contract function to call.
 * @param arrayInputBatchSize If the Params are if type Array.
 * Then this is the batch size of params used at once to call the contract function.
 */
function setupCliUpdateContract<T>(
  cli: commander.Command,
  contractFnName: string,
  parser: (value: T, pageSize: number) => T[] = (val, pageSize) => Array.of(val),
) {
  return (
    cli
      .command(contractFnName)
      .description(`${contractFnName} an NFT`)
      .requiredOption("--params <params>", "params file path", (f) => fs.realpathSync(f))
      .requiredOption("--schema <schema>", "Contract schema file path", (f) => fs.realpathSync(f))
      .requiredOption("--energy <energy>", "Maximum Contract Execution Energy", (v) => BigInt(v), 6000n)
      .requiredOption("--contract <contract>", "Contract name", "CIS2-NFT")
      .requiredOption("--function <function>", "Contract function name to call", contractFnName)
      .requiredOption("--index <index>", "Contract Address Index", (v) => BigInt(v))
      .requiredOption("--sub-index <subIndex>", "Contract Address Sub Index", (v) => BigInt(v), 0n)
      // Sender Account Args
      .requiredOption("--sender <sender>", "Sender Account Address. This should be the owner of the Contract")
      .requiredOption("--sign-key <signKey>", "Account Signing Key")
      // Node Client args
      .requiredOption("--auth-token <authToken>", "Concordium Node Auth Token", "rpcadmin")
      .requiredOption("--ip <ip>", "Concordium Node IP", "127.0.0.1")
      .requiredOption("--port <port>", "Concordium Node Port", (v) => parseInt(v), 10001)
      .requiredOption("--timeout <timeout>", "Concordium Node request timeout", (v) => parseInt(v), 15000)
      .requiredOption(
        "--batch-size <batchsize>",
        "Size of batch from array of input to be used at once",
        (v) => parseInt(v),
        3,
      )
      .option("--wait", "Should wait for transaction finalization", false)
      .action(async (args: UpdateContractArgs) => {
        var paramsJson = JSON.parse(fs.readFileSync(args.params).toString());
        var pages = parser(paramsJson, args.batchSize);
        for (const page of pages) {
          await sendAccountTransaction(
            args,
            args.sender,
            args.signKey,
            // Payload
            {
              parameter: serializeUpdateContractParameters(
                args.contract,
                args.function,
                page,
                Buffer.from(fs.readFileSync(args.schema)) as any,
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
          );
        }
      })
  );
}
// Mint
setupCliUpdateContract<MintParams>(cli, "mint", (params, pageSize) => {
  const pageCount = Math.ceil(params.tokens.length / pageSize);
  const ret: MintParams[] = [];

  for (let page = 0; page < pageCount; page++) {
    ret.push({
      owner: params.owner,
      tokens: params.tokens.slice(page * pageSize, (page + 1) * pageSize),
    });
  }

  return ret;
});
// Transfer
setupCliUpdateContract(cli, "transfer");

// Invoke Contract
function setupCliInvokeContract(cli: commander.Command) {
  cli
    .command("view")
    .description(`View Contract state`)
    .requiredOption("--schema <schema>", "Contract schema file path", (f) => fs.realpathSync(f))
    .requiredOption("--contract <contract>", "Contract name", "CIS2-NFT")
    .requiredOption("--function <function>", "Contract function name to call", "view")
    .requiredOption("--index <index>", "Contract Address Index", (v) => BigInt(v))
    .requiredOption("--sub-index <subIndex>", "Contract Address Sub Index", (v) => BigInt(v), 0n)
    // Sender Account Args
    .requiredOption("--sender <sender>", "Invoker Account Address")
    // Node Client args
    .requiredOption("--auth-token <authToken>", "Concordium Node Auth Token", "rpcadmin")
    .requiredOption("--ip <ip>", "Concordium Node IP", "127.0.0.1")
    .requiredOption("--port <port>", "Concordium Node Port", (v) => parseInt(v), 10001)
    .requiredOption("--timeout <timeout>", "Concordium Node request timeout", (v) => parseInt(v), 15000)
    .action(async (args: ViewContractArgs) => {
      const contractState = await invokeContract(args);
      const viewState = new Cis2MultiViewStateDeserializer(contractState).readViewState();
      console.log(JSON.stringify(viewState, null, "\t"));
    });
}
setupCliInvokeContract(cli);

// Pinata Functions
function setupPinataUploads(cli: commander.Command) {
  cli
    .command("prepare-mint-args")
    .description(`Pinata Uploads`)
    .requiredOption("--dir <file>", "Directory to upload", (f) => fs.realpathSync(f))
    .requiredOption("--pinata-key <file>", "Pinata Key")
    .requiredOption("--pinata-secret <file>", "Pinata Secret")
    .requiredOption("--gateway-prefix", "IPFS gateway prefix", "https://ipfs.io/ipfs/")
    .requiredOption("--mint-params-file", "File to save Smart Contract Mint Params")
    .action(async (args: PinataUploadArgs) => {
      const pinata = pinataSdk(args.pinataKey, args.pinataSecret);
      const mintParams: MintParams = fs.readJsonSync(args.mintParamsFile);
      const metadataUrlsMap = new Map(mintParams.tokens);

      var files = fs
        .readdirSync(args.dir, { withFileTypes: true })
        .filter((f) => f.isFile() && f.name.endsWith(".jpg"))
        .map((f) => path.join(args.dir, f.name))
        .map((f) => ({ imageFile: f, token: path.parse(f.split(/_|\./)[1]).name }))
        .filter((f) => !!f.token)
        .map((f) => ({
          ...f,
          metadataFile: path.join(args.dir, `nft_${f.token}_metadata.json`),
          metadataUrl: metadataUrlsMap.get(f.token),
        }));

      for (const tokenFile of files) {
        const token = tokenFile.token;

        if (!tokenFile.metadataUrl) {
          if (!fs.existsSync(tokenFile.metadataFile)) {
            console.log(`uploading image file: ${tokenFile.imageFile} to ipfs`);
            const pinataRes = await pinata.pinFileToIPFS(fs.createReadStream(tokenFile.imageFile));
            const url = args.gatewayPrefix + pinataRes.IpfsHash;
            const response = await prompts([
              { type: "text", name: "name", message: `Name of the Token (${token})?` },
              { type: "text", name: "description", message: `Description of the Token (${token})?` },
            ]);

            const metadata = {
              name: response.name,
              description: response.description,
              display: {
                url: url,
              },
            };

            console.log(`writing metadata file: ${tokenFile.metadataFile}`);
            fs.writeJSONSync(tokenFile.metadataFile, metadata, { spaces: "\t" });
          }

          console.log(`uploading metadata file: ${tokenFile.metadataFile} to ipfs`);
          const pinataRes = await pinata.pinFileToIPFS(fs.createReadStream(tokenFile.metadataFile));
          const url = args.gatewayPrefix + pinataRes.IpfsHash;
          const metadataUrl: MetadataUrl = {
            url: url,
            hash: sha256([fs.readFileSync(tokenFile.metadataFile)]).toString("hex"),
          };
          metadataUrlsMap.set(token, metadataUrl);
        }

        mintParams.tokens = Array.from(metadataUrlsMap.entries());
        fs.writeJSONSync(args.mintParamsFile, mintParams, { spaces: "\t" });
      }

      mintParams.tokens = Array.from(metadataUrlsMap.entries());
      console.log(`Writing Mint Parameter file: ${args.mintParamsFile}`);
      fs.writeJSONSync(args.mintParamsFile, mintParams, { spaces: "\t" });
    });
}
setupPinataUploads(cli);

cli
  .parseAsync(process.argv)
  .catch((e) => console.error(e))
  .then((res) => console.log("cli exited"));
cli.showHelpAfterError().showSuggestionAfterError().allowUnknownOption(false);
