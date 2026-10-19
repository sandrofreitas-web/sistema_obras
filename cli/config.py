import os

def load_env_file():
    """Lê variáveis de .env na raiz do projeto se existir."""
    env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())
        except Exception:
            pass

load_env_file()

# URLs prioritárias para conexão do CLI com o Backend
DEFAULT_API_URL = os.getenv("OBRAS_API_URL", "http://localhost:8080/api/v1")
HOMELAB_API_URL = os.getenv("OBRAS_HOMELAB_URL", "http://192.168.15.176:8080/api/v1")
TAILSCALE_API_URL = os.getenv("OBRAS_TAILSCALE_URL", "https://ubuntu-server.tail01de12.ts.net/api/v1")

TIMEOUT_SECONDS = float(os.getenv("OBRAS_CLI_TIMEOUT", "15.0"))
