const
	request = require('request'),
	ReadLine = require('readline'),
	beep = require('beepbeep'),
	colors = require('colors/safe');
const pJson = require('../package.json'),
	_izCap = require("./izCap");


const StateCmd = {
	NONE: 0,
	CONFIRM: 1,
	CUSTOM: 2,
};

// S
process.on('uncaughtException', err=> {
	console.log("\n*===*\nERR:");
	console.error(err);
	console.log("*===*\n");
});

let offColors = false,
	IZCap = false,
	_stateCmd = StateCmd.NONE, _stateCmd_CB;


colors.setTheme({
	dateBG: 'bgMagenta',
	dataC: 'yellow',
	warnBG: 'bgBlack',
	warn: 'yellow',
	errorBG: 'bgBlack',
	error: 'red'
});

function con(message, color, colorBG) {
	if(message === undefined) {
		console.log("\n")
		return;
	}
	let temp = (!offColors? colors.dateBG('['+dateF()+']'): dateF()) + ": "+ ccon(message, color, colorBG, 1);
	console.log(temp);
}
function ccon(message, color, colorBG, ret) {
	let temp="";
	if(message === undefined) {
		console.log("\n")
		return;
	}
	if(color === true) {
		color = "white";
		colorBG = "Red";
		temp = !offColors? colors.yellow.bgRed("[ОШИБКА]: "): "[ОШИБКА]: ";
	}
	colorBG = "bg"+ ((typeof colorBG == "string")?colorBG:"Black");
	color = (typeof color == "string")?color:"green";
	temp += !offColors? colors[colorBG](colors[color](message)): message;
	!ret && console.log(temp);
	return temp;
}
function dateF(date) {
	if(!isNaN(date) && date < 9900000000)
		date *= 1000; // UNIXto
	date = date!==undefined ? new Date(date) : new Date();
	
	var dYear = date.getFullYear(),
		dMonth = (date.getMonth() + 1).toString().padStart(2, 0),
		dDay = date.getDate().toString().padStart(2, 0),
		dHour = date.getHours().toString().padStart(2, 0),
		dMinutes = date.getMinutes().toString().padStart(2, 0),
		dSeconds = date.getSeconds().toString().padStart(2, 0),
		date_format = dDay +'.' +dMonth +'.' +dYear +' '+ dHour + ':' + dMinutes + ':' + dSeconds;
	
	return date_format;
}
function now() {
	return Math.floor(Date.now() / 1000);
}
function rand(min, max) {
	if(max===undefined) {
		max=min; min=0;
	}
	return Math.floor(min + Math.random() * (max + 1 - min));
}
function setTitle(title) {
	if (process.platform == 'win32') {
		process.title = title;
	} else {
		process.stdout.write('\x1b]2;' + title + '\x1b\x5c');
	}
}
function declOfNum(number, titles) {  
	cases = [2, 0, 1, 1, 1, 2];
	return titles[ (number%100>4 && number%100<20)? 2: cases[(number%10<5)? number%10: 5] ];
}

let xtime=0,
	utime=0
function getTime() {
	return now() - (xtime - utime);
}
function setTime(vk) {
	xtime = now();
	vk.api.call("utils.getServerTime")
	.then((response) => {
		utime = response;
		console.log('VK time: :', response);
	})
	.catch((error) => {
		console.error(error);
	});
}
function setColorsM(e) {
	offColors = !!e;
}

// ReadLine
let rl = ReadLine.createInterface(process.stdin, process.stdout, completer);
rl.setPrompt(colors.grey('_> '));
rl.prompt();
rl.isQst = false;
rl.questionAsync = (question) => {
	return new Promise((resolve) => {
		rl.isQst = true;
		rl.question(question, _=> {
			rl.isQst = false; resolve(_);
		});
	});
};
rl._writeToOutput = (s)=> {
	rl.output.write(rl.hideMode && !(/^\s*$/.test(s))? "*": s);
};
function completer(line) {
	let completions = getCurCompletions();
	let hits = completions.filter(c=> (c.indexOf(line) == 0 && (!_stateCmd_CB || _stateCmd_CB(c) )) );
	return [ hits && hits.length? hits: completions, line ];
}
function getCurCompletions() {
	const listCMDs = [
		"help, tap, drop, autodrop, tspam",
		" autoupdate, checkupdates, update",
		" captchainterval, captcha",
		" debug, beep",
	].join(",");

	let temp = _stateCmd == StateCmd.NONE? listCMDs:
		  _stateCmd == StateCmd.CONFIRM? "yes": /*, no*/
		  _stateCmd == StateCmd.CUSTOM && _stateCmd_CB? _stateCmd_CB():
		  "";
	return temp.replace(/,/g, "").split(' ');
}
// End.

function rndArray(array, id, floo) {
	floo = floo||0
	if(id === undefined)
		return array[Math.floor(Math.random() * array.length)]
	
	var nv = array[Math.floor(Math.random() * array.length)]
	
	if(floo > 10 || this.rndIDs[id] !== undefined && this.rndIDs[id].length >= array.length) {
		this.rndIDs[id] = []
		console.log("RND Reset: "+id)
	}
	
	if(this.rndIDs[id] === undefined) {
		this.rndIDs[id] = []
		console.log("RND Create: "+id)
	}
	
	if(this.rndIDs[id].indexOf(nv) == -1) {
		this.rndIDs[id].push(nv)
		console.log("Add to "+id+": "+nv)	
	}
	else if(array.length < 20) {
		return this.rndArray(array, id, floo++)
	}
	
	return nv;
}

const zleep = ms => new Promise(resolve => setTimeout(resolve, ms));


function stateCmd(s, cb) {
	if(s !== undefined) _stateCmd = s;
	return _stateCmd_CB = cb, _stateCmd;
}

// Init izCap
function initIZCap(uid) {
	IZCap = new _izCap("./data/configs/", "u"+uid, false, false);
}
async function configSet(name, value, save) {
	try {
		return await IZCap.set(name, value, save, false);
	} catch(e) {
		con("Не получилось сохранить. " + e.message);
	}
	return false;
}
function configGet(name, def) {
	return IZCap.get(name, def);
}
async function scanConfigs() {
	try {
		return await _izCap.scan("./data/configs/");
	} catch (e) { throw e; }
}
// End.

function downloadImage64(url) {
	return new Promise((resolve, reject)=> {
		request.get({
			uri: url,
			encoding: null
		}, (error, response, body)=> {
			if (error) {
				return reject(error)
			}
			return resolve('' + new Buffer(body).toString('base64'));
		});
	});
};

// For reset title
process.stdin.resume();
process.on('SIGINT', function () {
	setTitle("VCoin closed...");
	ccon("Выходим...");
	process.exit(2);
});

global._h = module.exports = {
	con, ccon, dateF,
	rand, rl, now,
	setTitle, setColorsM,
	rndArray, colors,
	setTime, getTime,
	pJson, zleep,
	beep,
	IZCap: _=>IZCap, initIZCap,
	configSet, configGet, scanConfigs,
	StateCmd, stateCmd,
	downloadImage64,
};