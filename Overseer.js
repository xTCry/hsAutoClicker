/*
	File: Overseer.js
	Description: Overseer application
	Created by: xTCry
	Date: 14.04.2019 17:31
	Idea from @TemaSM
*/

const AutoUpdater = require('auto-updater'),
	{ execSync } = require('child_process'),
	Sentry = require('@sentry/node'),
	os = require('os');

const {
	con, ccon, setTitle, zleep,
	rand, rl, now, colors, pJson,
} = require("./helper");

(async () => {
	Sentry.init({
		dsn: 'https://b6793fd6b25c433f8d597e560be71c8a@sentry.io/1438631',
		sampleRate: 1,
		debug: false,
	});

	Sentry.configureScope(scope => {
		const info = {
			username: os.userInfo().username + '@' + os.hostname(),
			os_type: os.type(),
			os_platform: os.platform(),
			os_arch: os.arch(),
			os_release: os.release(),
			os_totalmem: (os.totalmem() / 1024 / 1024).toFixed(2),
			os_cpus: String(os.cpus().length),
			argv: process.argv.join(' '),
		};
		scope.setUser(info);
		process.on('uncaughtException', function (err) {
			Sentry.captureException(err);
		});
	});
})();

/*execSync('npm i --only=prod --no-audit --no-progress', { cwd: __dirname }, { stdio: 'inherit' })
*/

let needRestart = false,
	checkUpdates, autoUpdate;

let autoupdater = new AutoUpdater({
	// autoupdate: false,
	checkgit: true,
});

autoupdater.on('git-clone', _=> {
	con('Автоматическое обновление не доступно, так как вы клонировали репозиторий! Для автоматического обновления удалите папку '+colors.bold(".git"), true);
});

autoupdater.on('check.up-to-date', v=> {
	con('У вас установлена актуальная версия: ' + v, 'white', 'Green');
});
autoupdater.on('check.out-dated', (v_old, v)=> {
	con('У вас устаревшая версия: ' + v_old, 'white', 'Red');
	if (!autoUpdate && !updateOnce) {
		con('Актуальная версия: ' + v + '. Для ее установки введите команду' + colors.bold("update"), 'white', 'Red');
	}
	else {
		con('Актуальная версия: ' + v + '. Приступаю к обновлению...', 'white', 'Green');
		autoupdater.fire('download-update');
	}
});

autoupdater.on('update.downloaded', _=> {
	con('Обновление успешно загружено! Начинаю установку...', 'white', 'Green');
	autoupdater.fire('extract');
});
autoupdater.on('update.not-installed', _=> {
	con('Обновление уже загружено! Начинаю установку...', 'white', 'Green');
	autoupdater.fire('extract');
});
autoupdater.on('update.extracted', _=> {
	con('Обновление успешно установлено!', 'white', 'Green');
	needRestart = true
	let depDiff = autoupdater.fire('diff-dependencies')
	con('Для применения обновления требуется перезапуск бота!', 'white', 'Green');
	if (depDiff.count > 0)
		con('У обновленной версии были изменены зависимости.', 'white', 'Red');
});

autoupdater.on('download.start', name=> {
	con('Начинаю загрузку ' + name, 'white', 'Green');
});
autoupdater.on('download.end', name=> {
	con('Завершена загрузка ' + name, 'white', 'Green');
});
autoupdater.on('download.error', err=> {
	con('Возникла ошибка при загрузке: ' + err, true);
});

autoupdater.on('end', (name, e)=> {
	if (checkUpdates) {
		setTimeout(_=> {
			autoupdater.fire('check');
		}, updatesInterval * 60 * 1e3);
	}
	updateOnce = false;
});
autoupdater.on('error', (name, e)=> {
	console.error(name, e);
	if (checkUpdates) {
		setTimeout(_=> {
			autoupdater.fire('check');
		}, updatesInterval * 60 * 1e3);
	}
});



function notifyToRestart () {
	if (needRestart)
		con('Для применения обновления требуется перезапуск бота!', 'white', 'Green');
}
setInterval(notifyToRestart, 6e5);

(async () => {
	await zleep(10);

	if (checkUpdates) {
		autoupdater.fire('check');
	}

	rl.on("line", async (line) => {
		let temp;

		switch(line.trim()) {
			case 'autoupdate':
				autoUpdate = !autoUpdate;
				con("Автоматическое обновление [" + colors.bold(autoUpdate? "включено": "выключено") + "]");
				break;

			case 'checkupdates':
				checkUpdates = !checkUpdates;
				con("Проверка обновлений [" + colors.bold(checkUpdates? "включена": "выключена") + "]");
				break;

			case 'update':
				updateOnce = true;
				autoupdater.fire('check');
				break;

			case 'help':
			case 'h':
			case '?':
				ccon("-- Обновлеения --");
				ccon("update 		- обновить");
				ccon("checkupdates 	- проверить обновление");
				ccon("autoupdate 	- автоматическое обновление");
				ccon("");
				break;
		}
	});
})();