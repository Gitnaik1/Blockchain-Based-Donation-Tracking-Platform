import React, { createContext, useContext, useState, useEffect } from "react";

const Web3Context = createContext(null);

const AMOY_CHAIN_ID_HEX = "0x13882"; // 80002 in hex
const AMOY_CHAIN_CONFIG = {
  chainId: AMOY_CHAIN_ID_HEX,
  chainName: "Polygon Amoy Testnet",
  nativeCurrency: {
    name: "POL",
    symbol: "POL",
    decimals: 18,
  },
  rpcUrls: ["https://rpc-amoy.polygon.technology/"],
  blockExplorerUrls: ["https://amoy.polygonscan.com/"],
};

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [networkName, setNetworkName] = useState("Polygon Amoy");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [demoBalance, setDemoBalance] = useState({
    pol: 25.5,
    usdc: 1500,
    usdt: 2000,
  });

  // Check if wallet was previously connected or listeners
  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setIsDemo(false);
        } else {
          setAccount(null);
        }
      });

      window.ethereum.on("chainChanged", (currentChainId) => {
        setChainId(currentChainId);
      });
    }
  }, []);

  const switchOrAddAmoyNetwork = async () => {
    if (!window.ethereum) return false;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: AMOY_CHAIN_ID_HEX }],
      });
      return true;
    } catch (switchError) {
      // 4902 error code indicates that the chain has not been added to MetaMask.
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [AMOY_CHAIN_CONFIG],
          });
          return true;
        } catch (addError) {
          console.error("Failed to add Amoy network:", addError);
        }
      }
      console.error("Failed to switch to Amoy network:", switchError);
      return false;
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);

    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsDemo(false);
          await switchOrAddAmoyNetwork();
          setIsConnecting(false);
          return { success: true, mode: "metamask", account: accounts[0] };
        }
      } catch (err) {
        console.warn("User rejected MetaMask connection or error occurred:", err);
      }
    }

    // Fallback to interactive Demo Mode on Polygon Amoy
    const simulatedAccount = "0x7a8c9e324B022b7Ac7fD2A98013e8a49c9e889F1";
    setAccount(simulatedAccount);
    setChainId(AMOY_CHAIN_ID_HEX);
    setIsDemo(true);
    setIsConnecting(false);
    return { success: true, mode: "demo", account: simulatedAccount };
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsDemo(false);
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        formattedAccount: formatAddress(account),
        chainId,
        networkName,
        isConnecting,
        isDemo,
        demoBalance,
        setDemoBalance,
        connectWallet,
        disconnectWallet,
        switchOrAddAmoyNetwork,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
