---
date: "2024-12-08T20:13:29.000Z"
modified: "2024-12-08T22:46:33.000Z"
share: true
wordCount: 119
---
I'll create a detailed walkthrough of how we got this stack working:

## Setting up Smallweb with Cloudflare Tunnel and Caddy

### Stack Overview
- Smallweb serving on port 7777
- Datasette running on port 8002 (as an example of another service)
- Caddy as the local reverse proxy on port 80
- Cloudflare Tunnel routing all `*.tools.ejfox.com` traffic to the VPS
- SSL handled by Cloudflare

### Configuration Steps

#### 1. Initial Setup
- Created `~/smallweb` directory
- Created `~/smallweb/.smallweb/config.json` with:
```json
{
  "domain": "tools.ejfox.com"
}
```
- Smallweb process running as debian user: `/home/debian/.local/bin/smallweb up --cron`

#### 2. Cloudflare Tunnel Configuration
- Created tunnel named `ejfox.com` through Cloudflare dashboard
- Set up public hostname:
  - Subdomain: `*.tools`
  - Domain: `ejfox.com`
  - Path: (empty)
  - Service: `http://localhost:80` (pointing to Caddy)

#### 3. Caddy Configuration

Created `/etc/caddy/Caddyfile`:

```
{
    # Globally disable automatic HTTPS since Cloudflare handles it
    auto_https off
}

# Development routes
:80, localhost:80, *.localhost:80 {
    reverse_proxy localhost:7777
}

# Production routes for tools subdomains
http://*.tools.ejfox.com {
    @datasette host datasette.tools.ejfox.com
    handle @datasette {
        reverse_proxy localhost:8002
    }

    handle {
        reverse_proxy localhost:7777
    }
}
```

#### 4. Running the Services
1. Started smallweb:
```bash
/home/debian/.local/bin/smallweb up --cron
```

2. Started Caddy:
```bash
sudo systemctl restart caddy
```

3. Started Cloudflare Tunnel:
```bash
sudo cloudflared --no-autoupdate tunnel run --token <tunnel-token>
```

### Key Learnings & Notes
1. Smallweb binds to both IPv4 and IPv6 (`:::7777`)
2. Using Caddy as the central router allows for easy addition of new services
3. The stack allows for dynamic subdomain routing without modifying Cloudflare config
4. Running as the debian user worked fine (didn't need dedicated smallweb user)
5. Cloudflare Tunnel configuration needs to point to Caddy (port 80) rather than directly to smallweb

### Verification
```bash
# Check services
sudo netstat -tlpn | grep -E ':(80|8002|7777)'
tcp        0      0 127.0.0.1:8002          0.0.0.0:*               LISTEN      11484/python3
tcp6       0      0 :::7777                 :::*                    LISTEN      9009/smallweb
tcp6       0      0 :::80                   :::*                    LISTEN      12890/caddy

# Verify smallweb
smallweb doctor
smallweb list

# Test endpoints
curl https://example.tools.ejfox.com  # Returns "Smallweb is running"
curl https://datasette.tools.ejfox.com  # Returns Datasette interface
```

### Final Result
- All traffic encrypted via Cloudflare
- Dynamic subdomain routing working
- Multiple services running behind single domain
- Easy to add new services or smallweb sites

Let me know if you'd like me to expand on any part of this documentation!