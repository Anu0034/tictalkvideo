// Load environment variables
window.process = { env: {} };

fetch('.env')
    .then(response => response.text())
    .then(text => {
        const lines = text.split('\n');
        lines.forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key && valueParts.length) {
                    const value = valueParts.join('=');
                    window.process.env[key] = value;
                }
            }
        });
        // Signal that env is loaded (optional)
        window.envLoaded = true;
    })
    .catch(() => {
        // Fallback if .env not found or error
        window.process.env = { API_BASE: 'http://localhost:7072/api' };
        window.envLoaded = true;
    });
