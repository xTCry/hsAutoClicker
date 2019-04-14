# hsAutoClicker
hsAutoClicker - автоматический кликер для бота в ВК [Бот кликер](https://vk.com/hsclicker)

[![hsAC 1.0.3 download](https://img.shields.io/badge/hsAC%201.0.3-download-blue.svg?logo=github&style=for-the-badge)](https://github.com/xTCry/hsAutoClicker/archive/master.zip)

![Запуск](https://pp.userapi.com/c856036/v856036425/220ad/dwhxo8-tVUU.jpg)


Если есть какие-то ошибки при запуске, то первым делом выполнить команду для установки зависимостей
### NPM
```shell
npm i
```

## Запуск

### Использование аргументов

* `-t [TOKEN]`      - задает токен
* `-ad [URL]`       - при каком счете выводить койны
* `-tap`            - автостарт кликов

Обычный запуск
```shell
node index.js
```
![Запуск](https://pp.userapi.com/c845416/v845416131/1ecfb6/sRrbZ3H03jY.jpg)

Запуск через [токен](#получение-токена) с автоматическим включением кликера и автопереводом койнов при счете `50`
```shell
node index.js -t AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA -tap -ad 50
```

### Получение токена

[Получить токен на xTCoin](https://xtcoin.mdewo.com). `код длиной 85 символов`

## Команды
- `help`       - список доступных команд
- `tap`        - вкл/выкл автокликера
- `drop`       - вывести коины
- `ad`         - задать при каком счете выводить коины
- `update`     - выполнить обновление
- `autoupdate` - включить автоматическое обновление
- `checkupdates` - проверить обновления


[![Донат](https://img.shields.io/badge/Донат-Qiwi-orange.svg)](https://qiwi.me/xtcry)
