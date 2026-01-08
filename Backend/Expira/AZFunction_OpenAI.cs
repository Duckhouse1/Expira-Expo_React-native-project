using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Http;
using Microsoft.Extensions.Logging;



namespace Expira;


public class AZFunction_OpenAI
{
    private readonly ILogger _logger;
    private static readonly HttpClient _http = new HttpClient();

    public AZFunction_OpenAI(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<AZFunction_OpenAI>();
    }
    [Function("ExtractGiftCardMetadata")]
    public async Task<HttpResponseData> Run(
       [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequestData req)
    {
        try
        {
            var apiKey = Environment.GetEnvironmentVariable("OpenAIKey");
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                var resp = req.CreateResponse(HttpStatusCode.InternalServerError);
                await resp.WriteStringAsync("Missing OPENAI_API_KEY app setting.");
                return resp;
            }

            // Read request body
            var body = await new StreamReader(req.Body).ReadToEndAsync();
            if (string.IsNullOrWhiteSpace(body))
            {
                var resp = req.CreateResponse(HttpStatusCode.BadRequest);
                await resp.WriteStringAsync("Empty request body.");
                return resp;
            }

            var input = JsonSerializer.Deserialize<ExtractRequest>(body, JsonOptions);
            if (input is null)
            {
                var resp = req.CreateResponse(HttpStatusCode.BadRequest);
                await resp.WriteStringAsync("Invalid JSON.");
                return resp;
            }

            // Normalize to data URL
            string imageDataUrl;
            if (!string.IsNullOrWhiteSpace(input.ImageDataUrl))
            {
                imageDataUrl = input.ImageDataUrl!;
            }
            else if (!string.IsNullOrWhiteSpace(input.Base64))
            {
                var mime = string.IsNullOrWhiteSpace(input.Mime) ? "image/jpeg" : input.Mime!;
                imageDataUrl = $"data:{mime};base64,{input.Base64}";
            }
            else
            {
                var resp = req.CreateResponse(HttpStatusCode.BadRequest);
                await resp.WriteStringAsync("Provide either imageDataUrl or base64 (and optional mime).");
                return resp;
            }

            // Build OpenAI Responses API request
            var payload = BuildOpenAiPayload(imageDataUrl);

            using var httpReq = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/responses");
            httpReq.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            httpReq.Content = new StringContent(payload, Encoding.UTF8, "application/json");

            using var httpResp = await _http.SendAsync(httpReq);
            var openAiJson = await httpResp.Content.ReadAsStringAsync();

            if (!httpResp.IsSuccessStatusCode)
            {
                _logger.LogError("OpenAI error: {Status} {Body}", (int)httpResp.StatusCode, openAiJson);
                var resp = req.CreateResponse(HttpStatusCode.BadGateway);
                await resp.WriteStringAsync("Upstream OpenAI request failed.");
                return resp;
            }

            // Parse OpenAI response -> extract the model's JSON output
            // Responses API typically returns "output" with message content parts.
            // We'll safely search for the first "output_text" / JSON string.
            var extractedJson = TryExtractJsonFromResponsesApi(openAiJson);
            if (extractedJson is null)
            {
                _logger.LogError("Could not extract JSON from OpenAI response: {Body}", openAiJson);
                var resp = req.CreateResponse(HttpStatusCode.BadGateway);
                await resp.WriteStringAsync("Failed to parse model output.");
                return resp;
            }

            // Validate/deserialize to our schema
            GiftCardMetadata? metadata;
            try
            {
                metadata = JsonSerializer.Deserialize<GiftCardMetadata>(extractedJson, JsonOptions);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "JSON schema mismatch. Extracted: {Extracted}", extractedJson);
                var resp = req.CreateResponse(HttpStatusCode.BadGateway);
                await resp.WriteStringAsync("Model returned invalid schema.");
                return resp;
            }

            // Return result
            var ok = req.CreateResponse(HttpStatusCode.OK);
            ok.Headers.Add("Content-Type", "application/json");
            await ok.WriteStringAsync(JsonSerializer.Serialize(metadata, JsonOptions));
            return ok;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled error in ExtractGiftCardMetadata");
            var resp = req.CreateResponse(HttpStatusCode.InternalServerError);
            await resp.WriteStringAsync("Server error.");
            return resp;
        }
    }

    private static string BuildOpenAiPayload(string imageDataUrl)
    {
        // JSON Schema for the response format (similar to your Zod schema)
        var schema = new
        {
            name = "gift_card_metadata",
            schema = new
            {
                type = "object",
                additionalProperties = false,
                properties = new
                {
                    from = new { type = new[] { "string", "null" } },
                    store = new { type = new[] { "string", "null" } },
                    amount = new
                    {
                        type = "object",
                        additionalProperties = false,
                        properties = new
                        {
                            value = new { type = new[] { "number", "null" } },
                            currency = new { type = new[] { "string", "null" } }
                        },
                        required = new[] { "value", "currency" }
                    },
                    expiresOn = new { type = new[] { "string", "null" }, description = "YYYY-MM-DD" },
                    title = new { type = new[] { "string", "null" } }
                },
                required = new[] { "from", "store", "amount", "expiresOn", "title" }
            }
        };

        var payload = new
        {
            model = "gpt-4.1-mini",
            input = new object[]
            {
                new {
                    role = "system",
                    content =
@"You extract metadata from gift card images.

Rules:
- Do NOT guess. If information is not clearly visible, return null.
- ""from"" means who the gift card is from (person or company).
- ""store"" is the brand or shop the card is for.
- ""amount.value"" must be numeric.
- ""amount.currency"" must be an ISO currency code (USD, EUR, DKK, etc.) if visible.
- ""expiresOn"" must be an ISO date (YYYY-MM-DD) if shown.
- ""title"" is one you create summarizing the gift card (e.g., ""Amazon $50 Gift Card"")."
                },
                new {
                    role = "user",
                    content = new object[]
                    {
                        new { type = "input_text", text =
@"Extract:
- who the gift card is from
- the gift card amount
- the store/brand
- the expiration date"
                        },
                        new { type = "input_image", image_url = imageDataUrl, detail = "high" }
                    }
                }
            },
            text = new
            {
                // Responses API supports structured outputs via json_schema
                format = new
                {
                    type = "json_schema",
                    json_schema = schema
                }
            }
        };

        return JsonSerializer.Serialize(payload, JsonOptions);
    }

    private static string? TryExtractJsonFromResponsesApi(string openAiJson)
    {
        try
        {
            using var doc = JsonDocument.Parse(openAiJson);

            // Common patterns:
            // - doc.root.output[*].content[*].text (type: "output_text")
            // We'll find the first string-ish text and assume it's JSON.
            if (!doc.RootElement.TryGetProperty("output", out var outputArr) || outputArr.ValueKind != JsonValueKind.Array)
                return null;

            foreach (var outputItem in outputArr.EnumerateArray())
            {
                if (!outputItem.TryGetProperty("content", out var contentArr) || contentArr.ValueKind != JsonValueKind.Array)
                    continue;

                foreach (var contentItem in contentArr.EnumerateArray())
                {
                    // Typically: { "type": "output_text", "text": "...." }
                    if (contentItem.TryGetProperty("text", out var textEl) && textEl.ValueKind == JsonValueKind.String)
                    {
                        var text = textEl.GetString();
                        if (string.IsNullOrWhiteSpace(text)) continue;

                        // Basic heuristic: must look like JSON object
                        text = text.Trim();
                        if (text.StartsWith("{") && text.EndsWith("}"))
                            return text;
                    }
                }
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
    };

    // Request DTO
    private sealed class ExtractRequest
    {
        [JsonPropertyName("imageDataUrl")]
        public string? ImageDataUrl { get; set; }

        [JsonPropertyName("base64")]
        public string? Base64 { get; set; }

        [JsonPropertyName("mime")]
        public string? Mime { get; set; } // e.g. "image/png"
    }

    // Response DTO (matches your Zod schema)
    public sealed class GiftCardMetadata
    {
        [JsonPropertyName("from")]
        public string? From { get; set; }

        [JsonPropertyName("store")]
        public string? Store { get; set; }

        [JsonPropertyName("amount")]
        public Amount Amount { get; set; } = new();

        [JsonPropertyName("expiresOn")]
        public string? ExpiresOn { get; set; } // YYYY-MM-DD or null

        [JsonPropertyName("title")]
        public string? Title { get; set; }
    }

    public sealed class Amount
    {
        [JsonPropertyName("value")]
        public double? Value { get; set; }

        [JsonPropertyName("currency")]
        public string? Currency { get; set; }
    }
}
