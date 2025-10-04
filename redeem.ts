import { ethers } from "ethers";
import "dotenv/config";
import {
  ParentTransactionReceipt,
  ParentToChildMessageStatus,
} from "@arbitrum/sdk";
import type { ParentToChildMessageWriter } from "@arbitrum/sdk";

const l1Provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
const l2Provider = new ethers.JsonRpcProvider("https://arb1.arbitrum.io/rpc");
const l2Signer = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, l2Provider);

// your L1 tx hash from the script you just sent
const L1_TX_HASH =
  process.env.L1_TX_HASH ||
  "0x2e3d74d676c28c205b7ab8b56c8e029e924e830210e15c77aa66e176e952dfd6";

const l1ReceiptRaw = await l1Provider.getTransactionReceipt(L1_TX_HASH);
if (!l1ReceiptRaw) {
  throw new Error(`No receipt found for L1 tx ${L1_TX_HASH}`);
}

// Wrap it so the SDK can parse bridge events
const l1Receipt = new ParentTransactionReceipt(l1ReceiptRaw as any);

// There can be multiple L1→L2 messages; yours should be messages[0]
const messages = (await l1Receipt.getParentToChildMessages(
  l2Signer as any
)) as unknown as ParentToChildMessageWriter[];
if (messages.length === 0) {
  throw new Error("No L1→L2 retryable messages found in this L1 tx");
}

const msg = messages[0];

// 1) Get current status
const status = await msg.status();
if (status === ParentToChildMessageStatus.REDEEMED) {
  console.log("Retryable already auto-redeemed on L2 ✅");
  const res = await msg.getSuccessfulRedeem();
  if (res.status === ParentToChildMessageStatus.REDEEMED) {
    console.log("L2 tx hash:", res.childTxReceipt.transactionHash);
  }
} else if (status === ParentToChildMessageStatus.EXPIRED) {
  console.log("Retryable expired ❌");
} else {
  console.log("Retryable exists but not redeemed yet. Redeeming now…");
  // You need an L2 signer with enough ETH to pay L2 gas for the redeem
  const redeemTx = await msg.redeem();
  const r = await redeemTx.wait();
  console.log("Redeemed on L2 ✅ hash:", r.transactionHash);
}
