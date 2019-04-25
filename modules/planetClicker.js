

const GROUP_ID = -181268215;


const {
	con, ccon, dateF, setTitle,
	rand, rl, now, colors, pJson,
	beep, configSet, zleep,
	StateCmd, stateCmd,
} = require("../lib/helper");

const 
	// matchNewScore = /(Под вашим контролем|Вы владеете|Вы уже захватили).*? ([0-9]+)\s/i;
	matchNewScore = /(.*?)\\s([0-9]+)\s/i;

class Module {

	constructor( USER_ID, { updates, vk }, { setUTitle, catchMsg, captchaInterval, hideSpam }, { autoDrop, vbtap } ) {

		this.USER_ID = USER_ID;
		this.vk = vk;
		this.updates = updates;

		this._clickNum = 0;

		this.waitTAP = 0;

		this.fCapcha = 1;
		this.clickerTTL = 0;


		// Global
		this.setUTitle = setUTitle;
		this.catchMsg = catchMsg;

		this.captchaInterval = captchaInterval;
		this.hideSpam = hideSpam;

		// Module
		this.vbtap = vbtap;

		con("Модуль [" + colors.bold("PlanetClicker") + "] инициализирован");
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
					console.log("-- planetClicker --");
					console.log("vbtap", this.vbtap);
					console.log("waitTAP", this.waitTAP);
					console.log("clickNum", this.clickNum);

					break;

				case 'up':
				case 'pup':
					tryUpgrade();
					break;

				case 't':
				case 'tap':
				case 'start':
					this.vbtap = !this.vbtap;
					con("Автокликер: [" + colors.bold(this.vbtap? "Запущен": "Отключен") + "]");
					break;

				case 'h':
				case 'help':
				case '?':
					ccon("-- planetClicker --");
					ccon("pup		- попробовать улучшить планету");
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

		upd.hear(matchNewScore, async (context, next)=> {
			const { text } = context;
			this._clickNum = text.match(matchNewScore)[2];
			!this.hideSpam && con("Sync Tap ["+this.clickNum+"]");
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

	async sendClick() {
		const message = "🌍";
		let res = await this.vk.api.messages.send({
			peer_id: GROUP_ID,
			message,
			payload: '{"command":"action","item":"planet_tap"}',
		});

		this._clickNum++;
		!this.hideSpam && con("Tap ["+this.clickNum+"]");
		return this;
	}

	async tryUpgrade() {
		const message = "Улучшить 🚀";
		let res = await this.vk.api.messages.send({
			peer_id: GROUP_ID,
			message,
			payload: '{"command":"action","item":"upgrade"}',
		});

		await zleep(10);

		let res2 = await this.vk.api.messages.send({
			peer_id: GROUP_ID,
			message,
			payload: '{"command":"confirm","item":"upgrade"}',
		});

		!this.hideSpam && con("Try Upgrade...");
		return this;
	}


	get clickNum() {
		return this._clickNum;
	}

}


module.exports = Module