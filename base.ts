import { ethers } from "ethers";
import "dotenv/config";

const l1Provider = new ethers.JsonRpcProvider("https://eth.llamarpc.com");
const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY!, l1Provider);

const portal = new ethers.Contract(
  "0x49048044D57e1C92A77f79988d21Fa8fAF74E97e", // OptimismPortal (used by Base)
  [
    "function depositTransaction(address to,uint256 value,uint64 gasLimit,bool isCreation,bytes data) payable",
  ],
  wallet
);

const to = "0x0ED6Cec17F860fb54E21D154b49DAEFd9Ca04106";
const value = ethers.parseEther("0.001");
const gasLimit = 200000n; // conservative
const data = "0x";

const tx = await portal.depositTransaction(
  to,
  value,
  gasLimit,
  false,
  data,
  { value } // pay ETH
);

console.log("L1 tx hash:", tx.hash);
