import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { mainnet, polygon, optimism, arbitrum, base } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'My RainbowKit App',
  projectId: '9181b760956798db04bb262ac259503c', // Replace with your WalletConnect project ID
  chains: [mainnet, polygon, optimism, arbitrum, base],
  
  ssr: true, // Enable SSR if your app uses server-side rendering
});

export default config;