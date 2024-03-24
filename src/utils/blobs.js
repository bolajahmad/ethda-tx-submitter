export const BlobTxBytesPerFieldElement = 32; // Size in bytes of a field element
export const BlobTxFieldElementsPerBlob = 4096;
export const BLOB_SIZE =
  BlobTxBytesPerFieldElement * BlobTxFieldElementsPerBlob;

export function EncodeBlobs(data) {
  const len = data.length;
  if (len === 0) {
    throw Error("invalid blob data");
  }

  let blobIndex = 0;
  let fieldIndex = -1;

  console.log({ length: len, data });

  const blobs = [new Uint8Array(BLOB_SIZE).fill(0)];
  for (let i = 0; i < len; i += 31) {
    fieldIndex++;
    if (fieldIndex === BlobTxFieldElementsPerBlob) {
      blobs.push(new Uint8Array(BLOB_SIZE).fill(0));
      blobIndex++;
      fieldIndex = 0;
    }
    let max = i + 31;
    if (max > len) {
      max = len;
    }
    blobs[blobIndex].set(data.subarray(i, max), fieldIndex * 32 + 1);
  }

  console.log({ blobs });
  return blobs;
}

export function createMetaDataForBlobs(create, mimetype) {
  return {
    // "Identifies the originator of the carried blobs"
    originator: create,
    // "Describes the contents of the blobs"
    description: "text,image",
    // Describes the mime type of the blobs
    content_type: "",
    // "Dynamic extra information of the blobs"
    extras: "",
    // Blobs meta data
    blobs: mimetype.map((type) => ({
      // "Describes the content of the i'th blob"
      description: "",
      // "Describes the mime type of the i'th blob"
      content_type: type,
      // "Dynamic extra information of the i'th blob"
      extras: "",
    })),
  };
}
