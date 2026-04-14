# MuscleKart Deployment Guide (EC2 + PM2 + Nginx + HTTPS)

This file is the complete deployment SOP for this project.

## 1. Stack Overview

- App Runtime: Node.js (Express)
- Process Manager: PM2
- Reverse Proxy: Nginx
- SSL: Certbot (Let's Encrypt)
- Server OS: Ubuntu 22.04
- App Path on Server: `~/musclekart`
- App Internal Port: `3010`

Request flow:
- Browser -> Nginx (`80/443`) -> Node app (`127.0.0.1:3010`) -> MongoDB Atlas

---

## 2. One-Time Server Setup (First Deployment)

Run these after first SSH login to a new Ubuntu EC2 instance.

### 2.1 Update server packages
```bash
sudo apt update
sudo apt upgrade -y


## 2.2 Install base tools
sudo apt install -y git curl nginx


## 2.3 Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v


## 2.4 Install PM2
sudo npm install -g pm2
pm2 -v


## 2.5 Clone project
cd ~
git clone <YOUR_GITHUB_REPO_URL> musclekart
cd musclekart


## 2.6 Install dependencies
npm ci


## 2.7 Create server .env
nano .env


  #Add required variables:
    PORT=3010
    MONGODB_URI=

    JWT_SECRET=
    REFERRAL_TOKEN_SECRET=

    EMAIL_USER=
    EMAIL_PASS=

    RAZORPAY_KEY_ID=
    RAZORPAY_KEY_SECRET=

    GOOGLE_CLIENT_ID=
    GOOGLE_CLIENT_SECRET=

    CLOUDINARY_CLOUD_NAME=
    CLOUDINARY_API_KEY=
    CLOUDINARY_API_SECRET=
  
  #Save and exit: Ctrl+O, Enter, Ctrl+X


## 2.8 Start app using PM2
pm2 start src/server.js --name musclekart --node-args="-r dotenv/config"
pm2 status
pm2 logs musclekart --lines 80


## 2.9 Persist PM2 across reboot
pm2 save
pm2 startup
  
  #Run the command printed by pm2 startup (it will start with sudo ...).



## 3. Nginx Setup (HTTP Reverse Proxy)

## 3.1 Create site config
sudo nano /etc/nginx/sites-available/musclekart

   #Paste:
    server {
        listen 80;
        server_name musclekart.shop www.musclekart.shop;

        location / {
            proxy_pass http://127.0.0.1:3010;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }


## 3.2 Enable config and disable default
sudo ln -s /etc/nginx/sites-available/musclekart /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default


## 3.3 Validate and reload
sudo nginx -t
sudo systemctl reload nginx
sudo systemctl enable nginx
sudo systemctl status nginx


## 3.4 Verify HTTP
curl -I http://127.0.0.1 -H "Host: musclekart.shop"


## 4. HTTPS Setup (Certbot)
    # Prerequisite: DNS A records for musclekart.shop and www.musclekart.shop should point to EC2 public IP.

## 4.1 Install certbot
sudo apt install -y certbot python3-certbot-nginx

## 4.2 Issue SSL certificate
sudo certbot --nginx -d musclekart.shop -d www.musclekart.shop
  #Choose redirect to HTTPS when prompted.

## 4.3 Verify auto-renew
sudo systemctl status certbot.timer
sudo certbot renew --dry-run


## 5. Regular Deploy (After Every Code Change)

## 5.1 Local machine: push code
git add .
git commit -m "your commit message"
git push origin main


## 5.2 SSH into server
ssh -i "C:\Users\iamja\Downloads\musclekart-key.pem" ubuntu@13.234.204.144


## 5.3 Pull and restart on server
cd ~/musclekart
git pull origin main
npm ci
pm2 restart musclekart --update-env
pm2 status
pm2 logs musclekart --lines 50


## 6. Health Check Commands
pm2 status
pm2 logs musclekart --lines 100
curl -I http://127.0.0.1:3010
curl -I http://127.0.0.1 -H "Host: musclekart.shop"
sudo systemctl status nginx


     #Browser Checks
    #  Browser checks:
    # https://musclekart.shop
    # https://www.musclekart.shop



## 7. Rollback Procedure

## 7.1 Find previous stable commit
cd ~/musclekart
git log --oneline -n 20


## 7.2 Checkout old commit and restart
git checkout <STABLE_COMMIT_HASH>
npm ci
pm2 restart musclekart --update-env


## 7.3 Return to latest main
git checkout main
git pull origin main
pm2 restart musclekart --update-env


## 8. Common Issues and Fixes
    # App not opening, PM2 shows restarting
    # Check logs:
        pm2 logs musclekart --lines 120
    # Most common: bad/missing .env.
    # ECONNREFUSED 127.0.0.1:27017
    # MONGODB_URI still points to local Mongo.
    # Use MongoDB Atlas URI in .env.
    # MongoServerError: bad auth : Authentication failed
    # Atlas username/password wrong.
    # Reset Atlas DB user password and update URI.
    # URL-encode special chars in password if needed.
    # Domain works on mobile data but not Wi-Fi
    # Local/router DNS cache issue.
    # Flush DNS or use 1.1.1.1 / 8.8.8.8.
    # SSH timeout
    # Check EC2 Security Group inbound rule for port 22.
    # Ensure source IP is current public IP.

    #SSH key permission error on Windows
        icacls "C:\Users\iamja\Downloads\musclekart-key.pem" /inheritance:r
        icacls "C:\Users\iamja\Downloads\musclekart-key.pem" /grant:r "iamja:(R)"


## 9. Security Checklist
    # Keep .env out of git.
    # Keep .pem key private.
    # Allow SSH (22) only from My IP.
    # Keep HTTP (80) and HTTPS (443) public.
    # Rotate secrets if exposed.
    # Keep server updated regularly:

    sudo apt update && sudo apt upgrade -y

## 10. Useful Paths
    # App directory: ~/musclekart
    # Nginx site config: /etc/nginx/sites-available/musclekart
    # Nginx enabled sites: /etc/nginx/sites-enabled/
    # PM2 logs: ~/.pm2/logs/


## 11. Quick Command Summary
cd ~/musclekart
git pull origin main
npm ci
pm2 restart musclekart --update-env
pm2 status


After replacing it, run:

```bash
git add DEPLOY.md
git commit -m "docs: add complete deployment SOP"
git push origin main
