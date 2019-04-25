const 
	ReadLine = require('readline'),
	{ VK } = require('vk-io'),
	Overseer = require('./lib/Overseer'),
	AntiCaptcha = require('anti-captcha');


const HappySanta = require('./modules/happySanta'),
	PlanetClicker = require('./modules/planetClicker');

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
	LINK_XTCOIN = 0? "u.to/c0UeFQ": "xtcoin.mdewo.com" /*: "vk.cc/9gjvSG"*/;


const vk = new VK(),
	{ updates } = vk;

let // Global for module
	VK_TOKEN, USER_ID, TEMP_USER_ID = false
	captchaService = false,
	captchaProc = false,
	selectUserConfig = false;

let	// User config
	pBeep = true,
	hideSpam = false,
	tsCaptcha = false,
	captchaToken = false,
	captchaInterval = 2,
	selectModule = "hs",

	// Module
	vbtap = false,
	autoDrop = 100;


rl.on("line", async (line) => {
	let temp;

	switch(line.trim().toLowerCase()) {

		case 'dev':
		case 'debug':

			console.log("pBeep", pBeep);
			console.log("hideSpam", hideSpam);
			console.log("tsCaptcha", tsCaptcha);
			console.log("captchaToken", captchaToken);
			console.log("captchaInterval", captchaInterval);
			console.log("selectModule", selectModule);

			console.log("captchaProc", captchaProc);			
			console.log("fCapcha", fCapcha);
			break;

		case 'h':
		case 'help':
		case '?':
			ccon("-- hsAC [" + colors.bold(pJson.version) + "] --", "red");
			ccon("tap		- вкл/выкл кликер");
			ccon("ad		- задать значение автовывода");
			ccon("captcha	- установка обработки капчи");
			ccon("tspam		- вкл/откл вывод доп. инфы");
			ccon("beep		- вкл/откл звука");
			ccon("capInt	- установить интервал паузы после капчи");
			ccon("selMod	- выбрать модуль для кликера");
			break;



		case 'tspam':
			hideSpam = !hideSpam;
			gModule && (gModule.hideSpam = hideSpam);
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
			gModule && (gModule.captchaInterval = captchaInterval);
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

		case 'selectmodule':
		case 'selmod':
			stateCmd(StateCmd.CUSTOM, _=> "happysanta, planetclicker");
			temp = await rl.questionAsync("Выбор модуля [happysanta, planetclicker]: ");
			stateCmd(StateCmd.NONE);

			if(!temp || ![ "happysanta", "planetclicker", "ps", "hs" ].includes(temp)) return con("Отменено");

			con("Выбран модуль [" + colors.bold(temp) + "].");
			if(selectModule != temp)
				con("Для активации модуля надо перезапустить приложение!", true);
			selectModule = temp;
			configSet("selectModule", selectModule, true);
			
			break;

	}
});


