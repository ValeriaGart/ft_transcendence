#!/bin/sh


# ## create logrotate config file
# ## # rotate 10 means maximum 10 logging files will be kept
# ## # size 100k means a rotation will only be done if the file reaches this size
# ## # notifempty means it won't rotate if file is empty (duh)
# ## # missing means it's okay if the file doesn't exist
# ## # dateext and dateformat define the new filename extension
mkdir -p /etc/logrotate.d
touch /etc/logrotate.d/ft_transcendence
cat << EOF > /etc/logrotate.d/ft_transcendence
/workspaces/ft_transcendence/logs_backend/app.log {
	su root root
	rotate 10

	notifempty
	missingok
	dateext
		dateformat .%Y%m%d-%H%M

	postrotate
		kill -HUP `cat /tmp/ft_transcendence.pid`
	endscript
}
EOF

# ## starting and configuring cron that will run logrotate regularly
# ## # run logrotate every hour at minute 0 (zero)
service cron start
crontab -l > crontab_new 
echo "* * * * * /usr/sbin/logrotate /etc/logrotate.d/ft_transcendence" >> crontab_new
crontab crontab_new
rm crontab_new

exec "$@"	