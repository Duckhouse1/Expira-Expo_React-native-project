using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Azure.Cosmos;

public static class CosmosDBMethods
{
    // Add your methods here
    private const string DatabaseName = "expiradatabasefirst";
    private const string ContainerName = "VaultItems";


    public static async Task<List<CosmosVaultItem>> GetAllVaultItemsByUserId(string userid)
    {
        try
        {
            if (string.IsNullOrWhiteSpace(userid))
                throw new ArgumentException("userId must be provided", nameof(userid));

            // ✅ You likely already have these elsewhere (DI / config).
            var cosmosEndpoint = Environment.GetEnvironmentVariable("cosmosEndpoint");
            var cosmosKey = Environment.GetEnvironmentVariable("cosmosKey");
            var databaseId = Environment.GetEnvironmentVariable("databaseId");
            var containerId = Environment.GetEnvironmentVariable("containerId");

            if (string.IsNullOrWhiteSpace(cosmosEndpoint) || string.IsNullOrWhiteSpace(cosmosKey))
                throw new InvalidOperationException("COSMOS_ENDPOINT and COSMOS_KEY must be set.");

            var client = new CosmosClient(cosmosEndpoint, cosmosKey);
            var container = client.GetDatabase(databaseId).GetContainer(containerId);

            // Query by userId
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.userid = @userid"
            ).WithParameter("@userid", userid);

            // If your container is partitioned by /userId, include the PartitionKey for performance.
            var requestOptions = new QueryRequestOptions
            {
                PartitionKey = new PartitionKey(userid),
                // MaxItemCount = 100 // optional tuning
            };

            var results = new List<CosmosVaultItem>();

            using FeedIterator<CosmosVaultItem> iterator = container.GetItemQueryIterator<CosmosVaultItem>(
                queryDefinition: query,
                requestOptions: requestOptions
            );

            while (iterator.HasMoreResults)
            {
                FeedResponse<CosmosVaultItem> page = await iterator.ReadNextAsync();
                results.AddRange(page);

            }

            return results;
        }
        catch (Exception ex)
        {
            throw new Exception("Error retrieving vault items", ex);
        }

    }

    public static async Task<string> AddVaultItem(CosmosVaultItem vaultItem)
    {

        // 2️⃣ Create Cosmos DB client
        var cosmosClient = new CosmosClient(Environment.GetEnvironmentVariable("CosmosDBConnectionString"));

        var container = cosmosClient
            .GetDatabase(DatabaseName)
            .GetContainer(ContainerName);



        // 3️⃣ Create card record
        var cardRecord = new CosmosVaultItem
        {
            id = vaultItem.id,
            userid = vaultItem.userid,
            createdAt = DateTime.UtcNow,
            status = vaultItem.status,
            amount = vaultItem.amount,
            expiryDate = vaultItem.expiryDate,
            type = vaultItem.type
        };

        var cosmosReponds = await container.CreateItemAsync(cardRecord, new PartitionKey(vaultItem.userid));
        cosmosReponds.StatusCode.ToString();
        // 4️⃣ Return success response
        return cosmosReponds.StatusCode.ToString();
    }
}