const 
	ReadLine = require('readline'),
	{ VK } = require('vk-io'),
	Overseer = require('./lib/Overseer'),
	AntiCaptcha = require('anti-captcha');

const {
	con, ccon, dateF, setTitle,
	rand, rl, now, colors, pJson,
	beep,
	StateCmd, stateCmd,
	IZCap, initIZCap,
	configSet, configGet, scanConfigs,
	downloadImage64,
} = require("./lib/helper");

const DEV_ID = /*vk.com/id*/191039467,
	GROUP_ID = -167822712,
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

	// User config
	pBeep = true,
	autoDrop = 100,
	hideSpam = false,
	tsCaptcha = false,
	captchaToken = false,
	captchaInterval = 2,

	captchaService,
	captchaProc = false,
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
			console.log("topPos", topPos);

			console.log("pBeep", pBeep);
			console.log("autoDrop", autoDrop);
			console.log("hideSpam", hideSpam);
			console.log("tsCaptcha", tsCaptcha);
			console.log("captchaToken", captchaToken);
			console.log("captchaInterval", captchaInterval);

			console.log("captchaProc", captchaProc);			
			console.log("fCapcha", fCapcha);
			break;

		case 'h':
		case 'help':
		case '?':
			ccon("-- hsAC [" + colors.bold(pJson.version) + "] --", "red");
			ccon("tap		- вкл/выкл кликер");
			ccon("drop		- вывести коины");
			ccon("ad		- задать значение автовывода");
			ccon("captcha	- установка обработки капчи");
			ccon("tspam		- вкл/откл вывод доп. инфы");
			ccon("beep		- вкл/откл звука");
			ccon("captchaInterval - установить интервал паузы после капчи");
			break;

		case 'ad':
		case 'autodrop':
			temp = await rl.questionAsync("При каком счете выводить (0 - выкл. автоперевод; минимум 10) [по умолчанию 100]: ");
			temp = parseInt(temp);
			if(temp === 0) {
				con("Автоматический вывод VK Coins [" + colors.bold("отключен")+ "]");
			}
			else if((!temp && temp !== 0) || temp < 0 || temp < 10)
				return con("Отменено", true);
			autoDrop = temp;
			con("Автоматический вывод VK Coins при счете [" + colors.bold(autoDrop)+ "]");

			configSet("autoDrop", autoDrop, true);
			break;

		case 'drop':
			await sendDrop();
			break;

		case 't':
		case 'tap':
			vbtap = !vbtap;
			con("Автокликер: [" + colors.bold(vbtap? "Запущен": "Отключен") + "]");
			break;

		case 'tspam':
			hideSpam = !hideSpam;
			con("Вывод доп. инфы в консоль " + (hideSpam? "от": "в") + "ключен (*^.^*)", "blue", "White");
			configSet("hideSpam", hideSpam, true);
			break;

		case 'beep':
			pBeep = !pBeep;
			pBeep&&beep(2, 8e2);
			con("Звуковое сопровождение " + (!pBeep? "от": "в") + "ключено (*^.^*)", "blue", "White");
			configSet("pBeep", pBeep, true);
			break;

		case 'capint':
		case 'captchainterval':
			temp = await rl.questionAsync("Введите интервал паузы после капчи (секунды): ");
			if(!temp) return;
			captchaInterval = parseInt(temp);
			con("Интервал после капчи " + captchaInterval + " секунд.");
			configSet("captchaInterval", captchaInterval, true);
			break;

		case 'captcha':
		case 'setcaptcha':
			let typeServCap = "anti-captcha";
			// stateCmd(StateCmd.CUSTOM, _=> "anti-captcha");
			// typeServCap = await rl.questionAsync("Введите ID пользователя [disable для отключения автоперевода]: ");
			// stateCmd(StateCmd.NONE);
			console.log("Какой сервис использовать [anti-captcha]: anti-captcha");

			temp = await rl.questionAsync("Введите токен сервиса: ");
			if(!temp) return con("Отменено");
			if(temp.length > 5) {

				captchaToken = temp;
				tsCaptcha = typeServCap;
				initCaptcha(true);
				configSet("captchaToken", captchaToken);
				configSet("tsCaptcha", tsCaptcha, true);
			}
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
				if(autoDrop == 0 || autoDrop < 10)
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
	setUTitle("Loading app");

	try {
		await InitApp();
	} catch(e) {}

	if(!VK_TOKEN) {
		let succ = await initToken();
		if(!succ) { process.exit(); }
		try {
			await InitApp();
		} catch(e) { }
	}
	vk.token = VK_TOKEN;

	initCaptcha();

	try {
		let user = (await vk.api.users.get({ name_case: "gen" }))[0];
		USER_ID = user.id;
		con("Зайдено за аккаунт "+ "["+user.first_name+" "+user.last_name+"]" + "(@id"+ USER_ID +")");
		await SaveApp();
		setUTitle("Ready");
		initUpdates();
		startClicker();
	} catch(error) {
		console.error('Error get user data. API Error:', error);
	}

})();


