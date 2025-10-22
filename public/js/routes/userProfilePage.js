import {setAppContent} from '../utils.js';
import {getHawkiClient} from '../bootstrap/handleHawkiClientCreation.js';
import {avatarField} from '../components/avatarField.js';

export function userProfilePage(goTo) {
    const client = getHawkiClient();

    async function renderForm(currentUser) {
        function renderTemplate() {
            const tpl = document.createElement('div');
            tpl.innerHTML = `
            <div>
                <button id="back-button">&larr; Back to Room List</button>
            </div>
            <div id="form-container"></div>
            `;
            tpl.querySelector('#back-button').addEventListener('click', () => {
                goTo('home');
            });

            const form = document.createElement('form');
            form.innerHTML = `
                <h2>User Profile</h2>
                <div id="avatar-field" style="margin-bottom: 10px;"></div>
                <div id="display-name-field"></div>
                <div id="bio-field"></div>
                <input type="submit" value="Save Changes" style="padding: 5px 10px; cursor: pointer;">
            `;
            form.addEventListener('submit', (e) => {
                e.preventDefault();

                const displayName = form.querySelector('#display-name-input').value.trim();
                const bio = form.querySelector('#bio-input').value.trim();

                if (!displayName) {
                    alert('Display name cannot be empty.');
                    return;
                }

                client.profile.update({displayName, bio}).then(() => {
                    alert('Profile updated successfully.');
                }).catch(err => {
                    console.error('Error updating profile:', err);
                    alert(`Error updating profile: ${err.message}`);
                });
            });

            tpl.querySelector('#form-container').appendChild(form);

            return tpl;
        }

        function renderAvatarField() {
            return avatarField(
                client,
                currentUser.avatar,
                file => client.profile.setAvatar(file)
            );
        }

        function renderDisplayNameField() {
            const fieldContainer = document.createElement('div');
            fieldContainer.style.marginBottom = '10px';
            fieldContainer.innerHTML = `
                <label for="display-name-input">Display Name:</label>
                <input type="text" id="display-name-input" value="${currentUser.displayName}" style="margin-left: 10px; padding: 5px; width: 200px;">
            `;

            return fieldContainer;
        }

        function renderBioField() {
            const fieldContainer = document.createElement('div');
            fieldContainer.style.marginBottom = '10px';
            fieldContainer.innerHTML = `
                <label for="bio-input">Bio:</label><br>
                <textarea id="bio-input" style="margin-top: 5px; padding: 5px; width: 300px; height: 100px;">${currentUser.bio || ''}</textarea>
            `;

            return fieldContainer;
        }

        const tpl = renderTemplate();
        tpl.querySelector('#avatar-field').replaceWith(renderAvatarField());
        tpl.querySelector('#display-name-field').replaceWith(renderDisplayNameField());
        tpl.querySelector('#bio-field').replaceWith(renderBioField());

        setAppContent(tpl);
    }

    return client.profile.me().subscribe(currentUser => {
        if (!currentUser) {
            goTo('home');
            return;
        }

        renderForm(currentUser);
    });
}
