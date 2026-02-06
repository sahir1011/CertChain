const path = require("path");
const fs = require("fs");
const solc = require("solc");

const contractPath = path.resolve(__dirname, "..", "contracts", "CertificateRegistry.sol");
const source = fs.readFileSync(contractPath, "utf8");

const input = {
    language: "Solidity",
    sources: {
        "CertificateRegistry.sol": {
            content: source,
        },
    },
    settings: {
        outputSelection: {
            "*": {
                "*": ["*"],
            },
        },
    },
};

console.log("Compiling CertificateRegistry.sol...");
const output = JSON.parse(solc.compile(JSON.stringify(input)));

if (output.errors) {
    output.errors.forEach((err) => {
        console.error(err.formattedMessage);
    });
    if (output.errors.some(e => e.severity === 'error')) {
        process.exit(1);
    }
}

const contract = output.contracts["CertificateRegistry.sol"]["CertificateRegistry"];
const bytecode = contract.evm.bytecode.object;
const abi = contract.abi;

const configDir = path.resolve(__dirname, "..", "config");
if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir);
}

fs.writeFileSync(path.join(configDir, "abi.json"), JSON.stringify(abi, null, 2));
fs.writeFileSync(path.join(configDir, "bytecode.txt"), bytecode);

console.log("✅ Compilation successful!");
console.log(`ABI written to ${path.join(configDir, "abi.json")}`);
console.log(`Bytecode written to ${path.join(configDir, "bytecode.txt")}`);
