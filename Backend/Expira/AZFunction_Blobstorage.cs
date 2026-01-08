using System;
using System.Net;
using System.Text.Json;
using Azure.Storage.Blobs;
using Azure.Storage.Sas;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;

namespace Expira;

public class AZFunction_Blobstorage
{
    private readonly ILogger _logger;
    private const string ContainerName = "files";

    public AZFunction_Blobstorage(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<AZFunction_Blobstorage>();
    }

    [Function("UploadImage")]
    public async Task<HttpResponseData> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
    {
        _logger.LogInformation("Upload image request received");

        // 🚧 TEMP: fake user id (replace with real auth later)
        string userId = "user_demo";

        // 1️⃣ Create IDs
        string cardId = Guid.NewGuid().ToString();

        // 2️⃣ Decide blob path
        string blobPath = $"users/{userId}/cards/{cardId}/original.jpg";

        // 3️⃣ Create Blob client
        var blobServiceClient = new BlobServiceClient(
            Environment.GetEnvironmentVariable("BlobConnectionString"));

        var containerClient = blobServiceClient.GetBlobContainerClient(ContainerName);
        containerClient.CreateIfNotExists();

        var blobClient = containerClient.GetBlobClient(blobPath);

        // 4️⃣ Create SAS URL (write-only, short-lived)
        var sasBuilder = new BlobSasBuilder(
     BlobSasPermissions.Write | BlobSasPermissions.Create,
     DateTimeOffset.UtcNow.AddMinutes(5)
 )
        {
            BlobContainerName = ContainerName,
            BlobName = blobPath,
            Resource = "b"
        };



        // sasBuilder.SetPermissions(BlobSasPermissions.Write);

        Uri sasUri = blobClient.GenerateSasUri(sasBuilder);

        // 5️⃣ Return upload info to app
        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "application/json");

        await response.WriteStringAsync($$"""
        {
            "cardId": "{{cardId}}",
            "uploadUrl": "{{sasUri}}",
            "blobPath": "{{blobPath}}"
        }
        """);

        return response;
    }
    [Function("GetAllVaultItems")]
    public async Task<HttpResponseData> GetAllVaultItems(
   [HttpTrigger(AuthorizationLevel.Anonymous, "get")] HttpRequestData req)
    {
        _logger.LogWarning("DEBUG START: GetAllVaultItems");

        try
        {
            string userId = "user_demo";
            _logger.LogWarning("DEBUG userId={UserId}", userId);

            var items = await CosmosDBMethods.GetAllVaultItemsByUserId(userId);

            _logger.LogWarning("DEBUG Cosmos returned {Count} items", items?.Count ?? -1);

            string connectionString = Environment.GetEnvironmentVariable("BlobConnectionString");
            _logger.LogWarning("DEBUG BlobConnectionString is null? {IsNull}", string.IsNullOrWhiteSpace(connectionString));

            var blobContainer = new BlobContainerClient(connectionString, "files");
            var result = new List<object>();

            int i = 0;
            foreach (var item in items ?? new List<CosmosVaultItem>())
            {
                i++;
                _logger.LogWarning("DEBUG ITEM #{Index}: id={Id} blobPath='{BlobPath}'",
                    i, item.id, item.blobPath);

                if (string.IsNullOrWhiteSpace(item.blobPath))
                {
                    _logger.LogWarning("DEBUG SKIP: item id={Id} has empty blobPath", item.id);
                    continue;
                }

                var blobClient = blobContainer.GetBlobClient(item.blobPath);

                var sasBuilder = new BlobSasBuilder(
                    BlobSasPermissions.Read,
                    DateTimeOffset.UtcNow.AddMinutes(15))
                {
                    BlobContainerName = blobContainer.Name,
                    BlobName = item.blobPath,
                    Resource = "b"
                };

                var sasUri = blobClient.GenerateSasUri(sasBuilder);

                result.Add(new
                {
                    id = item.id,
                    type = item.type,
                    status = item.status,
                    createdAt = item.createdAt.ToString("o"),
                    blobPath = item.blobPath,
                    imageUrl = sasUri.ToString(),
                    title = item.title,
                    amount = item.amount,
                    currency = item.currency,
                    expiryDate = item.expiryDate
                });
            }

            _logger.LogWarning("DEBUG result count={Count}", result.Count);

            var response = req.CreateResponse(HttpStatusCode.OK);
            response.Headers.Add("Content-Type", "application/json");
            await response.WriteStringAsync(JsonSerializer.Serialize(result));

            _logger.LogWarning("DEBUG END: GetAllVaultItems OK");
            return response;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DEBUG ERROR in GetAllVaultItems");

            var response = req.CreateResponse(HttpStatusCode.InternalServerError);
            await response.WriteStringAsync("ERROR: " + ex.Message);
            return response;
        }
    }

}

