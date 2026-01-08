public class CosmosVaultItem
{
    // Required by Cosmos
    public string id { get; set; }           // cardId (GUID)
    public string userid { get; set; }       // partition key
    // Core meaning
    public string type { get; set; }         // "giftcard", "warranty"
    public string title { get; set; }        // "IKEA Gift Card"
    public string description { get; set; }
    // Money / expiry
    public decimal? amount { get; set; }     // numeric, not string
    public string currency { get; set; }     // "DKK", "USD"
    public DateTime? expiryDate { get; set; }
    // Blob reference
    public string blobPath { get; set; }     // users/{userId}/cards/{id}/original.jpg
    // State
    public string status { get; set; }       // "processing", "ready"
    // Timestamps
    public DateTime createdAt { get; set; }
    public DateTime? updatedAt { get; set; }
}
