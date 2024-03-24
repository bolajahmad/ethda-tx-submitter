/* eslint-disable no-unused-vars */
import { useState, useRef, useMemo, useCallback } from "react";
import {
  getAccount,
  disconnect,
  getWalletClient,
  getPublicClient,
} from "@wagmi/core";
import { Buffer } from "buffer";
import { useModal } from "connectkit";
import wagmiConfig, { ethda } from "./utils/wagmi";
import {
  AddressZero,
  formatEthereumAddress,
  openTo,
  scrollToTop,
  shortStr,
  sleep,
} from "./utils/common";
import { Common } from "@ethereumjs/common";
import { BlobEIP4844Transaction } from "@ethereumjs/tx";
import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  Spinner,
  Box,
  Container,
  Tabs,
  Tab,
  TabList,
  TabPanels,
  TabPanel,
} from "@chakra-ui/react";
import { parseEther, parseTransaction, stringToHex } from "viem";
import { EncodeBlobs, createMetaDataForBlobs } from "./utils/blobs";
import { ethers } from "ethers";
import { mainnet } from "viem/chains";

const validImageTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/svg+xml",
];

function App() {
  const account = getAccount(wagmiConfig);
  const walletClient = getWalletClient(wagmiConfig);
  // const publicClient = getPublicClient(wagmiConfig, {
  //   chainId: mainnet.id,
  // });

  const inputImgRef = useRef(null);
  const refState = useRef({ isClickShowModal: false });
  const [loading, setLoading] = useState({
    loading: false,
    success: false,
    error: false,
    errorMsg: "Failed",
    uploadImageError: "",
  });
  const [selectedBlob, setSelectedBlob] = useState(true);
  const [isShow] = useState(true);
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState(null);
  const [inputText, setInputText] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [transData, setTransData] = useState();

  const modal = useModal();

  const isConnected = useMemo(
    () =>
      account.address && account.isConnected && account?.chain?.id == ethda.id,
    [account]
  );

  const allowDrop = (event) => {
    event.preventDefault();
  };

  const handleDrop = useCallback((event) => {
    event.preventDefault();

    const files = event.dataTransfer.files?.item(0);
    if (!validImageTypes.includes(files?.type)) {
      setLoading({
        uploadImageError:
          "Only PNG, JPG, JPEG, GIF formats are supported. Please select again.",
      });
      return;
    }

    const fileSizeInKB = files.size / 1024;
    if (fileSizeInKB > 128) {
      setLoading({
        uploadImageError: "File size exceeding 128KB! Please select again.",
      });
      return;
    }

    setFile(files);
  }, []);

  const onSwitchTo = () => {
    openTo("https://www.eip4844.com");
  };
  const onGas = () => {
    openTo("https://docs.ethda.io/developers/quick-start/using-ethda-faucet/");
  };
  const onClickAddNet = () => {
    openTo(
      "https://docs.ethda.io/resources/network-configuration/add-ethda-network/"
    );
  };

  const handleDisconnect = () => {
    setLoading({ success: false });
    setInputText("");
    setFile(null);
    setTransData(null);
    disconnect(wagmiConfig);
  };

  const onFileChange = useCallback((e) => {
    const file = e.target.files?.item(0);
    if (!file) return;

    const fileSizeInKB = file.size / 1024;

    if (!validImageTypes.includes(file?.type)) {
      setLoading({
        uploadImageError:
          "Only PNG, JPG, JPEG, GIF formats are supported. Please select again.",
      });
      return;
    }

    if (fileSizeInKB > 128) {
      setLoading({
        uploadImageError: "File size exceeding 128KB! Please select again.",
      });
      return;
    }
    setFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  const currentOpenState = () => {
    document.body.classList.add("overflow-hidden");
    document.documentElement.classList.add("overflow-hidden");
  };
  const ub8a2numa = (u8) => {
    const uint8Array = u8;

    const numberArray = [];
    for (let i = 0; i < uint8Array.length; i++) {
      numberArray.push(uint8Array[i]);
    }
    return numberArray;
  };

  const onTranscode = async () => {
    if (!file || file.size > 128 * 1024) return;
    const fr = new FileReader();
    fr.onload = () => {
      setTransData({
        text: Buffer.from(inputText, "utf-8").valueOf(),
        img: Buffer.from(fr.result).valueOf(),
        imgType: file.type,
      });
    };
    fr.readAsArrayBuffer(file);
  };

  const getConvertOfZkg = async (data) => {
    const commitments = [];
    const proofs = [];
    const versionHashs = [];
    const encodeBlobs = [];
    const url = "https://blobscan-devnet.ethda.io/backend/convert/blob";

    for (let index = 0; index < data.length; index++) {
      const result = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: ub8a2numa(data[index]),
        }),
      }).then((res) => res.json());

      console.log({ zkgResult: result });
      commitments.push(
        result.commitments.map((item) => new Uint8Array(item.data))[0]
      );
      proofs.push(result.proofs.map((item) => new Uint8Array(item.data))[0]);
      versionHashs.push(
        result.versionedHashes.map(
          (item) => new Uint8Array(Object.values(item))
        )[0]
      );
      const encoded = EncodeBlobs(data[index]);
      console.log({ encoded });
      if (encoded.length > 1) {
        throw "blob too large!";
      }
      encodeBlobs.push(encoded[0]);
    }

    return { commitments, proofs, versionHashs, encodeBlobs };
  };

  const loopGetResult = async ({ result }) => {
    let isTrue = true;
    while (isTrue) {
      await sleep(5000);
      const data = await fetch("https://rpc-devnet.ethda.io", {
        method: "POST",
        body: JSON.stringify({
          method: "eth_getTransactionReceipt",
          params: [result],
          id: 1,
          jsonrpc: "2.0",
        }),
      })
        .then((r) => r.json())
        .catch((e) => console.error(e))
        .finally(() =>
          setLoading({ loading: false, success: false, error: true })
        );
      if (
        data.result &&
        "status" in data.result &&
        data.result.status === "0x1"
      ) {
        setLoading({ loading: false, success: true, error: false });
        return data;
      } else {
        setLoading({ loading: false, success: false, error: true });
        return;
      }
    }
  };

  const onSendTx = async () => {
    console.log({ walletClient, transData, account });
    if (
      !walletClient ||
      !transData ||
      // !publicClient ||
      !account ||
      !account.address
    )
      return;
    try {
      setLoading({ loading: true });
      // const balance = await publicClient.getBalance({
      //   address: account.address,
      // });
      // // check that user has sufficient funds to cover gas fees
      // if (balance < parseEther("0.00001")) {
      //   return setLoading({
      //     loading: false,
      //     error: true,
      //     errorMsg: "Insufficient funds for gas",
      //   });
      // }
      const blobs = [transData.text, transData.img];
      const { commitments, proofs, versionHashs, encodeBlobs } =
        await getConvertOfZkg(blobs);

      const blobsMeta = createMetaDataForBlobs(account.address, [
        "text/plain",
        transData.imgType,
      ]);
      const blobsMetadataHex = stringToHex(JSON.stringify(blobsMeta));
      const nonce = (Math.random() + 12) * 138273920;
      const gasLimit = 21000n + BigInt(blobsMetadataHex.length) * 10n;
      const gasPrice = 1000000000n;

      const request = await walletClient.prepareTransactionRequest({
        account: account.address,
        nonce,
        gas: gasLimit,
        gasPrice: gasPrice,
        to: AddressZero,
        value: 0n,
        data: blobsMetadataHex,
        type: "legacy",
        chain: ethda,
      });

      const res = await walletClient?.signTransaction(request);
      const hexSig = res.startsWith("0x") ? res : `0x${res}`;
      const transaction = parseTransaction(hexSig);
      if (!transaction) return;

      const common = Common.custom(
        {
          name: "ethda",
          networkId: 177,
          chainId: 177,
        },
        {
          eips: [1559, 3860, 4844],
        }
      );
      const blobTx = new BlobEIP4844Transaction(
        {
          chainId: 177n,
          nonce,
          to: AddressZero,
          data: blobsMetadataHex,
          value: 0n,
          maxPriorityFeePerGas: 1000000000n,
          maxFeePerGas: 1000000000n,
          gasLimit: transaction.gas,
          maxFeePerBlobGas: 2000_000_000_000n,
          blobVersionedHashes: versionHashs,
          blobs: encodeBlobs,
          kzgCommitments: commitments,
          kzgProofs: proofs,
          v: (transaction.v || 0n) - 2n * 177n - 35n,
          r: transaction.r,
          s: transaction.s,
        },
        { common }
      );
      const rawData = blobTx.serializeNetworkWrapper();
      const hex = Buffer.from(rawData).toString("hex");
      const value = await fetch("https://rpc-devnet.ethda.io", {
        method: "POST",
        body: JSON.stringify({
          method: "eth_sendRawTransaction",
          params: ["0x" + hex],
          id: 1,
          jsonrpc: "2.0",
        }),
      }).then((r) => r.json());
      if (value.error) {
        const errorMsg = value.error?.message?.includes("insufficient funds")
          ? "Insufficient funds for gas"
          : "";
        setLoading({ loading: false, success: false, error: true, errorMsg });
      } else {
        await loopGetResult(value);
      }
    } catch (error) {
      console.info(error);
      setLoading({ loading: false, success: false, error: true });
    }
  };

  return (
    <Container
      h="100vh"
      minH="100vh"
      className={`${
        !isConnected && "bg-[url(/blobTXBg.svg)] mo:bg-[url(/b-m-EthDA.svg)]"
      } bg-cover object-cover !max-w-full !px-0`}
    >
      {isConnected ? (
        <div className="bg-[url(/black_bg.svg)] mo:bg-none bg-cover h-auto overflow-hidden">
          <div className="bg-[#F6F6F6] px-20">
            <div className="mo:w-full mo:px-[30px] mx-auto w-container md:w-full md:px-[30px]">
              <div className="  flex h-[120px] flex-row items-center mo:justify-between mo:h-[102px]">
                <div className="mo:hidden w-full justify-center flex flex-col gap-2 text-2xl md:text-lg font-normal">
                  <div className=" flex items-center font-medium">
                    <button
                      onClick={onSwitchTo}
                      className="flex flex-row items-center"
                    >
                      Experience EIP-4844{" "}
                      <img src="/share3.svg" className=" mx-2" />
                    </button>
                    blob-carrying transactions (Blob TX)
                  </div>
                  <div className="flex gap-5">
                    <button
                      onClick={onClickAddNet}
                      className="mo:w-full text-base underline mo:text-2xl "
                    >
                      Add EthDA Devnet to wallet
                    </button>
                    <button
                      onClick={onGas}
                      className="mo:mt-[70px] mo:text-2xl   text-base underline"
                    >
                      Gas Faucet
                    </button>
                  </div>
                </div>
                <Menu>
                  <MenuButton
                    as={Button}
                    className="cursor-pointer rounded-lg !min-w-fit md:text-sm border h-[42px] text-[#FC7823]"
                  >
                    {formatEthereumAddress(account.address)}
                  </MenuButton>
                  <MenuList align="start" className="w-[161px] bg-white">
                    <MenuItem
                      textValue="Disconnect"
                      onClick={() => handleDisconnect()}
                      className="text-base  hover:text-orange-400  cursor-pointer"
                    >
                      Disconnect
                    </MenuItem>
                  </MenuList>
                </Menu>

                <div
                  onClick={() =>
                    window.open(
                      `https://blobscan-devnet.ethda.io/address/${account?.address}`,
                      "_blank"
                    )
                  }
                  className=" cursor-pointer flex mr-10 mo:mr-0 gap-[13px] items-center"
                >
                  <img className="ml-5 mo:h-[32px]" src="deal.svg" />
                  <span className="text-[#FC7823] font-normal text-base">
                    History
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="mo:w-full mo:px-[30px] mx-auto w-container md:w-full md:px-[30px] ">
            <div className="flex mo:gap-5 gap-[100px] md:gap-[50px] px-20 mt-[30px] mo:mt-10 mo:flex mo:flex-wrap mo:w-full">
              <div className="w-[440px] md:w-[400px] h-full mo:flex mo:flex-wrap mo:w-full mo:flex-col  ">
                <div className="sm:hidden w-full h-[120px] mo:h-auto font-medium  items-center flex text-2xl mo:text-2xl md:text-lg mo:flex-wrap mo:flex-row">
                  <button onClick={onSwitchTo}> Experience EIP-4844 </button>
                  <img src="/share3.svg" className=" mx-2" /> blob-carrying
                  transactions (Blob TX)
                </div>
                <div className="sm:hidden flex gap-2 mt-4 flex-col items-start">
                  <button
                    onClick={onClickAddNet}
                    className="text-base underline "
                  >
                    Add EthDA Devnet to wallet
                  </button>
                  <button onClick={onGas} className="text-base underline">
                    Gas Faucet
                  </button>
                </div>
                <div className=" text-2xl font-medium mo:mt-10">Input</div>
                <div className=" mt-[36px] md:mt-[40px] mo:mt-5 font-medium mo:text-base md:text-sm mb-5">
                  Type text here
                </div>

                <Box className=" w-full h-[68px] px-2 border border-dashed border-black">
                  <input
                    placeholder="Please Enter ..."
                    maxLength={40}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="mt-2 input-Text mo:w-full w-[425px] md:w-[380px] h-[55px] outline-none"
                  />
                </Box>

                <div className=" text-base md:text-sm font-medium mt-[27px] mo:text-base  mo:mt-5">
                  Attach an image, not exceeding 128KB
                </div>
                <div className=" mo:px-[50px]">
                  <Box className=" mt-5 w-full bg-white  h-[303px] md:h-[308px] border-dashed border border-[#000000] mo:mt-5  ">
                    <label
                      onDrop={handleDrop}
                      onDragOver={allowDrop}
                      className="flex items-center justify-center h-full flex-col "
                    >
                      <input
                        type="file"
                        className="vs-hide"
                        ref={inputImgRef}
                        accept="image/png, image/jpg, image/jpeg, image/gif, image/svg"
                        onChange={onFileChange}
                      />
                      <span className="w-[100px] h-[100px] bg-[#FFF8F4] border  border-dashed rounded-[5px] border-[#FC7823] flex items-center justify-center">
                        <img src="chooseAnyImg.svg" />
                      </span>
                      <span className=" mt-5 mo:mt-[30px] text-center justify-center flex flex-col  overflow-hidden truncate w-[200px]">
                        <div className="flex items-center w-auto flex-row justify-center ">
                          <span
                            title={file?.name}
                            className="cursor-default w-auto"
                          >
                            {shortStr(file?.name, 5)}
                          </span>
                          {previewUrl && (
                            <div className=" ml-2">
                              <img
                                src="iconPreview.svg"
                                title="preview"
                                alt="Preview"
                                width={20}
                                onClick={() => {
                                  setIsModalOpen(!isModalOpen);
                                  currentOpenState();
                                }}
                              />
                            </div>
                          )}
                        </div>
                        <span className=" text-base font-semibold">Browse</span>
                      </span>
                    </label>
                  </Box>
                </div>
                <div className="mt-5 mo:mt-10 flex justify-center mb-20  mo:px-[50px]">
                  <button
                    onClick={onTranscode}
                    className={` ${
                      !file?.name || !inputText
                        ? "cursor-not-allowed bg-[#BABABA] "
                        : "bg-[#FC7823] "
                    } border px-6 text-base font-semibold items-center mo:w-full  flex rounded-xl text-[#FFFFFF] justify-center h-12 text-center`}
                  >
                    Transcode
                  </button>
                </div>
              </div>
              <div className="w-0 flex-1 h-full  mo:mt-[-70px]">
                <div className=" text-2xl font-medium   "> Blob Data</div>
                <Tabs
                  _disabled={!transData && !transData?.img && !transData?.text}
                >
                  <TabList>
                    <Tab
                      className={`w-[195px] md:w-[180px] h-[50px] flex border-[#000000] items-center justify-center  mt-[30px] md:text-sm  text-base font-medium `}
                    >
                      Blob1(Text data)
                    </Tab>
                    <Tab
                      className={`w-[195px] md:w-[180px] h-[50px] flex border-[#000000] items-center justify-center  mt-[30px] md:text-sm  text-base font-medium `}
                    >
                      Blob2(Image data)
                    </Tab>
                  </TabList>

                  {transData ? (
                    <TabPanels className="overflow-y-auto overflow-x-hidden  h-[442px] mo:h-[303px] px-5 py-2 break-all whitespace-normal">
                      <TabPanel>
                        {JSON.stringify(ub8a2numa(transData?.text))}
                      </TabPanel>
                      <TabPanel>
                        {JSON.stringify(ub8a2numa(transData?.img))}
                      </TabPanel>
                    </TabPanels>
                  ) : null}
                </Tabs>

                <div className="mt-5 mo:mt-[37px] flex justify-center  mb-5 mo:px-[50px] ">
                  <button
                    className={` ${
                      !transData
                        ? "cursor-not-allowed hidden bg-[#BABABA] "
                        : "bg-[#FC7823] "
                    } border mo:w-full  px-6 text-base font-semibold items-center flex  rounded-xl text-[#FFFFFF]  justify-center  h-12 text-center`}
                    onClick={onSendTx}
                  >
                    Send Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="mo:w-full mx-auto w-container md:w-full md:px-[30px] mo:px-[30px]">
          <div className="cursor-default mt-[34px] mo:mt-5 justify-center  text-center mo:flex flex-wrap mo:flex-row ">
            <span className="font-medium  text-xl mo:text-[14px] mo:font-light ">
              Store a piece of text or an image fully on-chain with EthDA to
              understand the changes
            </span>
            <div>
              <span className="font-medium text-xl mo:text-[14px] mo:font-light">
                {" "}
                introduced by{" "}
              </span>
              <button
                onClick={onSwitchTo}
                className="font-semibold text-xl mo:text-[16px] mo:font-medium"
              >
                EIP-4844
              </button>
              <span className="font-medium  text-xl mo:text-[14px] mo:font-light ">
                {" "}
                blob-carrying transactions
              </span>
              <span className="font-semibold text-xl mo:text-[16px] mo:font-medium">
                {" "}
                (Blob TX){" "}
              </span>
              <span className="font-medium text-xl mo:text-[14px] mo:font-light">
                {" "}
                following the{" "}
              </span>
            </div>
            <span className="font-semibold text-xl mo:text-[16px] mo:font-medium">
              Ethereum{" "}
            </span>
            <span className="font-medium text-xl mo:text-[14px] mo:font-light">
              &nbsp;Cancun-Deneb Upgrade.
            </span>
          </div>
          {isShow && (
            <div className="mt-[60px] mo:mt-[130px] flex justify-center">
              <button
                onClick={() => {
                  refState.current.isClickShowModal = true;
                  modal.setOpen(true);
                }}
                className="flex items-center justify-center gap-3 bg-[#FC7823] py-2 px-4 rounded-lg text-white"
              >
                <div className="text-lg font-medium">
                  Connect wallet to start
                </div>
                <div className=" rounded-lg bg-white w-[38px] h-[38px] flex items-center justify-center">
                  <img src="/share2.svg" />
                </div>
              </button>
            </div>
          )}
        </div>
      )}
      {loading.loading && <Spinner />}
      {loading.success && (
        <Box>
          <img src="success.svg" />
          <div className="font-medium text-xl text-[#FC7823] mt-[-30px]">
            Success
          </div>
          <div className="flex gap-[15px] mt-5 mb-5  mo:mb-10 ">
            <button
              onClick={() => {
                window.open(
                  `https://blobscan-devnet.ethda.io/address/${account?.address}`,
                  "_blank"
                );
              }}
              className=" mo:w-[120px] w-[140px] border h-[36px] rounded-lg border-[#000000] px-[10px] font-medium text-base mo:text-sm"
            >
              View History
            </button>
            <button
              onClick={() => {
                setLoading({ success: false });
                setInputText("");
                setFile(null);
                setTransData(null);
                scrollToTop();
                setPreviewUrl(null);
              }}
              className="mo:w-[120px] w-[140px] mo:wa h-[36px] text-[#FFFFFF] rounded-lg  bg-[#FC7823] px-[10px] font-medium text-base mo:text-sm"
            >
              Send More
            </button>
          </div>
        </Box>
      )}
    </Container>
  );
}

export default App;
