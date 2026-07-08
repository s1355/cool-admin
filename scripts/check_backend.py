import urllib.request, json

BASE = 'http://localhost:8001'
try:
    req = urllib.request.Request(BASE + '/admin/base/open/captcha')
    resp = urllib.request.urlopen(req, timeout=5)
    print('Backend is RUNNING!')
except Exception as e:
    print(f'Backend NOT running: {e}')
