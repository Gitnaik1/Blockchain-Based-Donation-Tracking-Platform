import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  AMOY_CHAIN_ID_HEX,
  AMOY_CHAIN_ID_DEC,
  SUPPORTED_NETWORKS,
  SUPPORTED_TOKENS,
} from "../config";
import { web3Service } from "../services/web3Service";
import { shortenAddress } from "../services/utils/tokenMath";

const Web3Context = createContext(null);

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);
  const [networkName, setNetworkName] = useState("Polygon Amoy");
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [isDemo, setIsDemo] = useState(false);
  const [demoBalance, setDemoBalance] = useState({
    pol: 25.5,
    usdc: 1500,
    usdt: 2000,
  });

  const checkNetwork = useCallback((currentChainId) => {
    if (!currentChainId) return;
    const dec =
      typeof currentChainId === "string"
        ? parseInt(currentChainId, 16)
        : currentChainId;

    const network = SUPPORTED_NETWORKS[dec];
    if (network) {
      setIsWrongNetwork(false);
      setNetworkName(network.name);
    } else {
      setIsWrongNetwork(true);
      setNetworkName(`Unsupported (${currentChainId})`);
    }
  }, []);

  // Listen for wallet events
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsDemo(false);
        setConnectionError(null);
      } else {
        // Disconnected or locked
        setAccount(null);
        setIsDemo(false);
      }
    };

    const handleChainChanged = (newChainIdHex) => {
      setChainId(newChainIdHex);
      checkNetwork(newChainIdHex);
    };

    const handleDisconnect = () => {
      setAccount(null);
      setIsDemo(false);
    };

    // EIP-1193 event listeners
    window.ethereum.on?.("accountsChanged", handleAccountsChanged);
    window.ethereum.on?.("chainChanged", handleChainChanged);
    window.ethereum.on?.("disconnect", handleDisconnect);

    // Initial silent check if already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsDemo(false);
          window.ethereum
            .request({ method: "eth_chainId" })
            .then((cid) => {
              setChainId(cid);
              checkNetwork(cid);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});

    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener?.("chainChanged", handleChainChanged);
      window.ethereum.removeListener?.("disconnect", handleDisconnect);
    };
  }, [checkNetwork]);

  const switchOrAddAmoyNetwork = async () => {
    setIsConnecting(true);
    setConnectionError(null);
    try {
      const res = await web3Service.switchOrAddAmoyNetwork();
      if (res.success) {
        setChainId(AMOY_CHAIN_ID_HEX);
        setIsWrongNetwork(false);
        setNetworkName("Polygon Amoy Testnet");
        setIsConnecting(false);
        return true;
      } else {
        setConnectionError(res.error || "Failed to switch network.");
        setIsConnecting(false);
        return false;
      }
    } catch (err) {
      setConnectionError(err.message || "Failed to switch to Polygon Amoy.");
      setIsConnecting(false);
      return false;
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setConnectionError(null);

    // Attempt real connection if MetaMask or EIP-1193 is available
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });

        if (accounts && accounts.length > 0) {
          setAccount(accounts[0]);
          setIsDemo(false);

          const currentChain = await window.ethereum.request({
            method: "eth_chainId",
          });
          setChainId(currentChain);
          checkNetwork(currentChain);

          const dec = parseInt(currentChain, 16);
          if (dec !== AMOY_CHAIN_ID_DEC) {
            await switchOrAddAmoyNetwork();
          }

          setIsConnecting(false);
          return { success: true, mode: "metamask", account: accounts[0] };
        }
      } catch (err) {
        if (err.code === 4001) {
          setConnectionError("MetaMask connection request rejected by user.");
          setIsConnecting(false);
          return { success: false, error: "Rejected by user" };
        }
        console.warn("MetaMask request failed, offering interactive demo mode:", err);
      }
    }

    // Interactive Demo / Sandbox Mode on Polygon Amoy
    const simulatedAccount = "0x7a8c312B4C56aDeF80B91244019aA2C81B0989F1";
    setAccount(simulatedAccount);
    setChainId(AMOY_CHAIN_ID_HEX);
    setIsWrongNetwork(false);
    setNetworkName("Polygon Amoy (Interactive Demo)");
    setIsDemo(true);
    setIsConnecting(false);
    return { success: true, mode: "demo", account: simulatedAccount };
  };

  const disconnectWallet = () => {
    setAccount(null);
    setIsDemo(false);
    setConnectionError(null);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        formattedAccount: shortenAddress(account, 4),
        chainId,
        isWrongNetwork,
        networkName,
        isConnecting,
        connectionError,
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
