"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { UserABI } from "@/utils/abi/User";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUserStore } from "@/store/userStore";

const USER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USER_CONTRACT_ADDRESS?.replace(/['"]/g, '') || "0x6E351c6758458Cd5bb20D263D566B50dDaE488C9";

interface UserInfo {
  userWallet: string;
  userName: string;
  name: string;
  userProfile: string;
}

const SigninPage = () => {
  const [wallet, setWallet] = useState("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const router = useRouter();
  const { setCurrentUser } = useUserStore();

  // Check if user exists in the contract
  const checkUserExists = async (walletAddress: string) => {
    try {
      if (!(window as any).ethereum) return false;
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const userContract = new ethers.Contract(USER_CONTRACT_ADDRESS, UserABI, provider);
      
      console.log("Checking user for address:", walletAddress);
      console.log("Using contract address:", USER_CONTRACT_ADDRESS);
      
      // Get user info from contract
      const userData = await userContract.getUser(walletAddress);
      console.log("User data from contract:", userData);
      
      // Check if user wallet is not zero address (meaning user exists)
      if (userData[0] !== ethers.ZeroAddress && userData[1] !== "") {
        const userInfo: UserInfo = {
          userWallet: userData[0],
          userName: userData[1],
          name: userData[2],
          userProfile: userData[3]
        };
        console.log("User found:", userInfo);
        setUserInfo(userInfo);
        setUserExists(true);
        return true;
      } else {
        console.log("User not found - creating new user needed");
        setUserExists(false);
        return false;
      }
    } catch (error) {
      console.error("Error checking user:", error);
      setUserExists(false);
      return false;
    }
  };

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      setConnecting(true);
      setError("");
      
      if (!(window as any).ethereum) {
        throw new Error("MetaMask not found. Please install MetaMask.");
      }

      // Request account access
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Check if we're on the correct network (Sepolia testnet)
      const network = await provider.getNetwork();
      console.log("Connected to network:", network.name, "Chain ID:", network.chainId);
      
      if (Number(network.chainId) !== 11155111) { // Sepolia testnet chain ID
        console.warn("Not on Sepolia testnet. User may need to switch networks.");
        // We'll continue anyway as the contract might work on other networks too
      }
      
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      console.log("Connected wallet address:", address);
      setWallet(address);
      
      // Check if user exists
      await checkUserExists(address);
      
    } catch (err: any) {
      console.error("Wallet connection error:", err);
      setError(err.message || "Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  // Handle wallet connection changes
  useEffect(() => {
    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length > 0) {
        setWallet(accounts[0]);
        await checkUserExists(accounts[0]);
      } else {
        setWallet("");
        setUserInfo(null);
        setUserExists(null);
      }
    };

    if ((window as any).ethereum) {
      (window as any).ethereum.on("accountsChanged", handleAccountsChanged);
      
      // Check if already connected
      (window as any).ethereum.request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          if (accounts.length > 0) {
            setWallet(accounts[0]);
            await checkUserExists(accounts[0]);
          }
        });
    }

    return () => {
      if ((window as any).ethereum && (window as any).ethereum.removeListener) {
        (window as any).ethereum.removeListener("accountsChanged", handleAccountsChanged);
      }
    };
  }, []);

  // Sign in existing user
  const handleSignin = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (!userInfo) {
        throw new Error("User information not found");
      }

      // Store user info in the user store
      setCurrentUser(userInfo);
      
      // Redirect to dashboard
      router.push("/dashboard");
      
    } catch (err: any) {
      setError(err.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  // Redirect to signup
  const handleSignup = () => {
    router.push("/signup");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Welcome to ETH Town</CardTitle>
          <p className="text-gray-600 mt-2">Connect your wallet to sign in</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Wallet Connection Section */}
          {!wallet ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <Button 
                onClick={connectWallet} 
                disabled={connecting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
              >
                {connecting ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span>Connect MetaMask</span>
                  </div>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Wallet Connected */}
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Wallet Connected</p>
                <p className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg inline-block mt-1">
                  {wallet.slice(0, 6)}...{wallet.slice(-4)}
                </p>
              </div>

              {/* User Status */}
              {userExists === true && userInfo ? (
                <div className="text-center space-y-4">
                  <div className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <img 
                        src={userInfo.userProfile || "/placeholder-avatar.png"} 
                        alt="Profile" 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="text-left">
                        <h3 className="font-semibold text-gray-900">{userInfo.name}</h3>
                        <p className="text-sm text-gray-600">@{userInfo.userName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleSignin}
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Signing In...</span>
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </div>
              ) : userExists === false ? (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Welcome, New User!</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      We don't have an account for this wallet address. Let's create one for you.
                    </p>
                  </div>
                  <Button 
                    onClick={handleSignup}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
                  >
                    Create Account
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Checking user status...</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="text-center text-sm text-gray-500">
            <p>
              Need help? Contact{" "}
              <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SigninPage;

