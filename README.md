# radio-alarmclock

## Host device

`sudo apt-get install libcap2-bin`
`sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)`
