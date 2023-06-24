var closedTabs = [];
var tabInfo = {};

chrome.runtime.onInstalled.addListener(d => {
	chrome.storage.sync.clear();
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	tabInfo[tabId] = {
		url: tab.url,
		index: tab.index,
		windowId: tab.windowId
	}
});

chrome.tabs.onRemoved.addListener(
	async function (tabId, removeInfo) {
		if (tabInfo[tabId]) {
			closedTabs.push(tabInfo[tabId]);
			delete tabInfo[tabId];
		}
	}
);

chrome.runtime.onMessage.addListener(
	async function (req, sender, resp) {
		let activeTabs = [];
		let nextTab = [];
		let currentWindow = await chrome.windows.getCurrent();
		let idx = -1;

		switch (req.trigger) {
			case 'refresh':
				chrome.tabs.reload();
				break;
				
			case 'fullRefresh':
				chrome.tabs.reload(
					null,
					{
						bypassCache: true
					}
				);
				break;

			case 'newTab':
				chrome.tabs.create({});
				break;
				
			case 'closeTab':
				activeTabs = await chrome.tabs.query({
					active: true,
					windowId: currentWindow.id
				});
				if (activeTabs.length > 0) {
					chrome.tabs.remove(activeTabs[0].id);
				}
				break;

			case 'undoCloseTab':
				for (let i = closedTabs.length-1; i >= 0; i--) {
					if (closedTabs[i].windowId == currentWindow.id) {
						idx = i;
						break;
					}
				}
				if (idx != -1) {
					nextTab = closedTabs.splice(idx, 1);
					idx = -1;
					chrome.tabs.create({
						active: true,
						index: nextTab[0].index,
						url: nextTab[0].url,
						windowId: currentWindow.id
					});
				}
				break;
				
			case 'selLeftTab':
				activeTabs = await chrome.tabs.query({
					active: true,
					windowId: currentWindow.id
				});
				if (activeTabs.length > 0 ) {
					if (activeTabs[0].index > 0) {
						nextTab = await chrome.tabs.query({
							index: activeTabs[0].index-1,
							windowId: currentWindow.id
						});
						if (nextTab.length > 0) {
							chrome.tabs.update(
								nextTab[0].id,
								{
									active: true
								}
							);
						}
					} else {
						nextTab = await chrome.tabs.query({
							windowId: currentWindow.id
						});
						if (nextTab.length > 0) {
							chrome.tabs.update(
								nextTab[nextTab.length-1].id,
								{
									active: true
								}
							);
						}
					}
				}
				break;

			case 'selRightTab':
				activeTabs = await chrome.tabs.query({
					active: true,
					windowId: currentWindow.id
				});
				if (activeTabs.length > 0) {
					nextTab = await chrome.tabs.query({
						index: activeTabs[0].index+1,
						windowId: currentWindow.id
					});
					if (nextTab.length > 0) {
						chrome.tabs.update(
							nextTab[0].id,
							{
								active: true
							}
						);
					} else {
						nextTab = await chrome.tabs.query({
							index: 0,
							windowId: currentWindow.id
						});
						if (nextTab.length > 0) {
							chrome.tabs.update(
								nextTab[0].id,
								{
									active: true
								}
							);
						}
					}
				}
				break;

			case 'goBack':
				chrome.tabs.goBack();
				break;

			case 'goForward':
				chrome.tabs.goForward();
				break;

			case 'scrollTop':
				activeTabs = await chrome.tabs.query({
					active: true,
					windowId: currentWindow.id
				});
				if (activeTabs.length > 0) {
					chrome.scripting.executeScript(
						{
							target: {
								tabId: activeTabs[0].id
							},
							func: () => {
								const y = document.body.scrollHeight > 0 
									? document.body.scrollHeight 
									: document.documentElement.scrollHeight;
								window.scrollBy(0, -y);
							}
						}
					);	
				}
				break;

			case 'scrollBottom':
				activeTabs = await chrome.tabs.query({
					active: true,
					windowId: currentWindow.id
				});
				if (activeTabs.length > 0) {
					chrome.scripting.executeScript(
						{
							target: {
								tabId: activeTabs[0].id
							},
							func: () => {
								const y = document.body.scrollHeight > 0 
									? document.body.scrollHeight 
									: document.documentElement.scrollHeight;
								window.scrollBy(0, y);
							}
						}
					);	
				}
				break;
		}
	}
);
