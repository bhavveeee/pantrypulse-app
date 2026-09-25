import http.server,urllib.parse,os
H='/mnt/user-data/outputs/pantry-pulse_2026-08-17_EOD.html'; A='/home/claude/igho_assets/'
class S(http.server.BaseHTTPRequestHandler):
    def log_message(self,*a): pass
    def do_GET(self):
        u=urllib.parse.urlparse(self.path)
        if u.path=='/private/pantrypulse.html': b=open(H,'rb').read(); ct='text/html'
        elif u.path=='/api/igho':
            f=urllib.parse.parse_qs(u.query).get('f',[''])[0]; p=A+os.path.basename(f)
            if not os.path.exists(p): self.send_response(404); self.end_headers(); return
            b=open(p,'rb').read(); ct='application/json' if f.endswith('.json') else 'application/javascript'
        elif u.path=='/api/menuplan': b=open('/home/claude/disha_plan_stub.json','rb').read(); ct='application/json'
        elif u.path.startswith('/api/'): b=b'{}'; ct='application/json'
        else: self.send_response(404); self.end_headers(); return
        self.send_response(200); self.send_header('Content-Type',ct); self.send_header('Content-Length',str(len(b))); self.end_headers(); self.wfile.write(b)
http.server.ThreadingHTTPServer(('127.0.0.1',8765),S).serve_forever()
