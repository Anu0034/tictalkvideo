const fs = require('fs');
const path = require('path');

// Test script to upload a file
const filePath = path.join(__dirname, 'test.mp4');
const fileBuffer = fs.readFileSync(filePath);

const url = 'http://localhost:7072/api/uploadVideo';

fetch(url, {
    method: 'POST',
    body: fileBuffer,
    headers: {
        'Content-Type': 'application/octet-stream'
    }
})
.then(response => {
    console.log(`Status: ${response.status}`);
    return response.text();
})
.then(data => {
    console.log(data);
})
.catch(err => {
    console.error(err);
});
