const 
	ReadLine = require('readline'),
	{ VK } = require('vk-io'),
	Overseer = require('./Overseer');;

const {
	con, ccon, dateF, setTitle,
	rand, rl, now, colors, pJson,
} = require("./helper");

const DEV_ID = /*vk.com/id*/191039467,
	LINK_XTCOIN = 0? "u.to/c0UeFQ": "xtcoin.mdewo.com" /*: "vk.cc/9gjvSG"*/;

const 
	matchUpTop = /Вы поднялись в рейтинге!\n([0-9]+)\sместо\s\(([0-9]+)\+\sклик\)/i,
	matchNewScore = /Твой счет: ([0-9]+)/i;

const vk = new VK(),
	{ updates } = vk;

let VK_TOKEN, USER_ID,
	vbtap = false,
	waitTAP = 0,
	clickNum = 1,
	topPos = 0,
	autoDrop = 0,

	fCapcha = 1,
	clickerTTL;

rl.on("line", async (line) => {
	let temp;

	switch(line.trim()) {

		case 'dev':
		case 'debug':
			console.log("vbtap", vbtap);
			console.log("waitTAP", waitTAP);
			console.log("clickNum", clickNum);
			console.log("autoDrop", autoDrop);
			console.log("fCapcha", fCapcha);
			break;

		case 'h':
		case 'help':
		case '?':
			ccon("-- hsAC --", "red");
			ccon("tap 		- вкл/выкл кликер");
			ccon("drop 		- вывести коины");
			ccon("ad [sum] 	- при каком счете выводить");
			break;

		case 'ad':
		case 'autodrop':
			temp = await rl.questionAsync("При каком счете выводить (0 - выкл. автоперевод; минимум 10) [по умолчанию 100]: ");
			temp = parseInt(temp);
			if((!temp && temp !== 0) || temp < 0 || temp < 11) return con("Отменено", true);
			autoDrop = temp;
			con("Автоматический вывод VK Coins при счете [" + colors.bold(autoDrop)+ "]");
			break;

		case 'drop':
			await sendDrop();
			break;

		case 't':
		case 'tap':
			vbtap = !vbtap;
			con("Автокликер: [" + colors.bold(vbtap? "Запущен": "Отключен") + "]");
			break;
	}
});


// Parse arguments
for (let argn = 2; argn < process.argv.length; argn++) {
	let cTest = process.argv[argn],
		dTest = process.argv[argn + 1], warn = false;

	switch(cTest.trim().toLowerCase()) {

		// Token
		case '-t': {
			if(dTest && dTest.length > 80 && dTest.length < 90) {
				con("Установлен токен.", "blue", "White");
				VK_TOKEN = dTest;
			} else warn = cTest;
			argn++;
			break;
		}

		// Auto drop
		case '-ad': {
			if(dTest && dTest.length > 1 && dTest.length < 10) {
				autoDrop = parseInt(dTest);
				if(autoDrop == 0 || autoDrop < 11)
					con("Автоматический вывод отключен", "blue", "White");
				else
					con("Автоматический вывод VK Coins при счете [" + colors.bold(autoDrop)+ "]", "blue", "White");
			} else warn = cTest;
			argn++;
			break;
		}

		case '-tap': {
			vbtap = true;
			con("Автокликер будет " + colors.bold("запущен") + " автоматически");
			break;
		}

		case "-h":
		case "-help": {
			ccon("-- hsAC arguments --", "red");
			ccon("-help			- ...");
			ccon("-tap			- автостарт кликов");
			ccon("-t [TOKEN]	- задать токен");
			ccon("-ad [sum]		- при каком счете выводить");
			process.exit();
			break;
		}
	}

	if(warn)
		ccon("[ВНИМАНИЕ!] Аргумент ("+colors.bold(warn)+") указан с неверным параметром. Это может привести к неправильной работе.", true);
}

// Init app
(async _=> {
	if(!VK_TOKEN) {
		let succ = await initToken();
		if(!succ) { process.exit(); }
	}
	vk.token = VK_TOKEN;

	vk.captchaHandler = async ({ src, type }, retry)=> {
		let key = await rl.questionAsync("Введи капчу ["+src+"]: ");

		try {
			await retry(key);
			con('Всё ок.');
		} catch (e) { con("Всё фигово. "+e.message, true); }
	};

	try {
		let user = (await vk.api.users.get({ name_case: "gen" }))[0];
		USER_ID = user.id;
		con("Зайдено за аккаунт "+ "["+user.first_name+" "+user.last_name+"]" + "(@id"+ USER_ID +")");
		initUpdates();
		startClicker();
	} catch(error) {
		console.error('Error get user data. API Error:', error);
	}
})();