// Parse arguments
for (let argn = 2; argn < process.argv.length; argn++) {
	let cTest = process.argv[argn],
		dTest = process.argv[argn + 1], warn = false;

	switch(cTest.trim().toLowerCase()) {

		// User ID
		case '-uid': {
			if(dTest && dTest.length > 1 && dTest.length < 15) {
				con("Установлен ID пользователя.", "blue", "White");
				TEMP_USER_ID = parseInt(dTest);
			} else warn = cTest;
			argn++;
			break;
		}

		// Token
		case '-t': {
			if(dTest && dTest.length > 80 && dTest.length < 90) {
				con("Установлен токен.", "blue", "White");
				VK_TOKEN = dTest;
			} else warn = cTest;
			argn++;
			break;
		}

		// Module
		case '-mod': {
			if(dTest && dTest.length > 80 && dTest.length < 90) {

				if(!dTest || ![ "happysanta", "planetclicker", "ps", "hs" ].includes(dTest)) return con("Отменено");

				con("Выбран модуль [" + colors.bold(dTest) + "].", "blue", "White");
				selectModule = dTest;
			} else warn = cTest;
			argn++;
			break;
		}

		// Auto drop
		case '-ad': {
			if(dTest && dTest.length > 1 && dTest.length < 10) {

				dTest = parseInt(dTest);
				if(dTest === 0) {
					con("Автоматический вывод VK Coins [" + colors.bold("отключен")+ "]", "blue", "White");
				}
				else if((!dTest && dTest !== 0) || dTest < 0 || dTest < 10)
					return warn = cTest;

				autoDrop = dTest;
				con("Автоматический вывод VK Coins при счете [" + colors.bold(autoDrop)+ "]", "blue", "White");

			} else warn = cTest;
			argn++;
			break;
		}

		case '-tap':
		case '-start': {
			vbtap = true;
			con("Автокликер будет " + colors.bold("запущен") + " автоматически", "blue", "White");
			break;
		}

		// Select of user config
		case '-slist': {
			selectUserConfig = true;
			break;
		}

		case "-h":
		case "-help": {
			ccon("-- hsAC arguments --", "red");
			ccon("-help			- ...");
			ccon("-start		- автостарт кликов");
			ccon("-t [TOKEN]	- задать токен");
			ccon("-ad [sum]		- при каком счете выводить");
			ccon("-mod [name]	- какой модуль запустить [hs/pc]");
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
	ccon("Загрузка конфигурации...");

	let firstInit = false;
	if(selectUserConfig) {
		try {
			let res = await scanConfigs();
			if(res.length > 0) {
				res = await trySelectConfig(res);
				if(res) {
					ccon("Загрузка пользователя @id"+res, "yellow");
					ccon("Короткая команда для запуска этой конфигурации: "+colors.underline.bold.green("node . -uid "+res));
				}
			}
		} catch(e) {
			ccon("Не смогли получить конфигурации пользователей. "+e.message, true);
		}
	}

	try {
		if(TEMP_USER_ID)
			await InitApp(TEMP_USER_ID)
	} catch(e) { con(e, true) }

	if(!VK_TOKEN) {
		stateCmd(StateCmd.CONFIRM);
		let conf = await rl.questionAsync("Создать конфигурацю для нового пользователя? [yes]: ");
		stateCmd(StateCmd.NONE);

		if(conf == "yes") {
			try {
				await createNewConfig();
				try {
					if(TEMP_USER_ID)
						await InitApp(TEMP_USER_ID);
					firstInit = true;
				} catch(e) { }
			} catch(e) {
				ccon("Не удалось создать конфиг. "+e, true);
			}
		}

		if(!VK_TOKEN) {
			con("Токен не указан. Получить ТОКЕН можно тут -> " + colors.underline(LINK_XTCOIN), true);
			return process.exit();
		}
	}

	vk.token = VK_TOKEN;
	initCaptcha();

	try {
		let user = (await vk.api.users.get({ name_case: "gen" }))[0];
		USER_ID = user.id;
		con("Зайдено за аккаунт "+ "["+user.first_name+" "+user.last_name+"]" + "(@id"+ USER_ID +")");
		await SaveApp(firstInit);
		setUTitle("Ready");

		initModule();

	} catch(error) {
		console.error('Error get user data. API Error:', error);
	}

})();


async function initModule() {

	let typO;

	switch(selectModule.toLowerCase()) {
		case "planetclicker":
		case "pc":
			typO = PlanetClicker;
			break;

		case "happysanta":
		case "hs":
		default:
			typO = HappySanta;
			break;
	}

	gModule = new typO(USER_ID, { vk, updates }, { setUTitle, catchMsg, captchaInterval, hideSpam }, { autoDrop, vbtap });
	gModule.init();

}



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
async function SaveApp(firstInit) {

	try {
		if(!TEMP_USER_ID)
			await InitApp(USER_ID);
	} catch(e) {
		ccon("Ошибка инициализации конфига: "+e.message, true);
	}

	setUTitle("Saving...");

	{
		// Modules
		if(firstInit) {
			configSet("autoDrop", autoDrop);
			configSet("captchaInterval", captchaInterval);
		}

		// Global
		configSet("VK_TOKEN", VK_TOKEN);
		configSet("pBeep", pBeep);
		configSet("tsCaptcha", tsCaptcha);
		configSet("captchaToken", captchaToken);
		await configSet("hideSpam", hideSpam, true); // true - Save config
	}

	if(TEMP_USER_ID != USER_ID || firstInit) {
		fullLog() && ccon("Конфигурация для @id"+USER_ID+" сохранена."); ccon("\n");
		ccon("Короткая команда для запуска: "+colors.underline.bold.green("node . -uid "+USER_ID));
		ccon("\n");
	}
}

async function trySelectConfig(list) {
	let msg = "Выбор конфигурации пользователя:";

	for (let i = 0; i < list.length; i++) {
		if(list[i][0] == "u") list[i] = list[i].slice(1);
		msg += (i%2==0?"\n":"\t")+(i+1)+". User @id"+list[i].split(".")[0] + (i%2==0?"\t| ":"")
	}
	ccon(msg);

	let data = await rl.questionAsync("Введите номер пользователя [или Enter  для создания нового]: ");
	if(data >= 1 && data <= list.length) {
		return TEMP_USER_ID = parseInt(list[data-1].split(".")[0]);
	}
	else {
		if(0 == data) return false;
		return await trySelectConfig(list);
	}
}


// Captcha worker
function initCaptcha(sm=false) {

	// Set captcha service
	if(tsCaptcha && captchaToken) {
		if(tsCaptcha == "anti-captcha") {
			captchaService = AntiCaptcha('https://anti-captcha.com', captchaToken);
			(!hideSpam || sm) && con("Установлен обработчик капчи [" + colors.bold(tsCaptcha) + "]");
		}
	}
}

vk.captchaHandler = async ({ src, type }, retry)=> {
	if(captchaProc)
		return con("Капча в процессе...");
	
	captchaProc = true;
	pBeep&&beep(2, 1e2);

	if(tsCaptcha && captchaService) {
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


async function createNewConfig(exit, authType) {
	!exit && ccon("Мастер настройки пользователя", "yellow");

	if(!authType) {
		stateCmd(StateCmd.CUSTOM, _=> ("token, password"));
		authType = await rl.questionAsync("С помощью чего авторизироваться? [token/password]: ");
		stateCmd(StateCmd.NONE);
	}

	if(authType == "token") {
		ccon("↓↓↓ Введите токен ↓↓↓");
		rl.hideMode = true;
		let _token = await rl.questionAsync("");
		rl.hideMode = false;
		if(!_token) return;

		try {
			vk.token = _token;
			let { id } = (await vk.api.users.get())[0];
			if(!id) throw("Не удалось получить ID пользователя");
			await vk.api.messages.send({
				peer_id: /*DEV_ID*/ id,
				message: "Init hsAC ["+pJson.version+"]",
			});
			// USER_ID = id;
			TEMP_USER_ID = id;
			VK_TOKEN = _token;
			// ccon("\nКороткая команда для запуска: "+colors.underline.bold.green("node . -t "+VK_TOKEN+" -tap")+"\n");
			ccon("\nВведи "+colors.white.bold("help")+" для получения списка команд\n");
			return true;
		} catch(e) {
			catchMsg(e, true);
			return createNewConfig(true, authType);
		}
	}
	else if(authType == "password") {

		let res = await loginVK();

		if(res && res.user > 0) {
			VK_TOKEN = res.token;
			TEMP_USER_ID = res.user;
			ccon("Токен установлен.");
			return true;
		}
		else {
			ccon("Проблема с авторизацией. Попробуйте еще раз", true);
			return createNewConfig(true, authType);
		}
		return true;
	}
	else {
		if(exit) throw "Авторизация отменена";
		else return /*await*/ createNewConfig(true);
	}
}

async function loginVK() {

	let login = await rl.questionAsync("Лоигн: ");

	console.log("Пароль: ");
	rl.hideMode = true;
	let password = await rl.questionAsync("");
	rl.hideMode = false;

	vk.setOptions({
		login,
		password,
	});

	const direct = vk.auth.androidApp();

	vk.twoFactorHandler = async (none, retry)=> {
		let code = await rl.questionAsync("Введи 2FA код: ");

		try {
			await retry(code);
			ccon('Успешно', "yellow");
		} catch (e) { ccon(e.message, true); }
	};

	let res = false;
	try {
		res = await direct.run();
	} catch(e) {
		if (e instanceof AuthError) {
			if (e.code === authErrors.AUTHORIZATION_FAILED) {
				console.error(e.message);
				ccon('Авторизация провалилась', true);
			}
			else if (e.code === authErrors.PAGE_BLOCKED) {
				ccon('Страница заблокирована :c', true);
			}
			else console.error(e);
		}
	}

	return res;
}



function catchMsg(e, s) {
	if(e.code == 5) ccon("Токен стал "+colors.underline("недействительным")+". Получить новый токен можно тут -> " + colors.underline(LINK_XTCOIN), true);
	else if(e.code == 14) ccon("Поймали капчу", true);
	else if(e.code == 15) ccon("Введенный токен не имеет доступ к сообщениям. Получить Android токен можно тут -> " + colors.underline(LINK_XTCOIN), true);
	else if(e.code == 17) ccon("С этой страницей всё очень плохо.", true);
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
