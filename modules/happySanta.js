

const GROUP_ID = -167822712;


const {
	con, ccon, dateF, setTitle,
	rand, rl, now, colors, pJson,
	beep, configSet,
	StateCmd, stateCmd,
} = require("../lib/helper");

const 
	matchUpTop = /Вы поднялись в рейтинге!\n([0-9]+)\sместо\s\(([0-9]+)\+\s/i, // клик\)
	matchNewScore = /Твой счет: ([0-9]+)/i;

class Module {

	constructor( USER_ID, { updates, vk }, { setUTitle, catchMsg, captchaInterval, hideSpam }, { autoDrop, vbtap, HS_Payload } ) {

		this.USER_ID = USER_ID;
		this.vk = vk;
		this.updates = updates;

		this._clickNum = 0;
		this._topPos = 0;

		this.waitTAP = 0;

		this.fCapcha = 1;
		this.clickerTTL = 0;


		// Global
		this.setUTitle = setUTitle;
		this.catchMsg = catchMsg;

		this.captchaInterval = captchaInterval;
		this.hideSpam = hideSpam;

		// Module
		this.autoDrop = autoDrop;
		this.vbtap = vbtap;
		this.HS_Payload = HS_Payload;

		con("Модуль [" + colors.bold("HappySanta") + "] инициализирован");
	}

	init() {
		this.initReadLine();
		this.initUpdates();
		this.startClicker();
	}


	sWait(set) {
		this.waitTAP = set? (now()+set): false;
	}

	initReadLine() {
		rl.on("line", async (line) => {
			let temp;

			switch(line.trim().toLowerCase()) {

				case 'dev':
				case 'debug':
					console.log("-- happySanta --");
					console.log("vbtap", this.vbtap);
					console.log("waitTAP", this.waitTAP);
					console.log("clickNum", this.clickNum);
					console.log("topPos", this.topPos);
					console.log("HS_Payload", this.HS_Payload);

					console.log("autoDrop", this.autoDrop);
					break;


				case 't':
				case 'tap':
				case 'start':
					this.vbtap = !this.vbtap;
					con("Автокликер: [" + colors.bold(this.vbtap? "Запущен": "Отключен") + "]");
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

					this.autoDrop = temp;
					con("Автоматический вывод VK Coins при счете [" + colors.bold(this.autoDrop)+ "]");

					configSet("autoDrop", this.autoDrop, true);
					break;

				case 'drop':
					await this.sendDrop();
					break;

				case 'h':
				case 'help':
				case '?':
					ccon("-- happySanta --");
					ccon("drop		- вывести коины");
					break;

			}
		});
	}
	
	async initUpdates() {
		con("VK Updates установлен");
		const upd = this.updates;

		upd.on('message', async (context, next) => {
			const { text, isOutbox, peerId } = context;

			if(peerId != GROUP_ID)
				return;

			if(isOutbox) {
				if(text == "!stop") {
					this.vbtap = false;
					con("Автокликер: [" + colors.bold("Отключен") + "] SMS");
				}
				else if(text == "!start") {
					this.vbtap = true;
					con("Автокликер: [" + colors.bold("Запущен") + "] SMS");
				}
			}

			await next();
		});

		upd.hear(matchUpTop, async (context, next)=> {
			const { text } = context;
			await context.loadMessagePayload();
			try { this.vjuhPayload(context.payload); }catch(e) { }
			this._topPos = text.match(matchUpTop)[1];
			this._clickNum = text.match(matchUpTop)[2];

			!this.hideSpam && con("Позиция в топе ["+ colors.bold(this.topPos) +"]");
			await next();
		});
		upd.hear(matchNewScore, async (context, next)=> {
			const { text } = context;
			await context.loadMessagePayload();
			try { this.vjuhPayload(context.payload); }catch(e) { }
			this._clickNum = text.match(matchNewScore)[1];
			!this.hideSpam && con("Sync Tap ["+this.clickNum+"]");
			await next();
		});
		upd.hear("Выводить клики в коины можно только от 10 кликов.", async (context, next)=> {
			!this.hideSpam && con("Не хватает кликов для вывода", true);
			await next();
		});
		upd.hear("Коины перечислены на ваш баланс, ваш счет в боте обнулен.", async (context, next)=> {
			!this.hideSpam && con("Коины успешно переведены.", true);
			await next();
		});

		upd.start().catch(console.error);
	}

	async startClicker() {
		this.clickerTTL && clearInterval(this.clickerTTL);
		this.clickerTTL = setInterval(async _=> {
			
			if(!this.vbtap || this.waitTAP && (now() - this.waitTAP) < 0) {
				this.setUTitle(this.vbtap? ("Wait... "+(now() - this.waitTAP)): "Bot stopped");
				return;
			}

			this.sWait(60);

			if(this.autoDrop && this.clickNum >= this.autoDrop) {	
				await this.sendDrop();
			}

			try {
				await this.sendClick();
				!!rand(0,2) && await this.sendClick();
				this.sWait((this.clickNum%8==0)? 8*rand(1,3): false);
				this.setUTitle("Process Tap ["+this.clickNum+"]");
			} catch(e) {
				// TODO: Обработка капчи -> пауза
				console.log(e)

				if(e.code == 5 || e.code == 17)
					this.clickerTTL && clearInterval(this.clickerTTL);
				else if(e.code == 14) {
					this.setUTitle("Captcha wait...");
					!this.hideSpam && con("Ждём 1.5 минуты...");
					this.sWait(20*(++this.fCapcha)*0.9 + this.captchaInterval);
				}
				else this.sWait(false);

				this.catchMsg(e);

			}
		}, 12e2*rand(4,7));
	}

	async sendDrop() {
		const message = "Вывести коины на кошелек VK Coins";
		let res = await this.vk.api.messages.send({
			peer_id: GROUP_ID,
			message,
			payload: '"drop"',
		});

		!this.hideSpam && con("Drop VK Coins");
		this._clickNum = 0;
		return this;
	}
	async sendClick() {
		const message = "Клик (у тебя " + this.clickNum  + "+ кликов)";
		let res = await this.vk.api.messages.send({
			peer_id: GROUP_ID,
			message,
			payload: this.HS_Payload,
		});

		this._clickNum++;
		!this.hideSpam && con("Tap ["+this.clickNum+"]");
		return this;
	}

	vjuhPayload({ keyboard }) {
		if(!keyboard) return;
		const btns = keyboard.buttons;
		if(btns.length > 2) {
			const tapBtn = btns[0][0];
			// tapBtn.action.label // Parse text
			if(this.HS_Payload != tapBtn.action.payload) {
				this.HS_Payload = tapBtn.action.payload;
				con("ReSync KB payload ["+ colors.bold(this.HS_Payload) +"]", "red");
				configSet("HS_Payload", this.HS_Payload, true);
			}
		}
	}


	get clickNum() {
		return this._clickNum;
	}
	get topPos() {
		return this._topPos;
	}

}

module.exports = Module