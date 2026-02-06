const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;

    if (!rpcUrl || !privateKey) {
        console.error("Missing env vars");
        process.exit(1);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const abiPath = path.join(__dirname, "..", "config", "abi.json");
    const bytecodePath = path.join(__dirname, "..", "config", "bytecode.txt");

    const abi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
    const bytecode = fs.readFileSync(bytecodePath, "utf8").trim();

    console.log("Deploying...");
    const factory = new ethers.ContractFactory(abi, bytecode, wallet);
    const contract = await factory.deploy();
    await contract.deploymentTransaction().wait();

    console.log("Deployed to:", contract.target);

    // Save to file
    fs.writeFileSync(path.join(__dirname, "..", "address.txt"), contract.target);
}

main().catch(console.error);
