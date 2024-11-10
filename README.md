# Cloud-Based WebRTC-SRT Streaming Application
Deploy this project on your own domain to stream WebRTC sources (camera and microphone) via SRT protocol. Follow the steps below to set up your server and deploy the application.

![Demo Video](demo-video-2.gif)

## Prerequisites
1. Domain Name: register a domain name for your application.
2. Cloud Server: rent a cloud server or use a local server running Ubuntu 22.04.

## Installation Guide

Step 1: Set Up Your Domain
- Configure DNS: create an A record in your DNS settings, pointing your domain name to your server’s IP address.

Step 2: Access the Server

Step 3: Install Certbot for SSL Certificate

'''sudo apt install certbot nginx -y'''

Generate SSL Certificate:

Use Certbot to obtain an SSL certificate for your domain:

sudo certbot certonly --nginx -d your-domain.com -d www.your-domain.com

Follow the prompts to complete the certificate setup.

Step 4: Set Up the Application

Create a directory for your project:
mkdir ~/WebRTC-SRT-cloud-ready

Clone the Git Repository:
git clone https://github.com/your-github-username/your-repository-name.git ~/WebRTC-SRT-cloud-ready

Navigate to the Project Folder:
cd ~/WebRTC-SRT-cloud-ready
Install Project Dependencies:

Run the setup command to install all necessary dependencies:
npm run setup

Step 5: Configure Firewall (UFW)
Open Required Ports:
sudo ufw allow 8080
sudo ufw allow 443
sudo ufw allow 5173
sudo ufw allow SRT OUTPUT PORTS YOU WANT
sudo ufw enable

Step 6: Start the Application
npm run dev

(Optional) Use PM2 for Background Running:

To keep the application running after you log out, use PM2:
pm2 start npm --name "webrtc-app" -- run dev
Save the PM2 configuration to start on reboot:
pm2 save
pm2 startup

Once deployed, access your application using your domain:

Frontend: https://your-domain.com

Running the Application

Add WebRTC Sources: connect your web camera and microphone.
Switch Inputs: test switching between different input sources.
Start Streaming: click the "Start Streaming" button to initiate SRT output.
Verify SRT Stream: Open a tool like vMix, VLC, or OBS to confirm the SRT stream.
Enjoy Your Stream!

## Important Notes

Ensure NGINX is Configured for SSL: If you are using NGINX as a reverse proxy for HTTPS, configure it to forward traffic to your application ports.

In files:
/frontend/vite.config.js on line 10
/backend/server.ts on lines 14, 27-28
/backend/nginx.conf on lines 3, 5, 6
Change domain name ant SSL path to yours.

Also check /backend/.env has
NODE_ENV=production
PORT=8080

## Running Application

1. Add your WebRTC sources - web camera and microphone
2. Try switching inputs
3. Type in your SRT listener credentials
4. Click "Start Streaming" button. It runs SRT output
5. Check SRT input in vMix, VLC or OBS

## License and Attribution
This project uses FFmpeg, which is licensed under the LGPL (Lesser General Public License). Please review the license details at https://ffmpeg.org/legal.html for more information.

## Author
The author of this code is Sergey Korneyev. For more information, visit https://avstream.ru or you can PM me at telegram https://t.me/Kvanterbreher

