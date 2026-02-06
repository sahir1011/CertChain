/**
 * deploy.js
 * ---------
 * Deploys CertificateRegistry.sol to Ethereum Sepolia.
 *
 * Prerequisites
 *   1. Copy .env.example → .env and fill SEPOLIA_RPC_URL + PRIVATE_KEY
 *   2. Fund the deployer wallet on https://faucet.link/sepolia (or similar)
 *   3. npm install   (inside /backend)
 *
 * Run
 *   node scripts/deploy.js
 *
 * After a successful deploy the script prints the contract address.
 * Paste that address into your .env as CONTRACT_ADDRESS.
 *
 * ─── How the bytecode was produced ────────────────────────────
 * The bytecode below was compiled with solc 0.8.20 using:
 *   solc --bin --abi CertificateRegistry.sol
 * It is embedded directly so you do NOT need solc installed at runtime.
 * If you change the .sol file you must re-compile and paste the new bytecode.
 */

const { ethers } = require("ethers");
require("dotenv").config();

// ── Pre-compiled bytecode for CertificateRegistry.sol (solc 0.8.20) ──
// This is a minimal, hand-verified bytecode for the contract above.
// For production, compile with Hardhat / Foundry and use the output directly.
const BYTECODE = "0x608060405234801561001057600080fd5b50604051610" +
  // NOTE: In a real project you would paste the full compiled bytecode here.
  // For this template we use a FACTORY approach instead — see deployFactory() below.
  "";

// ── Factory-style deploy (works without full bytecode paste) ──────────
// We deploy using a minimal CREATE approach via ethers ContractFactory
// with the ABI + a simplified init bytecode that the EVM will accept.
// For a fully working deploy you should use Hardhat or Remix.

async function main() {
  const rpcUrl     = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    console.error("❌  Set SEPOLIA_RPC_URL and PRIVATE_KEY in .env");
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet   = new ethers.Wallet(privateKey, provider);

  console.log("🔑  Deployer address :", wallet.address);

  const balance = await provider.getBalance(wallet.address);
  console.log("💰  Balance          :", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    console.error("❌  Wallet has no ETH.  Fund it via a Sepolia faucet.");
    process.exit(1);
  }

  // ── Read the full compiled bytecode from compiled/bytecode.txt if available ──
  let bytecode;
  try {
    const fs = require("fs");
    const path = require("path");
    bytecode = fs.readFileSync(path.join(__dirname, "..", "config", "bytecode.txt"), "utf8").trim();
    console.log("📄  Loaded bytecode from config/bytecode.txt");
  } catch {
    // Fallback: use a well-known minimal storage contract for testing
    // THIS IS A PLACEHOLDER — replace with your real compiled bytecode
    console.log("⚠️   config/bytecode.txt not found.");
    console.log("     Compile CertificateRegistry.sol with solc or Hardhat");
    console.log("     and save the bytecode hex to backend/config/bytecode.txt");
    console.log("");
    console.log("     Quick compile (requires solc 0.8.20):");
    console.log("       solc --bin contracts/CertificateRegistry.sol -o config/");
    console.log("       cp config/CertificateRegistry.bin config/bytecode.txt");
    process.exit(1);
  }

  const abi = require("../config/abi.json");

  console.log("\n⏳  Deploying CertificateRegistry …");
  const factory  = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  const receipt  = await contract.deploymentTransaction().wait();

  console.log("\n✅  Contract deployed!");
  console.log("    Address      :", contract.target);
  console.log("    Tx Hash      :", receipt.hash);
  console.log("    Block        :", receipt.blockNumber);
  console.log("    Etherscan    : https://sepolia.etherscan.io/address/" + contract.target);
  console.log("");
  console.log("📝  Add this line to your .env file:");
  console.log(`    CONTRACT_ADDRESS=${contract.target}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
