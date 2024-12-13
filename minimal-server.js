import express from 'express';
const app = express();
const port = 3002;

app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>Simple Test</title>
            </head>
            <body>
                <h1>Hello from Minimal Server!</h1>
                <p>This is a test page.</p>
            </body>
        </html>
    `);
});

const server = app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
});
