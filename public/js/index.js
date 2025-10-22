import {createRouter} from './router.js';
import {listPage} from './routes/listPage.js';
import {handleLocalLogin} from './bootstrap/handleLocalLogin.js';
import {handleHawkiClientCreation} from './bootstrap/handleHawkiClientCreation.js';
import {showAlert} from './utils.js';
import {roomPage} from './routes/roomPage.js';
import {roomDetailsPage} from './routes/roomDetailsPage.js';
import {userProfilePage} from './routes/userProfilePage.js';
import {roomMembersPage} from './routes/roomMembersPage.js';

const router = createRouter([
        {
            name: 'home',
            path: '/',
            handle: listPage
        },
        {
            name: 'profile',
            path: '/profile',
            handle: userProfilePage
        },
        {
            name: 'room',
            path: '/room/:roomSlug',
            handle: roomPage
        },
        {
            name: 'room-details',
            path: '/room/:roomSlug/details',
            handle: roomDetailsPage
        },
        {
            name: 'room-members',
            path: '/room/:roomSlug/members',
            handle: roomMembersPage
        },
        {
            name: 'thread',
            path: '/room/:roomSlug/thread/:threadId',
            handle: roomPage
        }
    ],
    showAlert
);

try {
    await handleLocalLogin(router.goTo);
    await handleHawkiClientCreation();
    router.route();
} catch (e) {
    console.error('Initialization error', e);
    showAlert('error', `Initialization error: ${e.message}`);
}
