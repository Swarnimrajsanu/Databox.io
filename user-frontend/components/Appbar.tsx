"use client";
import { BACKEND_URL } from '@/utils';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

// Dynamically import wallet buttons with ssr disabled
const WalletMultiButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const WalletDisconnectButton = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletDisconnectButton,
  { ssr: false }
);

const Appbar = () => {
  const { publicKey, signMessage } = useWallet();

  async function signAndSend() {
    if (!publicKey) {
      return;
    }
    const message = new TextEncoder().encode("Sign into mechanical turks");
    const signature = await signMessage?.(message);
    console.log(signature)
    console.log(publicKey)
    const response = await axios.post(`${BACKEND_URL}/v1/user/signin`, {
      signature,
      publicKey: publicKey?.toString()
    });

    localStorage.setItem("token", response.data.token);
  }

  useEffect(() => {
    signAndSend()
  }, [publicKey]);

  return <div className="flex justify-between border-b pb-2 pt-2">
    <div className="text-2xl pl-4 flex justify-center pt-3">
      Turkify
    </div>
    <div className="text-xl pr-4 pb-2">
      {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
    </div>
  </div>
}

export default Appbar