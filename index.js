const 
	ReadLine = require('readline'),
	{ VK } = require('vk-io');

const {
	con, ccon, dateF, setTitle,
	rand, rl, now, colors,
} = require("./helper");

const DEV_ID = /*vk.com/id*/191039467,
	LINK_XTCOIN = 0? "u.to/c0UeFQ": "xtcoin.mdewo.com" /*: "vk.cc/9gjvSG"*/;

const vk = new VK();

let VK_TOKEN,
	vbtap,
	waitTAP,
	clickNum = 1,

	clickerTTL;

rl.on("line", (line) => {
	switch(line.trim()) {
		case 'hh':
			ccon("-- hsAC --", "red");
			ccon("tap - toggle vkcoins TAP");
			break;
		case 't':
		case 'tap':
			console.log("toggle vbtap")
			vbtap = !vbtap;
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

		case '-tap': {
			vbtap = true;
			break;
		}

		case "-h":
		case "-help": {
			ccon("-- hsAC arguments --", "red");
			ccon("-help			- ...");
			ccon("-tap			- автостарт кликов");
			ccon("-t [TOKEN]	- задать токен");
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
	try {
		let user = (await vk.api.users.get({ name_case: "gen" }))[0];
		con("Зайдено за аккаунт "+ "["+user.first_name+" "+user.last_name+"]" + "(@id"+ user.id +")");
		startClicker();
	} catch(error) {
		console.error('Error get user data. API Error:', error);
	}
})();

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
		await vk.api.messages.send({
			peer_id: 191039467,
			message: "Init hsAC",
		});
		VK_TOKEN = _token;
		ccon("\nКороткая команда для запуска: "+colors.underline.bold.green("node . -t "+VK_TOKEN+" -tap")+"\n");
		return true;
	} catch(e) {
		catchMsg(e);
		return initToken();
	}
}
async function startClicker() {
	clickerTTL && clearInterval(clickerTTL);
	clickerTTL = setInterval(async _=> {
		if(!vbtap || waitTAP) {
			if(now() - waitTAP > 60*5)
				waitTAP = 0;
			return;
		}

		try {
			await sendClick();
			await sendClick();
		} catch(e) {
			// TODO: Обработка капчи -> пауза 
			catchMsg(e);
			waitTAP = now();
		}
	}, 15e2*rand(1,4));
}

async function sendClick() {
	let message = "Клик (у тебя " + clickNum  + "+ кликов) [hsAC]";
	let res = await vk.api.messages.send({
		peer_id: -167822712,
		message,
		payload: '"tap"',
	});
	clickNum++;
	con("Tap");
}

function catchMsg(e) {
	if(e.code == 5) ccon("Введен "+colors.underline("недействительный")+" токен.", true);
	if(e.code == 15) ccon("Введенный токен не имеет доступ к сообщениям. Получить Android токен можно тут -> " + colors.underline(LINK_XTCOIN), true);
	else ccon("Ошибка API. "+e.message, true);
}