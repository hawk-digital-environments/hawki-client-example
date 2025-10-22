import {getHawkiClient} from '../bootstrap/handleHawkiClientCreation.js';
import {setAppContent} from '../utils.js';

export function roomPage(goTo, params) {
    const client = getHawkiClient();
    const cleanupQueue = new Set();

    const {
        roomSlug,
        threadId: threadIdParam
    } = params;

    const threadId = (threadIdParam || '').match(/^\d+$/) ? parseInt(threadIdParam, 10) : undefined;

    function renderRoom(room, canPost) {
        function renderRoomTemplate() {
            const roomApp = document.createElement('div');
            roomApp.innerHTML = `<div id="room">
    <div id="actions"></div>
    <h3 id="headline">Room:</h3>
    <div id="messages">

    </div>
    <div id="typing" style="display: none">

    </div>
</div>
                `;
            return roomApp;
        }

        function renderRoomName(room) {
            const roomNameEl = document.createElement('span');
            roomNameEl.textContent = `${room.name} (Slug: ${room.slug})`;
            return roomNameEl;
        }

        function renderActions(room) {
            function renderBackToOverviewButton() {
                const backButton = document.createElement('button');
                backButton.innerHTML = '&larr; Back to Room Overview';
                backButton.addEventListener('click', () => goTo('home'));
                return backButton;
            }

            function renderRoomDetailsButton() {
                const detailsButton = document.createElement('button');
                detailsButton.style.display = 'none'; // Hidden by default, shown if user is admin
                detailsButton.textContent = 'Room Details';
                detailsButton.addEventListener('click', () => {
                    goTo('room-details', {roomSlug: room.slug});
                });

                cleanupQueue.add(client.rooms.members.meIs(room, 'admin').subscribe(isAdmin => {
                    detailsButton.style.display = isAdmin ? 'inline-block' : 'none';
                }));

                return detailsButton;
            }

            function renderLeaveRoomButton() {
                const leaveButton = document.createElement('button');
                leaveButton.textContent = 'Leave Room';
                leaveButton.addEventListener('click', async () => {
                    if (confirm(`Are you sure you want to leave the room "${room.name}"?`)) {
                        try {
                            await client.rooms.leave(room);
                            goTo('home');
                        } catch (e) {
                            console.error('Error leaving room:', e);
                            alert(`Error leaving room: ${e.message}`);
                        }
                    }
                });
                return leaveButton;
            }

            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.gap = '0.5em';
            actions.appendChild(renderBackToOverviewButton());
            actions.appendChild(renderRoomDetailsButton());
            actions.appendChild(renderLeaveRoomButton());
            return actions;
        }

        function renderMessages() {
            function setThreadId(newThreadId) {
                if (threadId === newThreadId) {
                    return;
                }
                if (newThreadId) {
                    goTo('thread', {roomSlug: room.slug, threadId: newThreadId});
                } else {
                    goTo('room', {roomSlug: room.slug});
                }
            }

            function renderMessageListTemplate() {
                const tpl = document.createElement('div');
                tpl.innerHTML = `
<div id="message-list">
    <div id="thread-info"></div>
    <ol id="messages"></ol>
    <div id="typing-indicator"></div>
    <div id="input"></div>
</div>`;
                return tpl;
            }

            function renderThreadInfo() {
                const threadInfoEl = document.createElement('div');
                if (threadId) {
                    threadInfoEl.textContent = `Viewing thread: ${threadId}`;
                    const backToMainButton = document.createElement('button');
                    backToMainButton.innerHTML = '&larr; Back to Main Room';
                    backToMainButton.addEventListener('click', () => setThreadId(undefined));
                    threadInfoEl.appendChild(backToMainButton);
                }
                return threadInfoEl;
            }

            function renderMessageList(messages) {
                if (messages.length === 0) {
                    const noMessagesEl = document.createElement('div');
                    noMessagesEl.textContent = 'There are currently no messages to show';
                    return noMessagesEl;
                }

                const messageListEl = document.createElement('ol');

                function renderSingleMessage(message) {
                    function renderSingleMessageTemplate() {
                        const tpl = document.createElement('div');
                        tpl.style.border = '1px solid #ccc';
                        tpl.style.padding = '0.5em';
                        tpl.style.marginBottom = '0.5em';
                        tpl.innerHTML = `<aside id="meta"></aside>
<aside id="auth"></aside>
<nav id="actions"></nav>
<div id="content"></div>
<div id="attachments"></div>
`;
                        return tpl;
                    }

                    function renderMessageMeta() {
                        const metaEl = document.createElement('small');
                        metaEl.textContent = `ID: ${message.id}, Created At: ${new Date(message.createdAt).toLocaleString()}`;
                        const author = document.createElement('strong');
                        author.textContent = `Author: ${message.author.user.displayName} (${message.author.user.username})${message.author.isMe ? ' (me)' : ''}`;
                        if (message.author.user.avatar) {
                            client.files.getImgElement(message.author.user.avatar).then(el => {
                                el.style.width = '1.5em';
                                el.style.height = '1.5em';
                                el.style.objectFit = 'cover';
                                el.style.borderRadius = '50%';
                                author.prepend(el);
                            });
                        }
                        metaEl.prepend(author);
                        if (message.isEdited) {
                            const editedEl = document.createElement('em');
                            editedEl.textContent = ' (edited)';
                            metaEl.appendChild(editedEl);
                        }
                        if (message.isRead) {
                            const readEl = document.createElement('em');
                            readEl.textContent = ' (read)';
                            metaEl.appendChild(readEl);
                        }
                        if (message.ai) {
                            const aiEl = document.createElement('em');
                            aiEl.textContent = ` (AI-generated: ${message.ai.model})`;
                            metaEl.appendChild(aiEl);
                        }
                        return metaEl;
                    }

                    function renderActions() {
                        function renderEditButton() {
                            if (!canPost || !message.author.user.isMe) {
                                return null;
                            }
                            const editButton = document.createElement('button');
                            editButton.textContent = 'Edit';
                            editButton.addEventListener('click', async () => {
                                const newContent = prompt('Edit message:', message.content);
                                if (newContent !== null && newContent.trim() !== '') {
                                    try {
                                        await client.rooms.messages.edit(room, message, newContent);
                                    } catch (e) {
                                        console.error('Error editing message:', e);
                                        alert(`Error editing message: ${e.message}`);
                                    }
                                }
                            });
                            return editButton;
                        }

                        function renderThreadButton() {
                            if (threadId !== undefined) {
                                return null;
                            }
                            if (!canPost && !message.hasThread) {
                                return null;
                            }
                            const label = message.hasThread ? 'View Thread' : 'Create Thread';
                            const threadButton = document.createElement('button');
                            threadButton.textContent = label;
                            threadButton.addEventListener('click', () => setThreadId(message.id));
                            return threadButton;
                        }

                        function renderRefreshAiButton() {
                            if (!message.ai) {
                                return null;
                            }
                            const refreshButton = document.createElement('button');
                            refreshButton.textContent = 'Refresh AI Message';
                            refreshButton.addEventListener('click', async () => {
                                try {
                                    await client.rooms.messages.refreshAiMessage(room, message);
                                } catch (e) {
                                    console.error('Error refreshing AI message:', e);
                                    alert(`Error refreshing AI message: ${e.message}`);
                                }
                            });
                            return refreshButton;
                        }

                        const actions = document.createElement('nav');

                        function appendToActions(button) {
                            if (button) {
                                actions.appendChild(button);
                            }
                        }

                        appendToActions(renderEditButton());
                        appendToActions(renderThreadButton());
                        appendToActions(renderRefreshAiButton());

                        return actions;
                    }

                    function renderContent() {
                        const contentEl = document.createElement('div');
                        contentEl.textContent = message.content;
                        return contentEl;
                    }

                    function renderAttachments() {
                        const attachmentsEl = document.createElement('div');
                        attachmentsEl.textContent = 'Attachments:';
                        const attachmentList = document.createElement('ul');
                        for (const attachment of message.attachments) {
                            /** @type {RoomMessageAttachment}  */
                            attachment;

                            const attachmentEl = document.createElement('li');
                            const download = () => {
                                client.files.download(attachment);
                            };
                            const link = document.createElement('a');
                            link.href = '#';
                            link.textContent = attachment.name;
                            link.addEventListener('click', (e) => {
                                e.preventDefault();
                                download();
                            });
                            attachmentEl.appendChild(link);

                            if (attachment.type === 'image') {
                                client.files.getImgElement(attachment).then(imgEl => {
                                    imgEl.style.maxWidth = '200px';
                                    imgEl.style.display = 'block';
                                    imgEl.style.marginTop = '0.5em';
                                    attachmentEl.appendChild(imgEl);
                                }).catch(e => {
                                    console.error('Error loading image attachment:', e);
                                });
                            }

                            attachmentList.appendChild(attachmentEl);
                        }
                        attachmentsEl.appendChild(attachmentList);
                        return attachmentsEl;
                    }

                    function initializeReadStatusObserver() {
                        if (message.isRead) {
                            return;
                        }
                        const observer = new IntersectionObserver(entries => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    message.isRead = true;
                                    client.rooms.messages.markAsRead(room, message).catch(e => {
                                        console.error('Error marking message as read:', e);
                                    });
                                    observer.unobserve(entry.target);
                                }
                            });
                        });
                        observer.observe(tpl);
                        cleanupQueue.add(() => observer.disconnect());
                    }

                    const tpl = renderSingleMessageTemplate();
                    tpl.querySelector('#meta').replaceChildren(renderMessageMeta());
                    tpl.querySelector('#actions').replaceChildren(renderActions());
                    tpl.querySelector('#content').replaceChildren(renderContent());
                    if (message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0) {
                        tpl.querySelector('#attachments').replaceChildren(renderAttachments());
                    }
                    initializeReadStatusObserver();
                    return tpl;
                }

                for (const message of messages) {
                    messageListEl.appendChild(renderSingleMessage(message));
                }

                return messageListEl;
            }

            function renderInput() {
                if (!canPost) {
                    return document.createElement('div');
                }

                let attachments = [];

                function renderFileSelector() {
                    const fileInput = document.createElement('input');
                    const limits = client.files.attachmentLimits();

                    fileInput.type = 'file';
                    fileInput.multiple = true;
                    fileInput.accept = limits.mimeTypes.join(',');
                    fileInput.title = `Select up to ${limits.maxFiles} files (Max size per file: ${Math.round(limits.maxSize / 1024)} KB)`;
                    fileInput.style.display = 'block';
                    fileInput.style.marginBottom = '0.5em';

                    fileInput.addEventListener('change', async () => {
                        if (fileInput.files.length === 0) {
                            attachments = [];
                            return;
                        }
                        attachments = Array.from(fileInput.files);

                        if (limits.maxFiles > 0 && attachments.length > limits.maxFiles) {
                            alert(`You can only attach up to ${limits.maxFiles} files.`);
                            attachments = [];
                            fileInput.value = '';
                            return;
                        }

                        for (const file of attachments) {
                            if (limits.maxSize > 0 && file.size > limits.maxSize) {
                                alert(`File "${file.name}" exceeds the maximum size of ${Math.round(limits.maxSize / 1024)} KB.`);
                                attachments = [];
                                fileInput.value = '';
                                return;
                            }
                            if (!limits.mimeTypes.includes(file.type)) {
                                alert(`File type "${file.type}" of file "${file.name}" is not allowed.`);
                                attachments = [];
                                fileInput.value = '';
                                return;
                            }
                        }
                    });

                    return fileInput;
                }

                function renderTextarea() {
                    const textarea = document.createElement('textarea');
                    textarea.placeholder = 'Type your message here...';
                    textarea.rows = 3;
                    textarea.style.width = '100%';
                    let typingTimeout;
                    let isTyping = false;

                    textarea.addEventListener('keydown', async (event) => {
                        clearTimeout(typingTimeout);
                        typingTimeout = setTimeout(() => {
                            isTyping = false;
                            client.rooms.typing.stop(room);
                        }, 600);
                        if (!isTyping) {
                            isTyping = true;
                            client.rooms.typing.start(room);
                        }
                        if (event.key === 'Enter' && !event.shiftKey) {
                            event.preventDefault();
                            const content = textarea.value.trim();
                            if (content) {
                                try {
                                    await client.rooms.messages.send(room, content, {
                                        parentMessage: threadId,
                                        attachments
                                    });
                                    textarea.value = ''; // Clear input after sending
                                } catch (e) {
                                    console.error('Error sending message:', e);
                                    alert(`Error sending message: ${e.message}`);
                                }
                            }
                        }
                    });

                    return textarea;
                }

                function initializeModelSelector(container) {
                    // If the AI feature is not enabled for rooms, don't render the selector
                    if (!client.featureFlags.isEnabled('aiInGroups')) {
                        return;
                    }

                    let renderId = 0;

                    async function renderModelSelector() {
                        const currentRenderId = ++renderId;
                        const [models, currentModel] = await Promise.all([
                            client.ai.list().getAsyncAsserted(2000, 'Timeout fetching models'),
                            client.ai.currentModel().getAsyncAsserted(2000, 'Timeout fetching current model')
                        ]);

                        if (currentRenderId !== renderId) {
                            // A newer render is in progress, discard this one
                            return;
                        }

                        const select = document.createElement('select');
                        for (const model of models) {
                            const option = document.createElement('option');
                            option.value = model.id;
                            option.textContent = model.label;
                            if (currentModel && model.id === currentModel.id) {
                                option.selected = true;
                            }
                            select.appendChild(option);
                        }
                        select.addEventListener('change', async () => {
                            const selectedModelId = select.value;
                            client.ai.setCurrentModel(selectedModelId);
                        });

                        container.replaceChildren(select);
                    }

                    cleanupQueue.add(
                        client.ai.list().store().subscribe(() => renderModelSelector())
                    );
                    cleanupQueue.add(
                        client.ai.currentModel().store().subscribe(() => renderModelSelector())
                    );
                }

                const fieldset = document.createElement('fieldset');

                const modelSelectorContainer = document.createElement('div');
                fieldset.appendChild(modelSelectorContainer);
                initializeModelSelector(modelSelectorContainer);

                fieldset.appendChild(renderFileSelector());
                fieldset.appendChild(renderTextarea());

                const systemPrompt = document.createElement('div');
                systemPrompt.textContent = `System Prompt: ${room.systemPrompt || '(none)'}`;
                fieldset.appendChild(systemPrompt);

                return fieldset;
            }

            function initializeTypingIndicator(container) {
                function renderTypingIndicator(typing) {
                    if (typing.length === 0) {
                        container.replaceChildren();
                        return;
                    }
                    container.replaceChildren();
                    const typingText = document.createElement('em');
                    typingText.textContent = `Currently typing: ${typing.map(u => u.displayName).join(', ')}`;
                    container.appendChild(typingText);
                }

                cleanupQueue.add(
                    client.rooms.typing.state(room).subscribe((typing) => renderTypingIndicator(typing))
                );
            }

            function initializeMessageList(container) {
                cleanupQueue.add(
                    client.rooms.messages.list(room, {
                        threadId,
                        notInThread: !threadId
                    }).store().subscribe(messages => {
                        container.replaceChildren(renderMessageList(messages));
                    })
                );
            }

            const tpl = renderMessageListTemplate();

            tpl.querySelector('#thread-info').replaceChildren(renderThreadInfo());
            tpl.querySelector('#input').replaceChildren(renderInput());

            initializeTypingIndicator(tpl.querySelector('#typing-indicator'));
            initializeMessageList(tpl.querySelector('#messages'));

            return tpl;
        }

        const appTpl = renderRoomTemplate();

        appTpl.querySelector('#actions').appendChild(renderActions(room));
        appTpl.querySelector('#headline').appendChild(renderRoomName(room));
        appTpl.querySelector('#messages').appendChild(renderMessages());

        setAppContent(appTpl);
    }

    let innerCleanup = () => void 0;
    cleanupQueue.add(() => innerCleanup());
    cleanupQueue.add(client.rooms.one(roomSlug).store().subscribe(async room => {
        innerCleanup();
        if (!room) {
            goTo('home');
            return;
        }

        innerCleanup = client.rooms.members.meIs(room, ['admin', 'editor']).subscribe(async canPost => {
            await renderRoom(room, canPost);
        });
    }));

    return cleanupQueue;
}
