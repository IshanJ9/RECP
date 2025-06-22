"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { UserABI } from "@/utils/abi/User";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUserStore } from "@/store/userStore";

const USER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USER_CONTRACT_ADDRESS?.replace(/['"]/g, '') || "";
const CLOUDINARY_UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

const SignupPage = () => {
  const [wallet, setWallet] = useState("");
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");  const [uploading, setUploading] = useState(false);
  const router = useRouter();
  const { setCurrentUser } = useUserStore();

  // Dynamically update wallet address on account change
  useEffect(() => {
    async function fetchWallet() {
      if ((window as any).ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const signer = await provider.getSigner();
          setWallet(await signer.getAddress());
        } catch (err) {
          setWallet("");
        }
      }
    }
    fetchWallet();
    if ((window as any).ethereum) {
      (window as any).ethereum.on("accountsChanged", (accounts: string[]) => {
        setWallet(accounts[0] || "");
      });
    }
    return () => {
      if ((window as any).ethereum && (window as any).ethereum.removeListener) {
        (window as any).ethereum.removeListener("accountsChanged", () => {});
      }
    };
  }, []);

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    setError("");
    setProfileUrl("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.secure_url) {
        setProfileUrl(data.secure_url);
        setError("");
      } else {
        throw new Error("Cloudinary upload failed");
      }
    } catch (err: any) {
      setError(err.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileFile(file);
      handleImageUpload(file);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (!(window as any).ethereum) throw new Error("MetaMask not found");
      if (!profileUrl) throw new Error("Please upload a profile picture");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();      const userContract = new ethers.Contract(USER_CONTRACT_ADDRESS, UserABI, signer);
      const tx = await userContract.addUser(username, name, profileUrl);
      await tx.wait();
      
      // Create user object and store in user store
      const newUser = {
        userWallet: wallet,
        userName: username,
        name: name,
        userProfile: profileUrl
      };
      setCurrentUser(newUser);
      
      setSuccess("Account created successfully!");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Create Account</CardTitle>
          <p className="text-gray-600 mt-2">Set up your ETH Town profile</p>
        </CardHeader>
        
        <CardContent>
          {wallet && (
            <div className="mb-6 text-center">
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
          )}
          
          <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Username</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Name</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium">Profile Picture</label>
            <input
              type="file"
              accept="image/*"
              className="w-full border rounded-lg px-3 py-2"
              onChange={handleFileChange}
              required
            />
            {uploading && <div className="text-blue-600 text-sm">Uploading image...</div>}
            {profileUrl && (
              <img src={profileUrl} alt="Profile Preview" className="mt-2 w-20 h-20 rounded-full object-cover mx-auto" />
            )}
          </div>          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-green-700">{success}</span>
              </div>
            </div>
          )}
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium" disabled={loading || !wallet || uploading}>
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating Account...</span>
              </div>
            ) : (
              "Create Account"
            )}
          </Button>
          </form>
          
          <div className="text-center text-sm text-gray-500 mt-4">
            <p>
              Already have an account?{" "}
              <button 
                onClick={() => router.push("/signin")}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign In
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SignupPage;
