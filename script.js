const API_URL = "https://phi-lab-server.vercel.app/api/v1/lab/issues";
let allIssues = [];

// DOM Elements
const loginForm = document.getElementById('login-form');
const dashboardPage = document.getElementById('dashboard-page');
const loginPage = document.getElementById('login-page');
const issuesGrid = document.getElementById('issues-grid');
const tabs = document.querySelectorAll('.tab');
const spinner = document.getElementById('loading-spinner');

// 1. Auth Logic
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (document.getElementById('username').value === 'admin') {
        loginPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        fetchIssues();
    }
});

// 2. Fetching Logic
async function fetchIssues() {
    toggleLoader(true);
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        allIssues = data.data.map(issue => ({ ...issue, manualClose: false }));
        renderIssues(allIssues);
    } catch (err) { console.error(err); } finally { toggleLoader(false); }
}

// 3. Helper: Format Date and Time
function formatDateTime(isoString) {
    if (!isoString) return 'N/A';
    const date = new Date(isoString);
    // Formats to: MMM DD, YYYY, HH:MM AM/PM
    return date.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 4. Render Logic
function renderIssues(issues) {
    issuesGrid.innerHTML = '';
    document.getElementById('issue-count').innerText = `${issues.length} Issues`;

    issues.forEach(issue => {
        const isCurrentlyOpen = issue.manualClose ? (issue.status !== 'open') : (issue.status === 'open');
        const statusClass = issue.manualClose ? 'card-toggled-blue' : (isCurrentlyOpen ? 'card-open' : 'card-closed');
        const iconSrc = isCurrentlyOpen ? 'assets/Open-Status.png' : 'assets/Closed- Status.png';

        const labelsHTML = issue.labels.map(label => {
            const slug = label.toLowerCase().replace(/\s+/g, '-');
            return `<span class="label-tag label-${slug}">${label.toUpperCase()}</span>`;
        }).join('');

        const priorityClass = `priority-${issue.priority.toLowerCase()}`;
        
        // Processing both timestamps from the JSON
        const createdTime = formatDateTime(issue.createdAt);
        const updatedTime = formatDateTime(issue.updatedAt);

        const card = document.createElement('div');
        card.className = `issue-card ${statusClass}`;
        
   // ... inside the renderIssues function, within the forEach loop:

      card.innerHTML = `
    <span class="priority-tag ${priorityClass}">${issue.priority}</span>
    <img src="${iconSrc}" class="status-toggle-icon" alt="status">
    <h3>${issue.title}</h3>
    <p>${issue.description.substring(0, 80)}...</p>
    
    <div class="label-container">${labelsHTML}</div>
    
    <hr class="card-divider">
    
    <div class="card-footer" style="padding: 0 20px; font-size: 11px; color: #888;">
        #${issue.id} by <strong>${issue.author}</strong><br>
        <div style="margin-top: 5px; line-height: 1.4;">
            <strong>Created:</strong> ${createdTime}<br>
            <strong>Updated:</strong> ${updatedTime}
        </div>
    </div>
`;

        card.querySelector('.status-toggle-icon').onclick = (e) => {
            e.stopPropagation();
            issue.manualClose = !issue.manualClose;
            filterAndRender();
        };

        card.onclick = () => showModal(issue);
        issuesGrid.appendChild(card);
    });
}

// 5. Filtering Logic
function filterAndRender() {
    const activeTab = document.querySelector('.tab.active');
    const activeFilter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
    
    const filtered = allIssues.filter(issue => {
        const isCurrentlyOpen = issue.manualClose ? (issue.status !== 'open') : (issue.status === 'open');
        const currentStatus = isCurrentlyOpen ? 'open' : 'closed';
        if (activeFilter === 'all') return true;
        return currentStatus === activeFilter;
    });
    renderIssues(filtered);
}

// Event Listeners for Tabs
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        filterAndRender();
    });
});

// 6. Modal Logic
function showModal(issue) {
    const modal = document.getElementById('issue-modal');
    
    // ... (populate title, author, date, description as before)
    
    // The existing label logic will now render in the new position
    const labelContainer = document.getElementById('modal-labels');
    labelContainer.innerHTML = issue.labels.map(label => {
        const slug = label.toLowerCase().replace(/\s+/g, '-');
        return `<span class="label-tag label-${slug}">${label.toUpperCase()}</span>`;
    }).join('');

    modal.classList.remove('hidden');
}
document.getElementById('close-modal').onclick = () => document.getElementById('issue-modal').classList.add('hidden');

function toggleLoader(show) {
    spinner.classList.toggle('hidden', !show);
}