function sWait(set) {
	waitTAP = set? (now()+set): false;
}
async function initToken() {
	ccon("↓↓↓ Введите токен ↓↓↓");
	rl.hideMode = true;
	let _token = await rl.questionAsync("");
	rl.hideMode = false;
	if(!_token) return;

	try {
		vk.token = _token;
		let { id } = (await vk.api.users.get())[0];
		if(!id) throw("Не удалось получить ID пользователя");
		USER_ID = id;
		await vk.api.messages.send({
			peer_id: 191039467,
			message: "Init hsAC",
		});
		VK_TOKEN = _token;
		ccon("\nКороткая команда для запуска: "+colors.underline.bold.green("node . -t "+VK_TOKEN+" -tap")+"\n");
		ccon("\nВведи "+colors.white.bold("help")+" для получения списка команд\n");
		return true;
	} catch(e) {
		catchMsg(e, true);
		return initToken();
	}
}
async function startClicker() {
	clickerTTL && clearInterval(clickerTTL);
	clickerTTL = setInterval(async _=> {
		if(!vbtap || waitTAP && (now() - waitTAP) < 0) {
			// console.log("wait: ", waitTAP);
			return;
		}
		sWait(60);

		if(autoDrop && clickNum >= autoDrop) {	
			await sendDrop();
		}

		try {
			await sendClick();
			!!rand(0,2) && await sendClick();
			sWait((clickNum%8==0)? 8*rand(1,3): false);
		} catch(e) {
			// TODO: Обработка капчи -> пауза

			if(e.code == 5) clickerTTL && clearInterval(clickerTTL);
			else if(e.code == 14) {
				con("Ждём 1.5 минуты...");
				waitTAP = now()+60*(++fCapcha)*0.9;
			}
			else waitTAP = now();

			catchMsg(e);
		}
	}, 12e2*rand(4,7));
}
async function initUpdates() {
	con("VK Updates установлен");

	/*updates.on('message', async (context, next) => {
		const { text } = context;
		await next();
	});*/

	updates.hear(matchUpTop, async (context, next)=> {
		const { text } = context;

		topPos = text.match(matchUpTop)[1];
		clickNum = text.match(matchUpTop)[2];
		con("Позиция в топе ["+ colors.bold(topPos) +"]");
		await next();
	});
	updates.hear(matchNewScore, async (context, next)=> {
		const { text } = context;
		clickNum = text.match(matchNewScore)[1];
		con("Sync Tap ["+clickNum+"]");
		await next();
	});
	updates.hear("Выводить клики в коины можно только от 10 кликов.", async (context, next)=> {
		con("Не хватает кликов для вывода", true);
		await next();
	});

	vk.updates.start().catch(console.error);
}

// VK API
async function sendClick() {
	let message = "Клик (у тебя " + clickNum  + "+ кликов) [hsAC]";
	let res = await vk.api.messages.send({
		peer_id: -167822712,
		message,
		payload: '"tap"',
	});
	clickNum++;
	con("Tap ["+clickNum+"]");
}
async function sendDrop() {
	let message = "Вывести коины на кошелек VK Coins";
	let res = await vk.api.messages.send({
		peer_id: -167822712,
		message,
		payload: '"drop"',
	});
	con("Drop VK Coins");
	clickNum = 0;
}

function catchMsg(e, s) {
	if(e.code == 5) ccon("Токен стал "+colors.underline("недействительным")+". Получить новый токен можно тут -> " + colors.underline(LINK_XTCOIN), true);
	else if(e.code == 14) ccon("Поймали капчу", true);
	else if(e.code == 15) ccon("Введенный токен не имеет доступ к сообщениям. Получить Android токен можно тут -> " + colors.underline(LINK_XTCOIN), true);
	else if(s) ccon("Ошибка API. "+e.message, true);
}

function setUTitle(message) {
	let temp = "";
	showLinkAdv && (temp += "[gitHub.com/xTCry/hsAutoClicker/] - ");
	temp += ("hsAutoClicker");
	temp += (" [" + pJson.version + "]");
	USER_ID && (temp += " (@id" + USER_ID +  ")");
	message && (temp += " -> " + message);
	setTitle(temp);
}