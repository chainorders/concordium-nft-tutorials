import {
  AccountAddress,
  AccountTransaction,
  AccountTransactionPayload,
  AccountTransactionSignature,
  AccountTransactionType,
  buildBasicAccountSigner,
  ConcordiumNodeClient,
  getAccountTransactionHash,
  signTransaction,
  TransactionExpiry,
  TransactionStatusEnum,
} from "@concordium/node-sdk";
import { credentials, Metadata } from "@grpc/grpc-js";
import { Buffer } from 'buffer/';
import { ClientCreateArgs, ViewContractArgs } from "./types";

export async function viewContract(args: ViewContractArgs): Promise<string> {
  const client = createClient(args);
  const invoker = new AccountAddress(args.sender);
  const consensusStatus = await client.getConsensusStatus();

  var result = await client.invokeContract(
    {
      contract: { index: args.index, subindex: args.subIndex },
      invoker,
      method: `${args.contract}.${args.function}`,
      parameter: Buffer.from([]),
    },
    consensusStatus.bestBlock,
  );

  if (!result) {
    throw new Error("Could not invoke contract");
  } else if (result.tag === "failure") {
    throw new Error(result.reason.tag);
  } else if (!result.returnValue) {
    throw new Error("There is no return value");
  } else {
    return result.returnValue;
  }
}

export async function sendAccountTransaction(
  clientArgs: ClientCreateArgs,
  address: string,
  signKey: string,
  payload: AccountTransactionPayload,
  txnType: AccountTransactionType,
  wait?: boolean,
) {
  const client = createClient(clientArgs);
  const sender = new AccountAddress(address);
  const nonce = await getAccountNonce(client, sender);
  const txn: AccountTransaction = {
    header: {
      nonce,
      sender,
      expiry: new TransactionExpiry(new Date(Date.now() + 3600000)),
    },
    payload,
    type: txnType,
  };
  const signature: AccountTransactionSignature = await signTransaction(txn, buildBasicAccountSigner(signKey));
  const txnSent = await client.sendAccountTransaction(txn, signature);
  const txnHash = getAccountTransactionHash(txn, signature);
  console.log(`Transaction sent to node : ${txnSent}`);
  console.log(`Transaction Hash : ${txnHash}`);
  console.log(`url : https://dashboard.testnet.concordium.com/lookup/${txnHash}`);
  
  let status = await client.getTransactionStatus(txnHash);
  
  if (txnSent && wait) {
    while (status?.status != TransactionStatusEnum.Finalized) {
      await new Promise(f => setTimeout(f, 1000));
      status = await client.getTransactionStatus(txnHash);
      console.log(`Transaction Status : ${status?.status}, waiting for Transaction Finalization...`);
    }
  }
  
  console.log(`Transaction Status : ${status?.status}`);
}

async function getAccountNonce(client: ConcordiumNodeClient, address: AccountAddress) {
  const consensusStatus = await client.getConsensusStatus();
  const accountInfo = await client.getAccountInfo(address, consensusStatus.bestBlock);
  const nonce = accountInfo?.accountNonce;

  if (!nonce) {
    throw new Error("Could not get account nonce");
  }

  return nonce;
}

function createClient({
  authToken = "rpcadmin",
  ip = "127.0.0.1",
  port = 100001,
  timeout = 15000,
}: ClientCreateArgs = {}): ConcordiumNodeClient {
  const metadata = new Metadata();
  metadata.add("authentication", authToken);
  const creds = credentials.createInsecure();

  return new ConcordiumNodeClient(ip, port, creds, metadata, timeout);
}
