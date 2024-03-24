export const openTo = (url: string) => {
  if (!url) return;
  window.open(url, "_blank");
};

export function sleep(t: number = 0) {
  return new Promise<undefined>((resolve) => {
    setTimeout(() => resolve(undefined), t);
  });
}

export const AddressZero = "0x0000000000000000000000000000000000000000";

export const formatEthereumAddress = (address: any) => {
  if (!address) {
    return "";
  }

  const prefix = address?.slice(0, 7);
  const suffix = address?.slice(-5);
  const ellipsis = "...";

  return `${prefix}${ellipsis}${suffix}`;
};

export function shortStr(
  str?: string,
  startLen: number = 6,
  endLen: number = 6
) {
  if (!str) return "";
  if (str.length <= startLen + endLen) return str;
  const start = str?.substring(0, startLen) || "";
  const end = str?.substring(str.length - endLen) || "";
  return `${start}...${end}`;
}

export const scrollToTop = () => {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
};
