import {setAppContent} from '../utils.js';
import {getHawkiClient} from '../bootstrap/handleHawkiClientCreation.js';

export function listPage(goTo) {
    const client = getHawkiClient();

    async function renderCurrentUserAndLogout() {
        const currentUser = await client.profile.me().getAsync();
        const container = document.createElement('div');
        container.style.marginBottom = '20px';
        container.innerHTML = `
            <div>
                Logged in as: <strong>${currentUser.displayName} (${currentUser.username})</strong>
                <button id="profile-button">Your profile</button>
                <button id="logout-button">Logout</button>
                <button id="resync-button">Force sync</button>
            </div>
        `;

        container.querySelector('#profile-button').addEventListener('click', () => {
            goTo('profile');
        });

        container.querySelector('#logout-button').addEventListener('click', async () => {
            await fetch('/logout');
            let clear = false;
            if (confirm('Do you want to clear local storage as well? This will remove all locally stored data.')) {
                clear = true;
            }
            await client.disconnect(clear);
            window.location.reload();
        });

        container.querySelector('#resync-button').addEventListener('click', async () => {
            await client.sync.all(true);
        });

        return container;
    }

    function renderTemplate() {
        const roomListApp = document.createElement('div');
        roomListApp.innerHTML = `
            <div id="current-user-container"></div>
            <div id="room-list">
                <h3>Available Rooms</h3>
                <div id="actions">
        
                </div>
                <div id="rooms">
        
                </div>
            </div>`;
        return roomListApp;
    }

    function renderCreateRoomButton() {
        const createRoomButton = document.createElement('button');
        createRoomButton.textContent = 'Create New Room';
        createRoomButton.addEventListener('click', async () => {
            const roomName = prompt('Enter room name:');
            if (roomName) {
                try {
                    const newRoom = await client.rooms.create({name: roomName});
                    console.log('Created new room:', newRoom);
                } catch (e) {
                    console.error('Error creating room:', e);
                    alert(`Error creating room: ${e.message}`);
                }
            }
        });
        return createRoomButton;
    }

    async function renderRooms(rooms) {
        function renderRoomInfo(room) {
            const roomInfoElement = document.createElement('div');
            roomInfoElement.textContent = `Room: ${room.name} (Slug: ${room.slug})`;
            return roomInfoElement;
        }

        function renderEnterRoomButton(room) {
            const roomButton = document.createElement('button');
            roomButton.textContent = `Open room: ${room.name}`;
            roomButton.addEventListener('click', async () => {
                goTo('room', {roomSlug: room.slug});
            });
            return roomButton;
        }

        async function renderRoomUnreadCount(room) {
            const unreadMessagesElement = document.createElement('div');
            try {
                const [unreadCount, totalCount] = await Promise.all([
                    (async () => (await client.rooms.messages.countUnread(room).getAsync()) ?? 0)(),
                    (async () => (await client.rooms.messages.count(room).getAsync()) ?? 0)()
                ]);
                unreadMessagesElement.textContent = `Unread Messages: ${unreadCount}/${totalCount}`;
                return unreadMessagesElement;
            } catch (e) {
                unreadMessagesElement.textContent = `Error fetching unread count: ${e.message}`;
                return unreadMessagesElement;
            }
        }

        async function renderRoomMembers(room) {
            const roomMemberElement = document.createElement('ul');
            try {
                const members = await client.rooms.members.list(room).getAsync();
                for (const member of members) {
                    const memberElement = document.createElement('li');
                    memberElement.textContent = `${member.user.displayName} (${member.user.username})`;
                    roomMemberElement.appendChild(memberElement);
                }
                return roomMemberElement;
            } catch (e) {
                roomMemberElement.textContent = `Error fetching members: ${e.message}`;
                return roomMemberElement;
            }
        }

        async function renderLastMessage(room) {
            const lastMessageElement = document.createElement('div');

            try {
                const lastMessage = await client.rooms.messages.lastMessage(room).getAsync();
                if (lastMessage) {
                    lastMessageElement.textContent = `Last Message: ${lastMessage.content} (by ${lastMessage.author.user.displayName})`;
                } else {
                    lastMessageElement.textContent = 'No messages yet.';
                }
                return lastMessageElement;
            } catch (e) {
                lastMessageElement.textContent = `Error fetching last message: ${e.message}`;
                return lastMessageElement;
            }
        }

        const roomListEl = document.createElement('ul');

        async function renderRoom(room) {
            const roomElement = document.createElement('li');
            roomElement.appendChild(renderRoomInfo(room));
            roomElement.appendChild(renderEnterRoomButton(room));
            roomElement.appendChild(await renderRoomUnreadCount(room));
            roomElement.appendChild(await renderLastMessage(room));
            roomElement.appendChild(await renderRoomMembers(room));
            return roomElement;
        }

        const renderedRoomPromises = rooms.map(room => renderRoom(room));
        (await Promise.all(renderedRoomPromises)).map(el => roomListEl.appendChild(el));

        return roomListEl;
    }

    const appTpl = renderTemplate();
    const currentUser = appTpl.querySelector('#current-user-container');
    const appActions = appTpl.querySelector('#actions');
    const appRooms = appTpl.querySelector('#rooms');

    renderCurrentUserAndLogout().then(el => currentUser.appendChild(el));
    appActions.appendChild(renderCreateRoomButton());

    let roomListRenderId = 0;

    setAppContent(appTpl);

    return client.rooms.list().store().subscribe(async (rooms) => {
        const currentRenderId = ++roomListRenderId;

        const roomEl = await renderRooms(rooms);
        if (currentRenderId !== roomListRenderId) {
            // A newer render is in progress, discard this one
            return;
        }
        appRooms.replaceChildren(roomEl);
    });
}
