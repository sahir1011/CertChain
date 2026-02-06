// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CertificateRegistry
 * @dev Stores SHA-256 hashes of student certificates on-chain.
 *      - Any address can issue (store) a certificate hash.
 *      - Only the original issuer can revoke it.
 *      - Anyone can verify whether a hash exists and is still valid.
 */
contract CertificateRegistry {
    // ─── Storage ────────────────────────────────────────────────
    struct Certificate {
        bytes32  certHash;       // SHA-256 hash of the certificate payload
        string   ipfsCid;        // IPFS Content Identifier for metadata
        address  issuer;         // address that issued this certificate
        uint256  issuedAt;       // block.timestamp when stored
        bool     isValid;        // true until revoked
    }

    /// @dev hash  →  Certificate
    mapping(bytes32 => Certificate) private certificates;

    /// @dev studentId (keccak256 of the raw string) → list of cert hashes
    mapping(bytes32 => bytes32[]) private studentCerts;

    /// @dev ordered list of every cert hash ever stored
    bytes32[] private allCertHashes;

    // ─── Events ─────────────────────────────────────────────────
    event CertificateIssued(
        bytes32 indexed certHash,
        string  ipfsCid,
        address indexed issuer,
        uint256 issuedAt
    );

    event CertificateRevoked(
        bytes32 indexed certHash,
        address indexed issuer
    );

    // ─── Issue ──────────────────────────────────────────────────
    /**
     * @param _certHash  SHA-256 hash of the certificate data (bytes32)
     * @param _studentId Raw student-ID string (hashed internally for indexing)
     * @param _ipfsCid   IPFS Content ID for the certificate metadata
     */
    function issueCertificate(bytes32 _certHash, string calldata _studentId, string calldata _ipfsCid) external {
        require(certificates[_certHash].certHash == bytes32(0), "Certificate already exists");

        bytes32 studentKey = keccak256(abi.encodePacked(_studentId));

        certificates[_certHash] = Certificate({
            certHash : _certHash,
            ipfsCid  : _ipfsCid,
            issuer   : msg.sender,
            issuedAt : block.timestamp,
            isValid  : true
        });

        studentCerts[studentKey].push(_certHash);
        allCertHashes.push(_certHash);

        emit CertificateIssued(_certHash, _ipfsCid, msg.sender, block.timestamp);
    }

    // ─── Revoke ─────────────────────────────────────────────────
    /**
     * @param _certHash  Hash of the certificate to revoke.
     *                   Only the original issuer may call this.
     */
    function revokeCertificate(bytes32 _certHash) external {
        Certificate storage cert = certificates[_certHash];
        require(cert.certHash != bytes32(0), "Certificate does not exist");
        require(cert.issuer == msg.sender,   "Only the issuer can revoke");
        require(cert.isValid,                "Certificate already revoked");

        cert.isValid = false;
        emit CertificateRevoked(_certHash, msg.sender);
    }

    // ─── Verify ─────────────────────────────────────────────────
    /**
     * @return exists   true if the hash is stored on-chain
     * @return isValid  true if it has not been revoked
     * @return issuer   the address that issued it
     * @return issuedAt the timestamp it was issued
     * @return ipfsCid  the IPFS CID of the certificate metadata
     */
    function verifyCertificate(bytes32 _certHash)
        external view
        returns (bool exists, bool isValid, address issuer, uint256 issuedAt, string memory ipfsCid)
    {
        Certificate memory cert = certificates[_certHash];
        exists   = cert.certHash != bytes32(0);
        isValid  = cert.isValid;
        issuer   = cert.issuer;
        issuedAt = cert.issuedAt;
        ipfsCid  = cert.ipfsCid;
    }

    // ─── Query helpers ──────────────────────────────────────────
    /**
     * @param _studentId Raw student-ID string
     * @return Array of certificate hashes belonging to that student
     */
    function getCertsByStudent(string calldata _studentId)
        external view
        returns (bytes32[] memory)
    {
        bytes32 studentKey = keccak256(abi.encodePacked(_studentId));
        return studentCerts[studentKey];
    }

    /// @return Total number of certificates ever stored
    function totalCertificates() external view returns (uint256) {
        return allCertHashes.length;
    }

    /// @return The full ordered list of certificate hashes
    function getAllCertHashes() external view returns (bytes32[] memory) {
        return allCertHashes;
    }
}
