const { ethers } = require("ethers");
require("dotenv").config();

async function main() {
    const rpcUrl = process.env.SEPOLIA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const nonce = await provider.getTransactionCount(wallet.address);
    const deployNonce = nonce - 1; // Assuming the last tx was the deploy

    const contractAddress = ethers.getCreateAddress({ from: wallet.address, nonce: deployNonce });
    const fs = require('fs');
    fs.writeFileSync('address.txt', contractAddress);
    console.log("Written to address.txt");
}

main().catch(console.error);
