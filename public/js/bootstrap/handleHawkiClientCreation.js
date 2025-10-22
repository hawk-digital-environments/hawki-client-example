import {createDebugLogger, createHawkiClient} from '/frontend/hawki-client.js';
import {setAppContent, showAlert} from '../utils.js';

let client = null;

export async function handleHawkiClientCreation() {
    function renderConnectRequest(connectionUrl) {
        const container = document.createElement('div');
        container.innerHTML = `
            <p>Hey, if you want to chat using HAWKI you must connect your account first.
                To do this, click on the link below, log into hawki and accept the connection request.</p>
            <a href="#" id="connect-button">Click here to connect to HAWKI</a>
        `;
        container.querySelector('#connect-button').setAttribute('href', connectionUrl);
        setAppContent(container);
        return new Promise(() => void 0);
    }

    client = await createHawkiClient({
        type: 'external',
        logger: createDebugLogger(),
        clientConfigUrl: '/hawki-client-config',
        onConnectionRequired: async connectionUrl => renderConnectRequest(connectionUrl)
    });

    client.connected.subscribe(isConnected => {
        if (isConnected) {
            return;
        }

        setTimeout(() => {
            showAlert('warning', 'Connection to HAWKI lost. Please reload the page.');
        }, 200);
    });

    // await client.sync.all(true);
}

/**
 * Get the initialized Hawki client.
 * @return {HawkiClient}
 */
export function getHawkiClient() {
    if (client === null) {
        throw new Error('Hawki client not initialized yet');
    }

    return client;
}
