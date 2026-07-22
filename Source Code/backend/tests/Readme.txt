
Run this:

```bash
cd /home/jarvis/crop/backend
python3 manage.py test tests.test_core_modules -v 2
```

If you’re running through Docker Compose, use:

```bash
cd /home/jarvis/crop
docker compose exec backend python manage.py test tests.test_core_modules -v 2
```




===================VIEW DASHBOARD===================================================

Fastest way: serve the report  with a temporary web server.
On Ubuntu:
cd /home/jarvis/crop/backend/tests/reports
python3 -m http.server 8090 --bind 0.0.0.0
Then open in your browser:
http://172.16.1.13:8090/core_test_dashboard.html
If you are at home, use:
http://192.168.100.186:8090/core_test_dashboard.html


allow the port:
sudo ufw allow 8090/tcp