async function InitApp(uid = 0) {

	initIZCap(uid);

	let g;
	try {
		g = await IZCap().load();
	} catch(e) {};

	if(g) false && ccon("Конфигурация загружена", "yellow");
	else throw "Конфиг не найден.";

	{
		VK_TOKEN = configGet("VK_TOKEN", VK_TOKEN);
		pBeep = configGet("pBeep", pBeep);
		autoDrop = configGet("autoDrop", autoDrop);
		hideSpam = configGet("hideSpam", hideSpam);
		tsCaptcha = configGet("tsCaptcha", tsCaptcha);
		captchaToken = configGet("captchaToken", captchaToken);
		captchaInterval = configGet("captchaInterval", captchaInterval);
	}

	return true;
}
async function SaveApp() {

	setUTitle("Saving...");

	{
		configSet("VK_TOKEN", VK_TOKEN);
		configSet("pBeep", pBeep);
		configSet("autoDrop", autoDrop);
		configSet("tsCaptcha", tsCaptcha);
		configSet("captchaToken", captchaToken);
		configSet("captchaInterval", captchaInterval);
		await configSet("hideSpam", hideSpam, true); // true - Save config
	}
}

function initCaptcha(sm=false) {

	// Set captcha service
	if(tsCaptcha && captchaToken) {
		if(tsCaptcha == "anti-captcha") {
			captchaService = AntiCaptcha('https://anti-captcha.com', captchaToken);
			(!hideSpam || sm) && con("Установлен обработчик капчи [" + colors.bold(tsCaptcha) + "]");
		}
	}
}

// Captcha worker
vk.captchaHandler = async ({ src, type }, retry)=> {
	if(captchaProc)
		return con("Капча в процессе...");
	
	captchaProc = true;
	pBeep&&beep(2, 1e2);

	if(tsCaptcha) {
		if(tsCaptcha == "anti-captcha") {
			
			try {
				let base64 = await downloadImage64(src);
				let captcha = await captchaService.uploadCaptcha(base64);
				let captchaCode = await captchaService.getText(captcha);

				try {
					await retry(captchaCode.text);
					con("Капча пройдена");
				} catch(error) {
					con('Captcha введена неверно'+ error.message, true);
					captchaService.reportBad(captcha).then(()=>{ con("Отправлен Репотр о неверной капче ", true) });
				}

			} catch(error) {
				ccon('Error captcha: '+ error, true);
			}

			captchaProc = false;
		}
	}
	else {
		let key = await rl.questionAsync("Введи капчу ["+src+"]: ");
		try {
			await retry(key);
			con('Всё ок.');
		} catch (e) { con("Всё фигово. "+e.message, true); }
		captchaProc = false;
	}
};


// End.


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
			peer_id: /*DEV_ID*/ USER_ID,
			message: "Init hsAC",
		});
		VK_TOKEN = _token;
		// ccon("\nКороткая команда для запуска: "+colors.underline.bold.green("node . -t "+VK_TOKEN+" -tap")+"\n");
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
			setUTitle(vbtap? ("Wait... "+(now() - waitTAP)): "Bot stopped");
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
			setUTitle("Process Tap ["+clickNum+"]");
		} catch(e) {
			// TODO: Обработка капчи -> пауза

			if(e.code == 5) clickerTTL && clearInterval(clickerTTL);
			else if(e.code == 14) {
				setUTitle("Captcha wait...");
				!hideSpam && con("Ждём 1.5 минуты...");
				sWait(20*(++fCapcha)*0.9 + captchaInterval);
			}
			else sWait(false);

			catchMsg(e);
		}
	}, 12e2*rand(4,7));
}
async function initUpdates() {
	con("VK Updates установлен");

	updates.on('message', async (context, next) => {
		const { text, isOutbox, peerId } = context;
		
		if(peerId != GROUP_ID)
			return;
		
		if(isOutbox) {
			if(text == "!stop") {
				vbtap = false;
				con("Автокликер: [" + colors.bold("Отключен") + "] SMS");
			}
			else if(text == "!start") {
				vbtap = true;
				con("Автокликер: [" + colors.bold("Запущен") + "] SMS");
			}
		}

		await next();
	});

	updates.hear(matchUpTop, async (context, next)=> {
		const { text } = context;

		topPos = text.match(matchUpTop)[1];
		clickNum = text.match(matchUpTop)[2];
		!hideSpam && con("Позиция в топе ["+ colors.bold(topPos) +"]");
		await next();
	});
	updates.hear(matchNewScore, async (context, next)=> {
		const { text } = context;
		clickNum = text.match(matchNewScore)[1];
		!hideSpam && con("Sync Tap ["+clickNum+"]");
		await next();
	});
	updates.hear("Выводить клики в коины можно только от 10 кликов.", async (context, next)=> {
		!hideSpam && con("Не хватает кликов для вывода", true);
		await next();
	});
	updates.hear("Коины перечислены на ваш баланс, ваш счет в боте обнулен.", async (context, next)=> {
		!hideSpam && con("Коины успешно переведены.", true);
		await next();
	});

	vk.updates.start().catch(console.error);
}

// VK API
async function sendClick() {
	let message = "Клик (у тебя " + clickNum  + "+ кликов) (hsAC ["+pJson.version+"] )";
	let res = await vk.api.messages.send({
		peer_id: GROUP_ID,
		message,
		payload: '"tap"',
	});
	clickNum++;
	!hideSpam && con("Tap ["+clickNum+"]");
}
async function sendDrop() {
	let message = "Вывести коины на кошелек VK Coins";
	let res = await vk.api.messages.send({
		peer_id: GROUP_ID,
		message,
		payload: '"drop"',
	});
	!hideSpam && con("Drop VK Coins");
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
	false && (temp += "[gitHub.com/xTCry/hsAutoClicker/] - ");
	temp += ("hsAutoClicker");
	temp += (" [" + pJson.version + "]");
	USER_ID && (temp += " (@id" + USER_ID +  ")");
	message && (temp += " -> " + message);
	setTitle(temp);
}
