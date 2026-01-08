import { VaultItemType } from "../sheets/NewVaultItemSheet";

// const API_BASE_URL = "https://expira-funktionapp-f0exhsbzfwgyake7.westeurope-01.azurewebsites.net/api/";

const API_BASE_URL = process.env.EXPO_PUBLIC_AZFUNCTION_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing EXPO_PUBLIC_AZFUNCTION_BASE_URL (check your .env)");
}
// If your function is AuthorizationLevel.Function, add your key here or via env/config.
const FUNCTION_KEY: string | undefined = undefined;

type CreateUploadSessionResponse = {
    cardId: string;
    uploadUrl: string; // SAS URL
    blobPath: string; 
};

export type CreateVaultItemRequest = {
    userid?: string; // TODO: fill with actual user ID
    id: string; // use cardId from upload session
    type: VaultItemType;
    blobPath: string;
    // optional fields that you might fill later
    title?: string;
    description?: string;
    merchant?: string;
    expiryDate?: string; // "YYYY-MM-DD"
    amount?: number;
    currency?: string;
    scannedData: string | null;
    dataType: string | null;
};
// type CosmosVaultItem = {
//     userid: string;
//     id: string;
//     type: string;
//     status: string;
//     createdAt: string;
// }
type VaultItem = {
    id: string;
    type: VaultItemType;
    status: "processing" | "ready";
    createdAt: string;

    blobPath: string;
    imageUrl: string; // ✅ NEW: what RN uses to display <Image />
    title?: string;
    description?: string;
    merchant?: string;
    expiryDate?: string;
    amount?: number;
    currency?: string;
    scannedData: string | null;
    dataType: string | null;
};


const buildUrl = (path: string) => {
    const p = path.startsWith("/") ? path : `/${path}`;
    const base = `${API_BASE_URL}${p}`;

    if (!FUNCTION_KEY) return base;
    return `${base}${base.includes("?") ? "&" : "?"}code=${encodeURIComponent(FUNCTION_KEY)}`;
};

const assertOk = async (res: Response) => {
    if (res.ok) return;
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
};

/**
 * 1) Call Azure Function to get a SAS upload URL for one image.
 */
const CreateUploadSession = async (): Promise<CreateUploadSessionResponse> => {
    const res = await fetch(buildUrl("/UploadImage"), {
        method: "POST",
        headers: { Accept: "application/json" },
    });

    await assertOk(res);
    const data = (await res.json()) as CreateUploadSessionResponse;

    if (!data.cardId || !data.uploadUrl || !data.blobPath) {
        throw new Error("Upload session response missing cardId/uploadUrl/blobPath.");
    }
    return data;
};

/**
 * 2) Upload the local image file to Azure Blob using the SAS URL.
 */
const UploadImageToBlob = async (localUri: string, uploadUrl: string): Promise<void> => {
    const fileRes = await fetch(localUri);
    if (!fileRes.ok) throw new Error("Could not read local file");

    const blob = await fileRes.blob();

    const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": blob.type || "application/octet-stream",
        },
        body: blob,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Blob upload failed: ${res.status} — ${text}`);
    }
};


/**
 * 3) Create the vault item (metadata) in your backend (CosmosDB).
 * You can wire this endpoint later; the service is ready.
 */
// const CreateNewVaultItem = async (vaultItem: CreateVaultItemRequest): Promise<VaultItem> => {
//     const res = await fetch(buildUrl("/CreateVaultItemInDB"), {
//         method: "POST",
//         headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//         },
//         body: JSON.stringify(vaultItem),
//     });

//     await assertOk(res);
//     // await CreateCosmosVaultItem(vaultItem);
//     return (await res.json()) as VaultItem;
// };

/**
 * Convenience: one call from the UI:
 * - request SAS
 * - upload image
 * - create metadata
 */
const CreateVaultItemFromImage = async (localUri: string, vaultItem: CreateVaultItemRequest): Promise<VaultItem> => {
    const session = await CreateUploadSession();
    await UploadImageToBlob(localUri, session.uploadUrl);

    // Minimal metadata. Extraction can fill in merchant/expiry later.
    const item: CreateVaultItemRequest = {
        id: session.cardId,
        type: vaultItem.type,
        blobPath: session.blobPath,
        title: vaultItem.title,
        description: vaultItem.description,
        expiryDate: vaultItem.expiryDate,
        amount: vaultItem.amount,
        currency: vaultItem.currency,
        scannedData: vaultItem.scannedData,
        dataType: vaultItem.dataType,
    };

    return await CreateCosmosVaultItem(item);
};

const GetAllVaultItems = async (): Promise<VaultItem[]> => {
    const res = await fetch(buildUrl("/GetAllVaultItems"), {
        method: "GET",
        headers: { Accept: "application/json" },
    });
    await assertOk(res);
    console.log(res);
    return (await res.json()) as VaultItem[];
};

const CreateCosmosVaultItem = async (vaultItem: CreateVaultItemRequest): Promise<VaultItem> => {
    const res = await fetch(buildUrl("/CreateCosmosVaultItem"), {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(vaultItem),
    });
    await assertOk(res);
    return (await res.json()) as VaultItem;
}

const CreateService = {
    CreateUploadSession,
    UploadImageToBlob,
    // CreateNewVaultItem,
    CreateVaultItemFromImage,
    GetAllVaultItems,
    CreateCosmosVaultItem,
};

export default CreateService;
