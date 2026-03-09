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
// 6. Modal Logic
function showModal(issue) {
    const modal = document.getElementById('issue-modal');
    document.getElementById('modal-title').innerText = issue.title;
    document.getElementById('modal-description').innerText = issue.description;
    document.getElementById('modal-author').innerText = issue.author;
    document.getElementById('modal-date').innerText = new Date(issue.createdAt).toLocaleDateString();
    document.getElementById('modal-assignee').innerText = issue.assignee || 'Unassigned';
    
    // Status Badge
    const statusBadge = document.getElementById('modal-status-badge');
    statusBadge.innerText = (issue.manualClose ? (issue.status === 'open' ? 'CLOSED' : 'OPEN') : issue.status.toUpperCase());
    
    // Priority
    const pBadge = document.getElementById('modal-priority-badge');
    pBadge.className = `priority-tag priority-${issue.priority.toLowerCase()}`;
    pBadge.innerText = issue.priority.toUpperCase();

    // Labels
    document.getElementById('modal-labels').innerHTML = issue.labels.map(l => `<span class="label-tag label-${l.toLowerCase().replace(/\s+/g, '-')}">${l.toUpperCase()}</span>`).join('');

    modal.classList.remove('hidden');
}
document.getElementById('close-modal').onclick = () => document.getElementById('issue-modal').classList.add('hidden');

function toggleLoader(show) {
    spinner.classList.toggle('hidden', !show);
}
// 1. Hook into your existing Search Input
const searchInput = document.getElementById('issue-search'); 

// 2. The Search Function
async function handleSearch(query) {
    const grid = document.querySelector('.issues-grid');

    // If search is cleared, reload original data (don't leave a blank screen)
    if (!query || query.trim() === "") {
        await fetchAndRenderAllIssues();
        return;
    }

    try {
        const response = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        // --- THE CRITICAL FIX ---
        // Clear all existing cards first. This forces all non-matching 
        // cards to "vanish" before we show the new ones.
        grid.innerHTML = ''; 

        // Check if the API returned any matches
        if (data && data.length > 0) {
            data.forEach(issue => {
                // Use your existing card-creation logic
                const card = createIssueCard(issue); 
                grid.appendChild(card);
            });
        } else {
            // Optional: Provide feedback if nothing matches
            grid.innerHTML = '<p>No issues found matching your search.</p>';
        }
    } catch (error) {
        console.error("Search API Error:", error);
    }
}


// SEARCH FUNCTIONALITY
const searchput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");

async function handleSearch() {
    const query = searchput.value.trim();

    // If search is empty show all issues again
    if (query === "") {
        renderIssues(allIssues);
        return;
    }

    toggleLoader(true);

    try {
        const response = await fetch(`https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            renderIssues(data.data);
        } else {
            issuesGrid.innerHTML = `<p style="padding:20px;">No issues found</p>`;
            document.getElementById('issue-count').innerText = "0 Issues";
        }

    } catch (error) {
        console.error("Search Error:", error);
    }

    toggleLoader(false);
}

// Search button click
searchBtn.addEventListener("click", handleSearch);

// Press Enter to search
searchput.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        handleSearch();
    }
});