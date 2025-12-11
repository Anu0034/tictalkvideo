const { app } = require('@azure/functions');
const { BlobServiceClient } = require('@azure/storage-blob');

app.http('uploadVideo', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {

        try {
            context.log('Upload request received');

            let buffer;
            // 1️⃣ Read video file from request
            try {
                const formData = await request.formData();
                context.log('FormData parsed successfully');
                const file = formData.get('video');
                if (!file) {
                    context.log('No video file in formData');
                    return {
                        status: 400,
                        body: "No video file provided"
                    };
                }
                context.log(`File received: ${file.name || 'unnamed'}, size: ${file.size}`);
                const arrayBuffer = await file.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
            } catch (formErr) {
                context.log('FormData failed, trying direct arrayBuffer', formErr.message);
                const arrayBuffer = await request.arrayBuffer();
                buffer = Buffer.from(arrayBuffer);
                context.log(`Direct buffer created, size: ${buffer.length}`);
            }

            if (!buffer || buffer.length === 0) {
                context.log('No data received');
                return {
                    status: 400,
                    body: "No video data provided"
                };
            }

            // Generate a unique file name
            const fileName = `video-${Date.now()}.mp4`;
            context.log(`Generated filename: ${fileName}`);

            // 2️⃣ Connect to Azure Storage
            const connectionString = process.env.STORAGE_CONNECTION;
            if (!connectionString) {
                context.log('STORAGE_CONNECTION environment variable is not set');
                return {
                    status: 500,
                    body: 'Storage connection not configured'
                };
            }
            context.log('Creating BlobServiceClient');
            const blobService = BlobServiceClient.fromConnectionString(connectionString);

            // 3️⃣ Upload to "videos" container
            context.log('Getting container client for videos');
            const container = blobService.getContainerClient("videos");
            context.log('Creating container if not exists');
            await container.createIfNotExists();
            context.log('Container created');
            const blob = container.getBlockBlobClient(fileName);
            context.log(`Uploading to blob: ${fileName}`);
            await blob.uploadData(buffer);
            context.log('Upload successful');

            return {
                status: 200,
                jsonBody: {
                    message: "Video uploaded successfully!",
                    fileName,
                    url: blob.url
                }
            };

        } catch (err) {
            context.log(err);
            return {
                status: 500,
                body: "Error uploading video"
            };
        }
    }
});
