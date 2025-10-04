import { ethers } from "ethers";
import "dotenv/config";

const l1Provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, l1Provider);

const inbox = new ethers.Contract(
  "0x4dbd4fc535ac27206064b68ffcf827b0a60bab3f",
  [
    "function createRetryableTicket(address to,uint256 l2CallValue,uint256 maxSubmissionCost,address excessFeeRefundAddress,address callValueRefundAddress,uint256 maxGas,uint256 gasPriceBid,bytes data) payable returns (uint256)",
  ],
  wallet
);

const to = "0x0ed6cec17f860fb54e21d154b49daefd9ca04106"; // L2 address
const l2CallValue = ethers.parseEther("0.001"); // ETH on L2
const maxSubmissionCost = ethers.parseUnits("0.0001", "ether");
const gasPriceBid = ethers.parseUnits("0.01", "gwei");
const maxGas = 100000; // conservative
const data = "0x"; // empty because it’s a plain transfer

const msgValue = maxSubmissionCost + l2CallValue + gasPriceBid * BigInt(maxGas);

const tx = await inbox.createRetryableTicket(
  to,
  l2CallValue,
  maxSubmissionCost,
  wallet.address, // refund addresses
  wallet.address,
  maxGas,
  gasPriceBid,
  data,
  { value: msgValue }
);

console.log("L1 tx hash:", tx.hash);

await tx.wait();

console.log("L1 tx confirmed");