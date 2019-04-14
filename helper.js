const
	ReadLine = require('readline'),
	colors = require('colors/safe');
const pJson = require('./package.json');

// S
process.on('uncaughtException', err=> {
	console.log("\n*===*\nERR:");
	console.error(err);
	console.log("*===*\n");
});

let offColors = false;

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

let rl = ReadLine.createInterface(process.stdin, process.stdout);
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

global._h = module.exports = {
	con, ccon, dateF,
	rand, rl, now,
	setTitle, setColorsM,
	rndArray, colors,
	setTime, getTime,
	pJson, zleep,
};