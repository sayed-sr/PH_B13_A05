export const API_URL = "https://phi-lab-server.vercel.app/api/v1/lab/issues";

export async function fetchIssues() {
    const response = await fetch(API_URL);
    const data = await response.json();
    return data.data;
}

export async function searchIssues(query) {
    const response = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    return data.data;
}