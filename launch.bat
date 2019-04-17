@ECHO OFF

IF NOT EXIST ./node_modules/beepbeep (
	echo Installing dependencies...
	npm i --only=prod --no-audit --no-progress --loglevel=error
	echo Dependencies Installed. Relaunch this file
	pause
)

node . -tap

echo App was stopped
pause