import { getDefaultConfig } from "connectkit";
import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { defineChain } from "viem/utils";
import { coinbaseWallet, walletConnect } from "@wagmi/connectors";

const walletConnectProjectId = "08655efd533e1054791755a0c58862c4";

export const ethda = defineChain({
  id: 177,
  name: "EthDA",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ["https://rpc-devnet.ethda.io"],
    },
    public: {
      http: ["https://rpc-devnet.ethda.io"],
    },
  },
  blockExplorers: {
    default: {
      name: "Etherscan",
      url: "https://scan-devnet.ethda.io",
    },
  },
  contracts: {},
  network: "ethda",
});

const cbConnector = coinbaseWallet({
  chainId: ethda.id as any,
  appName: "Ethda",
  headlessMode: false,
});

const walletConnector = walletConnect({
  projectId: walletConnectProjectId,
  showQrModal: false,
});

const connectors: any = [cbConnector, walletConnector];

const defaultConfig = getDefaultConfig({
  // required config
  chains: [ethda] as any,
  appName: "EthDA",
  connectors,
  // Required API keys
  walletConnectProjectId,
  transports: {
    [mainnet.id]: http(`https://eth-mainnet.g.alchemy.com/v2/rF--ZnAaiu`),
  },
  // Optional
  appDescription: "As an Ethereum L2 network",
  appUrl: "https://family.co",
  // alchemyId: 'rF--ZnAaiu',
});

const wagmiConfig = createConfig(defaultConfig as any);
export default wagmiConfig;
