const props = {
	lineWidth: 3,
	minDistanceBeforeNextCapture: 30,
	triggers: [
		{
			name: 'fullRefresh',
			seq: 'rldrul',
			fun: () => chrome.runtime.sendMessage({trigger: 'fullRefresh'})
		
		},
		{
			name: 'refresh',
			seq: 'ldrul',
			fun: () => chrome.runtime.sendMessage({trigger: 'refresh'})
		
		},
		{
			name: 'newTab',
			seq: 'u',
			fun: () => chrome.runtime.sendMessage({trigger: 'newTab'})
		},
		{
			name: 'closeTab',
			seq: 'd',
			fun: () => chrome.runtime.sendMessage({trigger: 'closeTab'})
		},
		{
			name: 'undoCloseTab',
			seq: 'lr',
			fun: () => chrome.runtime.sendMessage({trigger: 'undoCloseTab'})
		},
		{
			name: 'selLeftTab',
			seq: 'ul',
			fun: () => chrome.runtime.sendMessage({trigger: 'selLeftTab'})
		},
		{
			name: 'selRightTab',
			seq: 'ur',
			fun: () => chrome.runtime.sendMessage({trigger: 'selRightTab'})
		},
		{
			name: 'goBack',
			seq: 'l',
			fun: () => chrome.runtime.sendMessage({trigger: 'goBack'})
		},
		{
			name: 'goForward',
			seq: 'r',
			fun: () => chrome.runtime.sendMessage({trigger: 'goForward'})
		}
	]
};

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');
var mouseIsDown = false;
var capturedCoords = [];
var minDistanceBeforeNextCapture = props.minDistanceBeforeNextCapture;
var capturedMoves = [];
var detectedTrigger = null;

canvas.style.position = 'fixed';
canvas.style.top = 0;
canvas.style.left = 0;
canvas.style.right = 0;
canvas.style.bottom = 0;
canvas.style.zIndex = 9999;
canvas.style.pointerEvents = 'none';

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

ctx.canvas.width = window.innerWidth;
ctx.canvas.height - window.innerHeight;
ctx.lineWidth = props.lineWidth;
ctx.textBaseline = 'top';
ctx.font = '12pt Georgia';

const detectAndSaveTrigger = () => {
	const trigger = props.triggers.find(t => movePatternMatch(t.seq));
	if (!trigger) {
		detectedTrigger = null;
		return;
	}

	detectedTrigger = trigger;
}

const movePatternMatch = (pattern) => {
	return capturedMoves
		.join('')
		.endsWith(pattern);
}

const captureMove = (a, b) => {
	const dx = b.x-a.x;
	const dy = b.y-a.y;

	if (Math.abs(dx) > Math.abs(dy)) {
		if (dx < 0) {
			return 'l';
		} else {
			return 'r';
		}
	} else {
		if (dy > 0) {
			return 'd';
		} else {
			return 'u';
		}
	}
}

const renderLine = (a, b) => {
	ctx.beginPath();
	ctx.lineWidth = props.lineWidth + 2;
	ctx.strokeStyle = '#fff';
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
	
	ctx.beginPath();
	ctx.lineWidth = props.lineWidth;
	ctx.strokeStyle = '#000';
	ctx.moveTo(a.x, a.y);
	ctx.lineTo(b.x, b.y);
	ctx.stroke();
}

const renderText = () => {
	const txt1 = `Moves: ${capturedMoves.join('')}`;
	const txt2 = `Trigger: ${detectedTrigger?.name ?? '-'}`;

	const txtWidth1 = ctx.measureText(txt1).width;
	const txtWidth2 = ctx.measureText(txt2).width;
	const txtWidth12Min = txtWidth1 > txtWidth2
		? txtWidth1
		: txtWidth2;
	const minTxtWidth = 150;
	const txtWidth = txtWidth12Min < minTxtWidth 
		? minTxtWidth
		: txtWidth12Min;

	const txtHeight = parseInt(ctx.font);
	
	ctx.fillStyle = '#000';
	ctx.fillRect(5, 5, txtWidth, txtHeight);
	ctx.fillStyle = '#fff';
	ctx.fillText(txt1, 5, 5);
	
	ctx.fillStyle = '#000';
	ctx.fillRect(5, 5+txtHeight, txtWidth, txtHeight);
	ctx.fillStyle = '#fff';
	ctx.fillText(txt2, 5, 5+txtHeight);
}

let ignoreNextTrigger = false;
const keyDown = (e) => {
	if (e.key == 'Escape') {
		ignoreNextTrigger = true;
	}
}

const mouseMove = (e) => {
	if (!mouseIsDown) {
		return;
	}

	const lastCoord = capturedCoords.length > 0
		? capturedCoords[capturedCoords.length-1]
		: null;
	let newCoord = {x: e.clientX, y: e.clientY};
	if (lastCoord) {
		const dist = Math.sqrt(
			Math.pow(lastCoord.x-newCoord.x, 2) +
			Math.pow(lastCoord.y-newCoord.y, 2)
		);
		if (dist < minDistanceBeforeNextCapture) {
			return;
		}
	}

	capturedCoords.push(newCoord);

	if (lastCoord) {
		renderLine(lastCoord, newCoord);

		const lastMove = capturedMoves.length > 0
			? capturedMoves[capturedMoves.length-1]
			: null;
		const newMove = captureMove(lastCoord, newCoord);
		if (!lastMove || lastMove !== newMove) {
			capturedMoves.push(newMove);
			detectAndSaveTrigger();
			renderText();
		}
	}
}

let preventContextMenu = true;
const contextMenuController = (e) => {
	if (preventContextMenu) {
		e.preventDefault();
	}
}

const mouseDown = (e) => {
	if (e.button != 2) {
		return;
	}
	// preventContextMenu = true;

	ignoreNextTrigger = false;
	mouseIsDown = true;
}

const mouseUp = (_) => {
	mouseIsDown = false;
	if (capturedMoves.length == 0) {
		preventContextMenu = !preventContextMenu;
	}
	capturedCoords = [];
	capturedMoves = [];
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if (!ignoreNextTrigger) {
		detectedTrigger?.fun();
	}
	detectedTrigger = null;
}

document.addEventListener('keydown', keyDown);
document.addEventListener('mousemove', mouseMove);
document.addEventListener('mousedown', mouseDown);
document.addEventListener('mouseup', mouseUp);
document.addEventListener("contextmenu", contextMenuController);

document.body.appendChild(canvas);
