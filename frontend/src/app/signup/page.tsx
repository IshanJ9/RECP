"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import UserABI from "@/utils/abi/User.json";
import { Button } from "@/components/ui/button";

const USER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_USER_CONTRACT_ADDRESS || "";
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
  const [success, setSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

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
      const signer = await provider.getSigner();
      const userContract = new ethers.Contract(USER_CONTRACT_ADDRESS, UserABI, signer);
      const tx = await userContract.addUser(username, name, profileUrl);
      await tx.wait();
      setSuccess("Signup successful!");
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign Up</h1>
        {wallet && (
          <div className="mb-4 text-center text-green-600">Wallet Connected: {wallet.slice(0, 6)}...{wallet.slice(-4)}</div>
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
          </div>
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}
          <Button type="submit" className="w-full" disabled={loading || !wallet || uploading}>
            {loading ? "Signing Up..." : "Sign Up"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default SignupPage;
