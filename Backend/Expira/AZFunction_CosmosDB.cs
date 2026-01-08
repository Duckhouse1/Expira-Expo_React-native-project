using System.Net;
using System.Text.Json;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Azure.Cosmos;

namespace Expira;

public class AZFunction_CosmosDB
{
    private readonly ILogger _logger;
    private const string DatabaseName = "VaultItemsDB";
    private const string ContainerName = "VaultItems";

    public AZFunction_CosmosDB(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<AZFunction_CosmosDB>();
    }

    [Function("CreateCosmosVaultItem")]
    public async Task<HttpResponseData> Run(
    [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)

    {
        _logger.LogInformation("Create card record request received");

        // 🚧 TEMP: fake user id (replace with real auth later)
        string userId = "user_demo";

        // 1️⃣ Parse request body
        var requestBody = JsonSerializer.Deserialize<CosmosVaultItem>(
            await req.ReadAsStringAsync());
        _logger.LogInformation($"Request Body: {requestBody}");
        if (requestBody == null || string.IsNullOrEmpty(requestBody.id))
        {
            var badResponse = req.CreateResponse(HttpStatusCode.BadRequest);
            badResponse.WriteString("Invalid request body");
            return badResponse;
        }

        // 2️⃣ Create Cosmos DB client
        var cosmosClient = new CosmosClient(Environment.GetEnvironmentVariable("CosmosDBConnectionString"));

        var container = cosmosClient
            .GetDatabase(DatabaseName)
            .GetContainer(ContainerName);



        // 3️⃣ Create card record
        var cardRecord = new CosmosVaultItem
        {
            id = requestBody.id,
            title = requestBody.title,
            description = requestBody.description,
            userid = userId,
            createdAt = DateTime.UtcNow,
            status = requestBody.status,
            amount = requestBody.amount,
            expiryDate = requestBody.expiryDate,
            type = requestBody.type,
            blobPath = requestBody.blobPath
        };

        await container.CreateItemAsync(cardRecord, new PartitionKey(userId));

        // 4️⃣ Return success response
        var response = req.CreateResponse(HttpStatusCode.OK);
        response.Headers.Add("Content-Type", "application/json");

        // return the created record (or at least the id)
        await response.WriteStringAsync(JsonSerializer.Serialize(new
        {
            ok = true,
            id = cardRecord.id,
            blobPath = cardRecord.blobPath,
            title = cardRecord.title,
            description = cardRecord.description,
            expiryDate = cardRecord.expiryDate,
            amount = cardRecord.amount,
            currency = cardRecord.currency,
            type = cardRecord.type,
            status = cardRecord.status,
            createdAt = cardRecord.createdAt
        }));

        return response;
    }
}



