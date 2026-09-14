#!/usr/bin/env python3
import json
import os
import tempfile
from http.server import BaseHTTPRequestHandler, HTTPServer

DATA_DIR = "/var/lib/az900-data"
DATA_FILE = os.path.join(DATA_DIR, "progress.json")
MAX_BODY = 2 * 1024 * 1024  # 2MB


class Handler(BaseHTTPRequestHandler):
    server_version = "az900-api/1.0"

    def _send_json(self, status, obj):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path != "/api/progress":
            self._send_json(404, {"error": "not found"})
            return
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                data = f.read()
            body = data.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self._send_json(200, {})

    def do_POST(self):
        if self.path != "/api/progress":
            self._send_json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0 or length > MAX_BODY:
            self._send_json(413, {"error": "invalid or too large body"})
            return
        raw = self.rfile.read(length)
        try:
            obj = json.loads(raw.decode("utf-8"))
        except (ValueError, UnicodeDecodeError):
            self._send_json(400, {"error": "invalid json"})
            return
        if not isinstance(obj, dict):
            self._send_json(400, {"error": "expected a json object"})
            return
        os.makedirs(DATA_DIR, exist_ok=True)
        fd, tmp_path = tempfile.mkstemp(dir=DATA_DIR)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                json.dump(obj, f)
            os.replace(tmp_path, DATA_FILE)
        except Exception:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise
        self._send_json(200, {"ok": True})

    def log_message(self, format, *args):
        pass


if __name__ == "__main__":
    HTTPServer(("127.0.0.1", 8899), Handler).serve_forever()
