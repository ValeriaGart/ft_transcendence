#!/bin/sh

mkdir -p /etc/logrotate.d
touch /etc/logrotate.d/ft_transcendence
cat << EOF > /etc/logrotate.d/ft_transcendence
/workspaces/ft_transcendence/logs_backend/rotatetest.log {
	su root root
	rotate 10
	size 1k

	notifempty
	missingok
	dateext
		dateformat .%Y%m%d-%H%M
}
EOF

service cron start
crontab -l > crontab_new 
echo "*/2 * * * * /usr/sbin/logrotate /etc/logrotate.d/ft_transcendence" >> crontab_new
crontab crontab_new
rm crontab_new

exec "$@"	