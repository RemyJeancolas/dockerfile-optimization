// Start New Relic plugin if needed
if (process.env.NEW_RELIC_ENABLED === 'true' && process.env.NODE_ENV !== undefined && process.env.NODE_ENV.match(/test/) === null) {
    require('newrelic'); // tslint:disable-line:no-var-requires
}

import { App } from './App';

const app = new App();
app.start(8080);
