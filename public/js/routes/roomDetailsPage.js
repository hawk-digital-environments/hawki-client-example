import {getHawkiClient} from '../bootstrap/handleHawkiClientCreation.js';
import {avatarField} from '../components/avatarField.js';
import {setAppContent} from '../utils.js';

export function roomDetailsPage(goTo, params) {
    const client = getHawkiClient();
    const {roomSlug} = params;

    /**
     *
     * @param {Room} room
     */
    function renderForm(room) {
        function renderTemplate() {
            const tpl = document.createElement('div');
            tpl.innerHTML = `
            <div>
                <button id="back-button">&larr; Back to Room</button>
                <button id="members-button">Manage Members</button>
            </div>
            <div id="form-container"></div>
            <div id="danger-zone" style="margin-top: 20px; padding: 10px; border: 1px solid red; background-color: #ffe6e6;">
                <h3 style="color: red;">Danger Zone</h3>
                <p>Deleting this room is irreversible. All messages and data associated with this room will be permanently lost.</p>
                <button id="delete-room-button" style="background-color: red; color: white; padding: 5px 10px; cursor: pointer;">Delete Room</button>
            </div>
            `;
            tpl.querySelector('#back-button').addEventListener('click', () => {
                goTo('room', {roomSlug: room.slug});
            });
            tpl.querySelector('#members-button').addEventListener('click', () => {
                goTo('room-members', {roomSlug: room.slug});
            });
            tpl.querySelector('#delete-room-button').addEventListener('click', async () => {
                if (confirm(`Are you sure you want to delete the room "${room.name}"? This action cannot be undone.`)) {
                    await client.rooms.remove(room);
                    goTo('home');
                }
            });

            const form = document.createElement('form');
            form.innerHTML = `
                <h2>Edit Room ${room.name}</h2>
                <div id="avatar-field" style="margin-bottom: 10px;"></div>
                <div id="name-field"></div>
                <div id="description-field"></div>
                <div id="system-prompt-field"></div>
    
                <input type="submit" value="Save Changes" style="padding: 5px 10px; cursor: pointer;">
            `;
            form.addEventListener('submit', (e) => {
                console.warn('Submitting form to update room:', room.slug);
                e.preventDefault();

                const name = form.querySelector('#name-input').value.trim();
                const description = form.querySelector('#description-input').value.trim();
                const systemPrompt = form.querySelector('#system-prompt-input').value.trim();

                if (!name) {
                    alert('Room name cannot be empty.');
                    return;
                }

                client.rooms.update(room, {name, description, systemPrompt}).then(() => {
                    alert('Room updated successfully.');
                    goTo('room', {roomSlug: room.slug});
                }).catch(err => {
                    console.error('Error updating room:', err);
                    alert(`Error updating room: ${err.message}`);
                });
            });

            tpl.querySelector('#form-container').appendChild(form);

            return tpl;
        }

        function renderAvatarField() {
            return avatarField(
                client,
                room.avatar,
                file => client.rooms.setAvatar(room, file)
            );
        }

        function renderNameField() {
            const fieldContainer = document.createElement('div');
            fieldContainer.style.marginBottom = '10px';
            fieldContainer.innerHTML = `
                <label for="name-input">Room Name:</label><br>
                <input type="text" id="name-input" value="${room.name}" style="width: 300px; padding: 5px;">
            `;
            return fieldContainer;
        }

        function renderDescriptionField() {
            const fieldContainer = document.createElement('div');
            fieldContainer.style.marginBottom = '10px';
            fieldContainer.innerHTML = `
                <label for="description-input">Description:</label><br>
                <textarea id="description-input" style="width: 300px; height: 60px; padding: 5px;">${room.description || ''}</textarea>
            `;
            return fieldContainer;
        }

        function renderSystemPromptField() {
            const fieldContainer = document.createElement('div');
            fieldContainer.style.marginBottom = '10px';
            fieldContainer.innerHTML = `
                <label for="system-prompt-input">System Prompt:</label><br>
                <textarea id="system-prompt-input" style="width: 300px; height: 60px; padding: 5px;">${room.systemPrompt || ''}</textarea>
            `;
            return fieldContainer;
        }

        const tpl = renderTemplate();
        tpl.querySelector('#form-container').querySelector('#avatar-field').appendChild(renderAvatarField());
        tpl.querySelector('#form-container').querySelector('#name-field').replaceWith(renderNameField());
        tpl.querySelector('#form-container').querySelector('#description-field').replaceWith(renderDescriptionField());
        tpl.querySelector('#form-container').querySelector('#system-prompt-field').replaceWith(renderSystemPromptField());

        setAppContent(tpl);
    }

    return client.rooms.one(roomSlug).subscribe(async room => {
        if (!room) {
            goTo('home');
            return;
        }

        if (!await client.rooms.members.meIs(room, 'admin').getAsyncAsserted()) {
            goTo('room', {roomSlug: room.slug});
            return;
        }

        renderForm(room);
    });
}
