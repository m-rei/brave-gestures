var settings = {};

document.querySelector('#save-btn')?.addEventListener('click', _ => {
	if (!settings) {
		return;
	}
	for (let key in settings) {
		const el = document.querySelector('#' + key);
		if (!el) {
			continue;
		}
		settings[key] = el.value;
	}
	for (let trigger of settings.triggers) {
		trigger.seq = document.querySelector('#' + trigger.name).value;
	}

	console.log('saving settings');
	chrome.storage.sync.set({'settings': settings}).then(_ => {
		console.log('saving successful, now sending message');
		chrome.tabs.query({}, tabs => {
			for (let tab of tabs) {
				chrome.tabs.sendMessage(tab.id, {trigger: 'reload_settings'}, _ => {
					window.close();
				});
			};
		});
	});
});

chrome.storage.sync.get(['settings']).then(r => {
	if (r.settings) {
		settings = r.settings;
		for (let key in r.settings) {
			const el = document.querySelector('#' + key);
			if (!el) {
				continue;
			}
			el.value = r.settings[key];
		}
		for (let trigger of r.settings.triggers) {
			document.querySelector('#' + trigger.name).value = trigger.seq;
		}
	}
});
