// This script will extract the text content of the page
function getPageContent() {
  return document.body.innerText;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getContent') {
    sendResponse({ content: getPageContent() });
  }
});
