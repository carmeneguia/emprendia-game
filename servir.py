# Servidor local para probar el juego sin caché: python3 servir.py  ->  http://localhost:8080
import http.server, os, functools

class SinCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

carpeta = os.path.dirname(os.path.abspath(__file__))
http.server.ThreadingHTTPServer(("127.0.0.1", 8080), functools.partial(SinCache, directory=carpeta)).serve_forever()
