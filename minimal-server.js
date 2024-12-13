const express = require('express');
const app = express();
const port = 3000;

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
