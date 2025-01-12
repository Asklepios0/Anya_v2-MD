const cluster = require('cluster');
const path = require('path');
const fs = require('fs');

var isRunning = false;

/**
 * Start a js file
 * @param {String} file `path/to/file`
 */
function start(file) {
    if (isRunning) return;
    isRunning = true;

    // Port tanımlaması
    const PORT = process.env.PORT || 8000;
    console.log(`Application is running on port ${PORT}`);

    let args = [
        path.join(__dirname, file),
        ...process.argv.slice(2)
    ];

    cluster.setupMaster({
        exec: path.join(__dirname, file),
        args: args.slice(1),
    });

    let p = cluster.fork();
    p.on('message', data => {
        console.log('[RECEIVED]', data);
        switch (data) {
            case 'reset':
                p.kill();
                isRunning = false;
                start.apply(this, arguments);
                break;
            case 'uptime':
                p.send(process.uptime());
                break;
        }
    });

    p.on('exit', code => {
        isRunning = false;
        console.error('Exited with code:', code);
        if (code === 0) return;

        fs.watchFile(args[0], () => {
            fs.unwatchFile(args[0]);
            start(file);
        });
    });
}

// Start uygulaması
start('./index.js');
