const { app, trigger } = require("@azure/functions");
const { BlobServiceClient } = require("@azure/storage-blob");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const fs = require("fs");
const os = require("os");
const path = require("path");

ffmpeg.setFfmpegPath(ffmpegPath);

app.storageBlob("generateThumbnail", trigger.storageBlob({
    path: "videos/{name}",
    connection: "AzureWebJobsStorage"
}), async (blob, context) => {
    const fileName = context.triggerMetadata.name;
    context.log("Thumbnail generation started for:", fileName);

    try {
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, fileName);
        const thumbPath = path.join(tempDir, `${fileName}-thumb.png`);

        // write blob to temp
        fs.writeFileSync(inputPath, Buffer.from(blob));

        // generate thumbnail
        await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
                .screenshots({
                    count: 1,
                    filename: `${fileName}-thumb.png`,
                    folder: tempDir
                })
                .on("end", resolve)
                .on("error", reject);
        });

        // upload thumbnail
        const blobService = BlobServiceClient.fromConnectionString(process.env.STORAGE_CONNECTION);
        const container = blobService.getContainerClient("thumbnails");
        await container.createIfNotExists();
        const thumbBlob = container.getBlockBlobClient(`${fileName}-thumb.png`);

        await thumbBlob.uploadFile(thumbPath);

        context.log("Thumbnail uploaded:", `${fileName}-thumb.png`);
    } catch (err) {
        context.log("Thumbnail Error:", err.message);
    }
});
