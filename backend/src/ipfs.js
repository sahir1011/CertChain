const axios = require("axios");

const config = require("./config");

async function uploadToIPFS(metadata) {
    const pinataApiKey = config.get("PINATA_API_KEY");
    const pinataSecretApiKey = config.get("PINATA_SECRET_KEY");

    if (!pinataApiKey || !pinataSecretApiKey) {
        console.warn("[ipfs] Missing Pinata keys. Returning mock CID.");
        // Return a dummy CID for testing purposes if no keys are provided
        return "QmTestCid1234567890abcdef";
    }

    const url = `https://api.pinata.cloud/pinning/pinJSONToIPFS`;

    try {
        const response = await axios.post(
            url,
            metadata,
            {
                headers: {
                    pinata_api_key: pinataApiKey,
                    pinata_secret_api_key: pinataSecretApiKey,
                },
            }
        );
        return response.data.IpfsHash;
    } catch (error) {
        console.error("[ipfs] Upload failed:", error);
        throw new Error("Failed to upload to IPFS");
    }
}

module.exports = { uploadToIPFS };
