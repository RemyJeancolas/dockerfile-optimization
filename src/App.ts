import * as restify from 'restify';

export class App {
    protected server: restify.Server;

    constructor() {
        // Init the server
        this.initServer();
    }

    private initServer(): void {
        // Create a basic restify server
        this.server = restify.createServer();

        // Add a middleware to log requests
        this.server.use((req, res, next) => {
            (<any> req)._start = Date.now();
            next();
        });

        // Add a request handler for the home page
        this.server.get('/', (req, res, next) => {
            res.send('Hello world !');
            next();
        });

        this.server.on('after', (req, res) => {
            const duration = typeof (<any> req)._start === 'number' ? Date.now() - (<any> req._start) : 0;
            // tslint:disable-next-line:no-console
            console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
        });
    }

    public start(port: number): void {
        // Start the server
        this.server.listen(port, () => {
            // tslint:disable-next-line:no-console
            console.log(`Server started on port ${port}`);
        });
    }
}
