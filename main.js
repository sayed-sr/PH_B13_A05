import { fetchIssues, searchIssues } from "./api.js";

let allIssues = [];

// DOM
const loginForm = document.getElementById('login-form');
const dashboardPage = document.getElementById('dashboard-page');
const loginPage = document.getElementById('login-page');
const issuesGrid = document.getElementById('issues-grid');
const tabs = document.querySelectorAll('.tab');
const spinner = document.getElementById('loading-spinner');
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");


async function loadIssues() {
    toggleLoader(true);

    try {
        const data = await fetchIssues();

        allIssues = data.map(issue => ({
            ...issue,
            manualClose: false
        }));

        renderIssues(allIssues);

    } catch (err) {
        console.error(err);
    }

    toggleLoader(false);
}


loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    if (document.getElementById('username').value === 'admin') {
        loginPage.classList.add('hidden');
        dashboardPage.classList.remove('hidden');
        loadIssues();
    }
});




async function handleSearch() {

    const query = searchInput.value.trim();

    if (query === "") {
        renderIssues(allIssues);
        return;
    }

    toggleLoader(true);

    try {
        const data = await searchIssues(query);

        if (data && data.length > 0) {
            renderIssues(data);
        } else {
            issuesGrid.innerHTML = "<p>No issues found</p>";
        }

    } catch (err) {
        console.error(err);
    }

    toggleLoader(false);
}

searchBtn.addEventListener("click", handleSearch);

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
});




