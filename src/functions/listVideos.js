const { BlobServiceClient } = require("@azure/storage-blob");
const { app } = require("@azure/functions");

app.http("listVideos", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
    const conn = process.env.STORAGE_CONNECTION;
      context.log("STORAGE_CONN =", conn ? "LOADED" : "NOT LOADED");

      const blobService = BlobServiceClient.fromConnectionString(conn);
      const container = blobService.getContainerClient("videos");

      let results = [];
      for await (const blob of container.listBlobsFlat()) {
        results.push({
          name: blob.name,
          url: `${container.url}/${blob.name}`,
        });
      }

      return {
        status: 200,
        jsonBody: results,
      };
    } catch (error) {
      context.log("🔥 ERROR inside listVideos:", error.message);
      context.log(error.stack);
      return {
        status: 500,
        jsonBody: { error: error.message },
      };
    }
  },
});
