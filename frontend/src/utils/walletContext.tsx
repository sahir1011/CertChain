"use client";
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface WalletContextType {
  account: string | null;
  isConnected: boolean;
  chainId: number | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isCorrectNetwork: boolean;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  isConnected: false,
  chainId: null,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  isCorrectNetwork: false,
});

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_HEX = "0xaa36a7";

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const isConnected = !!account;
  const isCorrectNetwork = chainId === SEPOLIA_CHAIN_ID;

  const checkConnection = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const cId = await window.ethereum.request({ method: "eth_chainId" });
        setChainId(parseInt(cId as string, 16));
      }
    } catch {}
  }, []);

  useEffect(() => {
    checkConnection();
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on?.("accountsChanged", (accounts: string[]) => {
        setAccount(accounts[0] || null);
        if (!accounts[0]) setChainId(null);
      });
      window.ethereum.on?.("chainChanged", (cId: string) => {
        setChainId(parseInt(cId, 16));
      });
    }
  }, [checkConnection]);

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_HEX }],
      });
    } catch (e: any) {
      if (e.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: SEPOLIA_HEX,
              chainName: "Sepolia Test Network",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["https://sepolia.infura.io/v3/your-infura-key"],
              blockExplorerUrls: ["https://sepolia.etherscan.io"],
            },
          ],
        });
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("Please install MetaMask to continue!");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
      const cId = await window.ethereum.request({ method: "eth_chainId" });
      const numericChain = parseInt(cId as string, 16);
      setChainId(numericChain);
      if (numericChain !== SEPOLIA_CHAIN_ID) {
        await switchToSepolia();
      }
    } catch (e: any) {
      if (e.code === 4001) alert("Connection request rejected.");
      else alert("Failed to connect wallet.");
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setChainId(null);
  };

  return (
    <WalletContext.Provider value={{ account, isConnected, chainId, connectWallet, disconnectWallet, isCorrectNetwork }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}

// Extend Window to include ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
