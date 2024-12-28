const messageInput = document.getElementById('messageInput');
const fileInput = document.getElementById('fileInput');
const sendButton = document.getElementById('sendButton');
const chatDisplay = document.querySelector('.chat-display');

// 替换为你的GitHub个人访问令牌
const githubToken = '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';
// 替换为你的GitHub用户名和仓库名
const githubRepo = '371920029173/ltcs9';
// 仓库分支
const githubBranch = 'main';
// 存储文件的路径
const githubFilePath = 'chatlog.json';

let chatLog = [];

// 从GitHub加载聊天日志
async function loadChatLog() {
    const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${githubFilePath}?ref=${githubBranch}`, {
        headers: {
            'Authorization': `token ${githubToken}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        const content = atob(data.content);
        chatLog = JSON.parse(content);
        chatLog.forEach(msg => displayMessage(msg));
    } else {
        chatLog = [];
    }
}

// 发送消息
function sendMessage() {
    const message = messageInput.value;
    if (message) {
        const newMessage = { type: 'text', content: message, timestamp: new Date().toISOString() };
        chatLog.push(newMessage);
        displayMessage(newMessage);
        messageInput.value = '';
        saveChatLog();
    }
}

// 发送文件
function sendFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const fileContent = e.target.result;
        const newMessage = { type: 'file', content: fileContent, timestamp: new Date().toISOString(), fileName: file.name };
        chatLog.push(newMessage);
        displayMessage(newMessage);
        saveChatLog();
    };
    reader.readAsDataURL(file);
}

// 显示消息
function displayMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    if (message.type === 'text') {
        messageElement.textContent = message.content;
    } else if (message.type === 'file') {
        messageElement.innerHTML = `<a href="${message.content}" target="_blank" download="${message.fileName}">下载文件: ${message.fileName}</a>`;
    }
    chatDisplay.appendChild(messageElement);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
}

// 保存聊天日志到GitHub
async function saveChatLog() {
    const chatLogJson = JSON.stringify(chatLog);
    const content = btoa(chatLogJson);

    let sha = ''; // 初始提交时为空，后续更新时需要填入最新的文件SHA

    const response = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${githubFilePath}?ref=${githubBranch}`, {
        method: 'GET',
        headers: {
            'Authorization': `token ${githubToken}`
        }
    });

    if (response.ok) {
        const data = await response.json();
        sha = data.sha;
    }

    const putResponse = await fetch(`https://api.github.com/repos/${githubRepo}/contents/${githubFilePath}`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${githubToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Update chat log',
            content: content,
            branch: githubBranch,
            sha: sha // 使用最新的SHA值
        })
    });

    if (putResponse.ok) {
        console.log('Chat log saved to GitHub');
    } else {
        console.error('Failed to save chat log to GitHub');
    }
}

// 监听事件
sendButton.addEventListener('click', () => {
    if (messageInput.value) {
        sendMessage();
    } else if (fileInput.files.length) {
        sendFile(fileInput.files[0]);
    }
});

fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
        sendFile(e.target.files[0]);
    }
});

// 加载聊天日志
loadChatLog();