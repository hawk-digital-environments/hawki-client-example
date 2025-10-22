import {getHawkiClient} from '../bootstrap/handleHawkiClientCreation.js';
import {setAppContent} from '../utils.js';
import {autocompleteField} from '../components/autocompleteField.js';

export function roomMembersPage(goTo, params) {
    const client = getHawkiClient();
    const {roomSlug} = params;

    /**
     * @param {Room} room
     * @param {Member[]} members
     */
    function renderList(room, members) {
        function renderTemplate() {
            const tpl = document.createElement('div');
            tpl.innerHTML = `
                <div>
                    <button id="back-button">&larr; Back to Room Details</button>
                </div>
                <h2>Members of Room ${room.name}</h2>
                <div id="members-container"></div>
                <div id="invitation-container" style="margin-top: 20px;"></div>
            `;
            tpl.querySelector('#back-button').addEventListener('click', () => {
                goTo('room-details', {roomSlug: room.slug});
            });
            return tpl;
        }

        function renderMemberList(members) {
            const container = document.createElement('div');
            if (members.length === 0) {
                container.textContent = 'No members in this room.';
                return container;
            }

            function renderChangeRoleSelectForm(member) {
                const form = document.createElement('form');
                form.innerHTML = `
                    <select name="role" class="role-select">
                        <option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option>
                        <option value="editor" ${member.role === 'editor' ? 'selected' : ''}>Editor</option>
                        <option value="viewer" ${member.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                    </select>
                `;
                form.querySelector('select').addEventListener('change', async (e) => {
                    const newRole = e.target.value;
                    if (!member.user.isMe || confirm('Are you sure you want to change your own role? You might lose access to this room.')) {
                        client.rooms.members.update(room, member, newRole).catch(err => {
                            console.error('Error changing role:', err);
                            alert(`Error changing role: ${err.message}`);
                        });
                    }
                });
                return form;
            }

            function renderRemoveOrLeaveButton(member) {
                const button = document.createElement('button');
                if (member.user.isMe) {
                    button.textContent = 'Leave Room';
                    button.className = 'leave-button';
                    button.addEventListener('click', () => {
                        if (confirm('Are you sure you want to leave this room?')) {
                            client.rooms.leave(room).catch(err => {
                                console.error('Error leaving room:', err);
                                alert(`Error leaving room: ${err.message}`);
                            });
                        }
                    });
                } else {
                    button.textContent = 'Remove';
                    button.className = 'remove-button';
                    button.addEventListener('click', () => {
                        if (confirm(`Are you sure you want to remove ${member.user.displayName} from this room?`)) {
                            client.rooms.members.remove(room, member).catch(err => {
                                console.error('Error removing member:', err);
                                alert(`Error removing member: ${err.message}`);
                            });
                        }
                    });
                }
                return button;
            }

            const list = document.createElement('ul');
            members.forEach(member => {
                if (member.user.isAi || member.user.isRemoved) {
                    return;
                }

                const meLabel = member.user.isMe ? ' (You)' : '';
                const listItem = document.createElement('li');
                listItem.style.display = 'flex';
                listItem.style.gap = '10px';

                listItem.innerHTML = `
<div class="name-and-role">
    ${member.user.displayName}${meLabel} 
    <span class="role-label">(${member.role})</span>
</div>
<div class="actions" style="display: flex; gap: 5px"></div>
                `;

                listItem.querySelector('.actions').append(
                    renderChangeRoleSelectForm(member),
                    renderRemoveOrLeaveButton(member)
                );

                list.appendChild(listItem);
            });
            container.appendChild(list);

            return container;
        }

        function renderInvitationForm() {
            const container = document.createElement('div');
            container.innerHTML = `
                <h3>Invite New Member</h3>
                <form id="invite-form"></form>
            `;

            let newUserRole = 'viewer';

            const autocomplete = autocompleteField(
                'Invite new users',
                'invite',
                async (query, onCancelled) => {
                    const abort = new AbortController();
                    onCancelled(() => abort.abort());

                    try {
                        return await client.rooms.members.getInviteOptions(
                            room,
                            query,
                            abort
                        );
                    } catch (err) {
                        return [];
                    }
                },
                (selected) => {
                    selected.invite(newUserRole);
                },
                'displayName'
            );

            function renderRoleSelect() {
                const select = document.createElement('select');
                select.name = 'role';
                select.innerHTML = `
                    <option value="viewer">Viewer</option>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                `;

                select.addEventListener('change', (e) => {
                    newUserRole = e.target.value;
                });
                return select;
            }

            container.querySelector('#invite-form').appendChild(renderRoleSelect());
            container.querySelector('#invite-form').appendChild(autocomplete);

            return container;
        }

        const tpl = renderTemplate();
        tpl.querySelector('#members-container').replaceChildren(renderMemberList(members));
        tpl.querySelector('#invitation-container').replaceChildren(renderInvitationForm());

        setAppContent(tpl);
    }

    let innerCleanups = [];
    return client.rooms.one(roomSlug).subscribe(async room => {
        innerCleanups.forEach(cleanup => cleanup());
        if (!room) {
            goTo('home');
            return;
        }

        innerCleanups.push(client.rooms.members.list(room)
            .derive(
                'guarded',
                (members, isAdmin) => isAdmin ? members : null,
                [client.rooms.members.meIs(room, 'admin')]
            )
            .subscribe((members) => {
                if (!members) {
                    goTo('room', {roomSlug: room.slug});
                    return;
                }
                renderList(room, members);
            }));
    });
}
