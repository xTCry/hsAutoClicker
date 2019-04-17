# hsAutoClicker
hsAutoClicker - автоматический кликер для бота в ВК [Бот кликер](https://vk.com/hsclicker)

[![hsAC 1.0.4 download](https://img.shields.io/badge/hsAC%201.0.4-download-blue.svg?logo=github&style=for-the-badge)](https://github.com/xTCry/hsAutoClicker/archive/master.zip)

![Запуск](https://pp.userapi.com/c856036/v856036425/220ad/dwhxo8-tVUU.jpg)


Если есть какие-то ошибки при запуске, то первым делом выполнить команду для установки зависимостей
### NPM
```shell
npm i
```

> Конфигурация сохраняется в файл.

## Запуск
Быстрый запуск через `launch.bat` файл

### Использование аргументов

* `-t [TOKEN]`      - задает токен
* `-ad [SUM]`       - при каком счете выводить койны
* `-tap`            - автостарт кликов

Обычный запуск
```shell
node index.js -tap
```
Только при первом запуске нужно будет ввести [токен](#получение-токена).

![Запуск](https://pp.userapi.com/c845416/v845416131/1ecfb6/sRrbZ3H03jY.jpg)

Запуск через [токен](#получение-токена) с автоматическим включением кликера и автопереводом койнов при счете `50`
```shell
node index.js -t AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA -tap -ad 50
```
При смене токена будет загружена прошлая конфигурация

### Получение токена

[Получить токен на xTCoin](https://xtcoin.mdewo.com). `код длиной 85 символов`

## Команды
(Можно истользовать кнопку `TAB↔`)
- `help`       - список доступных команд
- `tap`        - вкл/выкл автокликера
- `drop`       - вывести коины
- `ad`         - задать при каком счете выводить коины
- `captcha`    - установить обработчика капчи
- `tspam`      - вкл/откл вывод доп. инфы
- `beep`       - вкл/откл звука
- `captchaInterval` - установить интервал паузы после капчи
- `update`     - выполнить обновление
- `autoupdate` - включить автоматическое обновление
- `checkupdates` - проверить обновления

## Команды в сообщении
Писать в ЛС [Бот кликеру](https://vk.me/hsclicker)
- `!stop`     - Остановит кликер
- `!start`    - Запустит кликер


[![Донат](https://img.shields.io/badge/Донат-Qiwi-orange.svg)](https://qiwi.me/xtcry)
