// FileShare Application - Real-time File Sharing System
class FileShareApp {
    constructor() {
        this.currentUser = null;
        this.currentRoom = null;
        this.rooms = new Map();
        this.files = new Map();
        this.uploadQueue = [];
        this.isUploading = false;
        
        // Initialize with sample data
        this.initSampleData();
        this.initializeEventListeners();
        this.initializeWebSocketSimulation();
    }

    initSampleData() {
        // Sample room data
        const sampleRoom = {
            id: "room1",
            name: "Project Team",
            code: "PROJ123",
            members: new Set(["Alice", "Bob"]),
            files: new Map(),
            createdAt: new Date("2025-01-10T09:00:00Z")
        };

        // Sample file
        const sampleFile = {
            id: "file1",
            name: "project-proposal.pdf",
            size: 2048576,
            type: "application/pdf",
            uploadedBy: "Alice",
            timestamp: new Date("2025-01-10T10:30:00Z"),
            chunks: []
        };

        sampleRoom.files.set(sampleFile.id, sampleFile);
        this.rooms.set(sampleRoom.id, sampleRoom);
        this.files.set(sampleFile.id, sampleFile);
    }

    initializeEventListeners() {
        // Welcome Screen
        const usernameInput = document.getElementById('username');
        const joinBtn = document.getElementById('joinBtn');

        if (usernameInput && joinBtn) {
            usernameInput.addEventListener('input', (e) => {
                const name = e.target.value.trim();
                joinBtn.disabled = name.length < 2;
            });

            usernameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !joinBtn.disabled) {
                    this.handleUserJoin();
                }
            });

            joinBtn.addEventListener('click', () => this.handleUserJoin());
        }

        // Room Screen
        const createRoomBtn = document.getElementById('createRoomBtn');
        const joinRoomBtn = document.getElementById('joinRoomBtn');
        
        if (createRoomBtn) createRoomBtn.addEventListener('click', () => this.handleCreateRoom());
        if (joinRoomBtn) joinRoomBtn.addEventListener('click', () => this.handleJoinRoom());

        // Room input handlers
        const roomNameInput = document.getElementById('roomName');
        const roomCodeInput = document.getElementById('roomCode');
        
        if (roomNameInput) {
            roomNameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    this.handleCreateRoom();
                }
            });
        }
        
        if (roomCodeInput) {
            roomCodeInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
            
            roomCodeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.target.value.trim()) {
                    this.handleJoinRoom();
                }
            });
        }

        // Main App
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');
        const newRoomBtn = document.getElementById('newRoomBtn');
        const joinAnotherRoomBtn = document.getElementById('joinAnotherRoomBtn');
        
        if (leaveRoomBtn) leaveRoomBtn.addEventListener('click', () => this.handleLeaveRoom());
        if (newRoomBtn) newRoomBtn.addEventListener('click', () => this.showRoomScreen());
        if (joinAnotherRoomBtn) joinAnotherRoomBtn.addEventListener('click', () => this.showRoomScreen());

        // File Upload
        this.initializeFileUpload();

        // Modal
        const closePreview = document.getElementById('closePreview');
        const closePreviewBtn = document.getElementById('closePreviewBtn');
        
        if (closePreview) closePreview.addEventListener('click', () => this.hideModal());
        if (closePreviewBtn) closePreviewBtn.addEventListener('click', () => this.hideModal());

        // Activity
        const clearActivity = document.getElementById('clearActivity');
        if (clearActivity) clearActivity.addEventListener('click', () => this.clearActivity());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
        });
    }

    initializeFileUpload() {
        const dropZone = document.getElementById('dropZone');
        const fileInput = document.getElementById('fileInput');
        const browseBtn = document.getElementById('browseBtn');

        if (!dropZone || !fileInput || !browseBtn) return;

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            const files = Array.from(e.dataTransfer.files);
            this.handleFilesSelected(files);
        });

        // Click to browse
        dropZone.addEventListener('click', () => fileInput.click());
        browseBtn.addEventListener('click', (e) => {
            e.preventDefault();
            fileInput.click();
        });

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            this.handleFilesSelected(files);
            e.target.value = ''; // Reset input
        });
    }

    initializeWebSocketSimulation() {
        // Simulate WebSocket connection for real-time updates
        this.wsConnected = true;
        
        // Simulate periodic activity from other users
        setInterval(() => {
            if (this.currentRoom && this.wsConnected) {
                this.simulateRandomActivity();
            }
        }, 15000 + Math.random() * 30000); // Every 15-45 seconds
    }

    simulateRandomActivity() {
        const activities = [
            'Alice is viewing files...',
            'Bob downloaded project-proposal.pdf',
            'Alice is online'
        ];
        
        const activity = activities[Math.floor(Math.random() * activities.length)];
        if (Math.random() < 0.3) { // 30% chance
            this.addActivity('info', activity);
        }
    }

    handleUserJoin() {
        try {
            const usernameInput = document.getElementById('username');
            if (!usernameInput) {
                console.error('Username input not found');
                return;
            }

            const username = usernameInput.value.trim();
            if (username.length < 2) {
                this.showNotification('error', 'Please enter at least 2 characters');
                return;
            }

            this.currentUser = {
                id: this.generateId(),
                name: username,
                joinedAt: new Date()
            };

            // Update user display name before showing room screen
            const userDisplayName = document.getElementById('userDisplayName');
            if (userDisplayName) {
                userDisplayName.textContent = username;
            }

            this.showRoomScreen();
            this.showNotification('success', `Welcome to FileShare, ${username}!`);
            
        } catch (error) {
            console.error('Error in handleUserJoin:', error);
            this.showNotification('error', 'Failed to join. Please try again.');
        }
    }

    handleCreateRoom() {
        try {
            const roomNameInput = document.getElementById('roomName');
            if (!roomNameInput) return;

            const roomName = roomNameInput.value.trim();
            if (!roomName) {
                this.showNotification('error', 'Please enter a room name');
                return;
            }

            const room = {
                id: this.generateId(),
                name: roomName,
                code: this.generateRoomCode(),
                members: new Set([this.currentUser.name]),
                files: new Map(),
                createdAt: new Date()
            };

            this.rooms.set(room.id, room);
            this.joinRoom(room);
        } catch (error) {
            console.error('Error creating room:', error);
            this.showNotification('error', 'Failed to create room. Please try again.');
        }
    }

    handleJoinRoom() {
        try {
            const roomCodeInput = document.getElementById('roomCode');
            if (!roomCodeInput) return;

            const roomCode = roomCodeInput.value.trim().toUpperCase();
            if (!roomCode) {
                this.showNotification('error', 'Please enter a room code');
                return;
            }

            const room = Array.from(this.rooms.values()).find(r => r.code === roomCode);
            if (!room) {
                this.showNotification('error', 'Room not found. Please check the code and try again.');
                return;
            }

            room.members.add(this.currentUser.name);
            this.joinRoom(room);
        } catch (error) {
            console.error('Error joining room:', error);
            this.showNotification('error', 'Failed to join room. Please try again.');
        }
    }

    joinRoom(room) {
        try {
            this.currentRoom = room;
            this.showMainApp();
            this.updateRoomUI();
            this.updateFilesUI();
            this.addActivity('user-joined', `${this.currentUser.name} joined the room`);
            this.showNotification('success', `Joined room "${room.name}"`);
            
            // Clear form inputs
            const roomNameInput = document.getElementById('roomName');
            const roomCodeInput = document.getElementById('roomCode');
            
            if (roomNameInput) roomNameInput.value = '';
            if (roomCodeInput) roomCodeInput.value = '';
        } catch (error) {
            console.error('Error in joinRoom:', error);
            this.showNotification('error', 'Failed to join room properly.');
        }
    }

    handleLeaveRoom() {
        if (!this.currentRoom) return;

        this.currentRoom.members.delete(this.currentUser.name);
        this.addActivity('user-left', `${this.currentUser.name} left the room`);
        
        this.currentRoom = null;
        this.showRoomScreen();
        this.showNotification('info', 'Left the room');
    }

    handleFilesSelected(files) {
        if (!this.currentRoom) {
            this.showNotification('error', 'Please join a room first');
            return;
        }

        if (files.length === 0) return;

        // Validate files
        const validFiles = this.validateFiles(files);
        if (validFiles.length === 0) return;

        // Add to upload queue
        this.uploadQueue.push(...validFiles.map(file => ({
            id: this.generateId(),
            file: file,
            progress: 0,
            status: 'pending'
        })));

        this.startUpload();
    }

    validateFiles(files) {
        const maxSize = 10485760; // 10MB
        const maxFiles = 5;
        const allowedTypes = ['pdf', 'doc', 'docx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'mp4', 'zip'];

        if (files.length > maxFiles) {
            this.showNotification('error', `Maximum ${maxFiles} files allowed at once`);
            return [];
        }

        const validFiles = [];
        for (const file of files) {
            const extension = file.name.split('.').pop().toLowerCase();
            
            if (file.size > maxSize) {
                this.showNotification('error', `${file.name} is too large (max 10MB)`);
                continue;
            }
            
            if (!allowedTypes.includes(extension)) {
                this.showNotification('error', `${file.name} has unsupported file type`);
                continue;
            }

            validFiles.push(file);
        }

        return validFiles;
    }

    async startUpload() {
        if (this.isUploading || this.uploadQueue.length === 0) return;

        this.isUploading = true;
        this.showUploadProgress();

        for (const uploadItem of this.uploadQueue) {
            await this.uploadFile(uploadItem);
        }

        this.uploadQueue = [];
        this.isUploading = false;
        this.hideUploadProgress();
    }

    async uploadFile(uploadItem) {
        const { file } = uploadItem;
        uploadItem.status = 'uploading';
        
        this.updateUploadProgress();

        // Simulate chunked upload
        const chunkSize = 1048576; // 1MB chunks
        const totalChunks = Math.ceil(file.size / chunkSize);
        
        for (let i = 0; i < totalChunks; i++) {
            await this.delay(200 + Math.random() * 300); // Simulate network delay
            uploadItem.progress = Math.round(((i + 1) / totalChunks) * 100);
            this.updateUploadProgress();
        }

        // Create file record
        const fileRecord = {
            id: uploadItem.id,
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedBy: this.currentUser.name,
            timestamp: new Date(),
            data: file // In a real app, this would be stored differently
        };

        // Add to room and global files
        this.currentRoom.files.set(fileRecord.id, fileRecord);
        this.files.set(fileRecord.id, fileRecord);

        uploadItem.status = 'completed';
        this.updateUploadProgress();

        // Add activity and notification
        this.addActivity('file-upload', `${this.currentUser.name} uploaded ${file.name}`);
        this.showNotification('success', `${file.name} uploaded successfully`);

        // Update UI
        this.updateFilesUI();
    }

    showUploadProgress() {
        const uploadProgress = document.getElementById('uploadProgress');
        if (uploadProgress) {
            uploadProgress.classList.remove('hidden');
            this.updateUploadProgress();

            // Cancel button
            const cancelUpload = document.getElementById('cancelUpload');
            if (cancelUpload) {
                cancelUpload.onclick = () => {
                    this.uploadQueue = [];
                    this.isUploading = false;
                    this.hideUploadProgress();
                    this.showNotification('info', 'Upload cancelled');
                };
            }
        }
    }

    hideUploadProgress() {
        const uploadProgress = document.getElementById('uploadProgress');
        if (uploadProgress) {
            uploadProgress.classList.add('hidden');
        }
    }

    updateUploadProgress() {
        const uploadList = document.getElementById('uploadList');
        if (!uploadList) return;

        uploadList.innerHTML = '';

        this.uploadQueue.forEach(item => {
            const div = document.createElement('div');
            div.className = 'upload-item';
            
            const statusIcon = item.status === 'completed' ? '✅' : '⬆️';
            
            div.innerHTML = `
                <div class="upload-item-info">
                    <div class="upload-item-name">${statusIcon} ${item.file.name}</div>
                    <div class="upload-item-size">${this.formatFileSize(item.file.size)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.progress}%"></div>
                    </div>
                </div>
                <span>${item.progress}%</span>
            `;
            
            uploadList.appendChild(div);
        });
    }

    updateRoomUI() {
        if (!this.currentRoom) return;

        const currentRoomName = document.getElementById('currentRoomName');
        const currentRoomCode = document.getElementById('currentRoomCode');
        const headerUserName = document.getElementById('headerUserName');

        if (currentRoomName) currentRoomName.textContent = this.currentRoom.name;
        if (currentRoomCode) currentRoomCode.textContent = this.currentRoom.code;
        if (headerUserName) headerUserName.textContent = this.currentUser.name;

        // Update members list
        const membersList = document.getElementById('membersList');
        if (membersList) {
            membersList.innerHTML = '';
            
            this.currentRoom.members.forEach(memberName => {
                const div = document.createElement('div');
                div.className = 'member-item';
                div.innerHTML = `
                    <div class="member-status"></div>
                    <span>${memberName}${memberName === this.currentUser.name ? ' (You)' : ''}</span>
                `;
                membersList.appendChild(div);
            });
        }
    }

    updateFilesUI() {
        if (!this.currentRoom) return;

        const filesList = document.getElementById('filesList');
        const fileCount = document.getElementById('fileCount');
        
        if (!filesList || !fileCount) return;

        const files = Array.from(this.currentRoom.files.values()).sort((a, b) => b.timestamp - a.timestamp);
        
        fileCount.textContent = `${files.length} file${files.length !== 1 ? 's' : ''}`;

        if (files.length === 0) {
            filesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📁</div>
                    <p>No files shared yet</p>
                    <p>Upload your first file to get started!</p>
                </div>
            `;
            return;
        }

        filesList.innerHTML = '';
        files.forEach(file => {
            const div = document.createElement('div');
            div.className = 'file-item';
            
            const extension = file.name.split('.').pop().toLowerCase();
            const icon = this.getFileIcon(extension);
            
            div.innerHTML = `
                <div class="file-icon ${extension}">${icon}</div>
                <div class="file-info">
                    <div class="file-name" title="${file.name}">${file.name}</div>
                    <div class="file-meta">
                        <span>by ${file.uploadedBy}</span>
                    </div>
                </div>
                <div class="file-size">${this.formatFileSize(file.size)}</div>
                <div class="file-time">${this.formatTime(file.timestamp)}</div>
                <div class="file-actions">
                    <button class="btn btn--outline btn--sm" onclick="app.previewFile('${file.id}')">Preview</button>
                    <button class="btn btn--primary btn--sm" onclick="app.downloadFile('${file.id}')">Download</button>
                </div>
            `;
            
            filesList.appendChild(div);
        });
    }

    previewFile(fileId) {
        const file = this.files.get(fileId);
        if (!file) return;

        const modal = document.getElementById('filePreviewModal');
        const title = document.getElementById('previewTitle');
        const content = document.getElementById('previewContent');
        const downloadBtn = document.getElementById('downloadFromPreview');

        if (!modal || !title || !content || !downloadBtn) return;

        title.textContent = file.name;
        downloadBtn.onclick = () => this.downloadFile(fileId);

        const extension = file.name.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
            // Image preview
            const url = URL.createObjectURL(file.data);
            content.innerHTML = `<img src="${url}" alt="${file.name}" class="preview-image">`;
        } else {
            // Document preview
            content.innerHTML = `
                <div class="preview-document">
                    <div class="preview-document-icon">${this.getFileIcon(extension)}</div>
                    <h3>${file.name}</h3>
                    <p>Size: ${this.formatFileSize(file.size)}</p>
                    <p>Uploaded by: ${file.uploadedBy}</p>
                    <p>Date: ${this.formatDateTime(file.timestamp)}</p>
                </div>
            `;
        }

        this.showModal();
    }

    downloadFile(fileId) {
        const file = this.files.get(fileId);
        if (!file) return;

        // Create download link
        const url = URL.createObjectURL(file.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('success', `Downloaded ${file.name}`);
        this.addActivity('info', `${this.currentUser.name} downloaded ${file.name}`);
    }

    addActivity(type, message) {
        const activityFeed = document.getElementById('activityFeed');
        if (!activityFeed) return;

        const div = document.createElement('div');
        div.className = `activity-item ${type}`;
        
        div.innerHTML = `
            <div class="activity-content">${message}</div>
            <div class="activity-time">${this.formatTime(new Date())}</div>
        `;
        
        activityFeed.insertBefore(div, activityFeed.firstChild);
        
        // Keep only last 50 activities
        while (activityFeed.children.length > 50) {
            activityFeed.removeChild(activityFeed.lastChild);
        }
    }

    clearActivity() {
        const activityFeed = document.getElementById('activityFeed');
        if (activityFeed) {
            activityFeed.innerHTML = '';
        }
    }

    showNotification(type, message) {
        const container = document.getElementById('notifications');
        if (!container) return;

        const div = document.createElement('div');
        div.className = `notification ${type}`;
        
        div.innerHTML = `
            <div class="notification-content">${message}</div>
            <button class="notification-close">&times;</button>
        `;
        
        const closeBtn = div.querySelector('.notification-close');
        closeBtn.onclick = () => container.removeChild(div);
        
        container.appendChild(div);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (div.parentNode) {
                container.removeChild(div);
            }
        }, 5000);
    }

    showModal() {
        const modal = document.getElementById('filePreviewModal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    hideModal() {
        const modal = document.getElementById('filePreviewModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }

    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const roomScreen = document.getElementById('roomScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (welcomeScreen) welcomeScreen.classList.remove('hidden');
        if (roomScreen) roomScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.add('hidden');
    }

    showRoomScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const roomScreen = document.getElementById('roomScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (roomScreen) roomScreen.classList.remove('hidden');
        if (mainApp) mainApp.classList.add('hidden');
    }

    showMainApp() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        const roomScreen = document.getElementById('roomScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (welcomeScreen) welcomeScreen.classList.add('hidden');
        if (roomScreen) roomScreen.classList.add('hidden');
        if (mainApp) mainApp.classList.remove('hidden');
    }

    // Utility methods
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    }

    formatDateTime(date) {
        return date.toLocaleString();
    }

    getFileIcon(extension) {
        const icons = {
            pdf: '📄',
            doc: '📝',
            docx: '📝',
            txt: '📄',
            jpg: '🖼️',
            jpeg: '🖼️',
            png: '🖼️',
            gif: '🖼️',
            mp4: '🎥',
            zip: '🗜️'
        };
        return icons[extension] || '📁';
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the application
const app = new FileShareApp();

// Handle page load
document.addEventListener('DOMContentLoaded', () => {
    app.showWelcomeScreen();
});

// Handle page unload
window.addEventListener('beforeunload', (e) => {
    if (app.currentRoom && app.currentUser) {
        app.currentRoom.members.delete(app.currentUser.name);
        app.addActivity('user-left', `${app.currentUser.name} left the room`);
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    if (app.showNotification) {
        app.showNotification('error', 'An error occurred. Please try again.');
    }
});

// Service Worker simulation for offline support (basic)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('data:text/javascript;base64,')
        .catch(() => {
            // Service worker registration failed, but that's ok for this demo
        });
}