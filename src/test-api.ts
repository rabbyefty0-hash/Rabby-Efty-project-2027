import fetch from 'node-fetch';

async function test() {
  const API_KEY = 'hYQDJbY5oIUWmtSv8NMu5Q0d96hBwe6';
  const targetUrl = `https://panel.smmflw.com/api/v2?key=${API_KEY}&action=services`;
  const API_URL = 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(targetUrl);
  
  try {
    const response = await fetch(API_URL);
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text.substring(0, 200));
  } catch (e) {
    console.error(e);
  }
}
test();
