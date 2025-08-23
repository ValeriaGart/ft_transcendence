#!/bin/sh


# ## create logrotate config file
# ## # rotate 10 means maximum 10 logging files will be kept
# ## # size 100k means a rotation will only be done if the file reaches this size
# ## # notifempty means it won't rotate if file is empty (duh)
# ## # missing means it's okay if the file doesn't exist
# ## # dateext and dateformat define the new filename extension
mkdir -p /etc/logrotate.d
touch /etc/logrotate.d/ft_transcendence
echo "[Logrotate Setup]"
cat << EOF > /etc/logrotate.d/ft_transcendence
/workspaces/ft_transcendence/logs_backend/app.log {
	su root root
	rotate 10
	size 100k
	daily
	notifempty
	missingok
	dateext
		dateformat .%Y%m%d-%H%M
	postrotate
		echo "\$(date '+%Y-%m-%d %H:%M:%S'): logrotate activated"
	endscript
}
EOF
echo "[Logrotate Setup Done]"

# ## starting and configuring cron that will run logrotate regularly
# ## # run logrotate every hour at minute 0 (zero)
echo "[Cron Setup]"
service cron start
crontab -l > crontab_new 
echo "echo \$(date '+%Y-%m-%d %H:%M:%S')" > /tmp/timestamp.sh
echo "#deactivated for now # */20 * * * * (bash /tmp/timestamp.sh && echo ': cron gonna rotate' && /usr/sbin/logrotate -f /etc/logrotate.d/ft_transcendence) >> /tmp/cron.log 2>&1" >> crontab_new
crontab crontab_new
rm crontab_new
echo "[Cron Setup Done]"

exec "$@"	