# Deployment Guide

## Prerequisites

- Node.js 18+ (for local development)
- Docker and Docker Compose (for containerized deployment)
- Email account with IMAP access enabled
- (Optional) Sentry account for error tracking
- (Optional) Supabase account for database

## Environment Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure environment variables:**
   Edit `.env` and set the following required variables:
   - `EMAIL_USER`: Your email address
   - `EMAIL_PASSWORD`: Your email password or app-specific password
   
   Optional variables:
   - `SENTRY_DSN`: Your Sentry DSN for error tracking
   - `DATABASE_URL`: PostgreSQL connection string
   - `SUPABASE_URL` and `SUPABASE_ANON_KEY`: For Supabase integration

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   - Health check: http://localhost:3000/health
   - Email API: http://localhost:3000/api/emails
   - Automation API: http://localhost:3000/api/automation

## Docker Deployment

### Using Docker Compose (Recommended)

1. **Build and start the container:**
   ```bash
   docker-compose up -d --build
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f app
   ```

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

### Using Docker directly

1. **Build the image:**
   ```bash
   docker build -t email-integration-server .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name email-server \
     -p 3000:3000 \
     --env-file .env \
     --restart unless-stopped \
     email-integration-server
   ```

3. **View logs:**
   ```bash
   docker logs -f email-server
   ```

## Production Deployment

### Using PM2 (Node.js Process Manager)

1. **Install PM2 globally:**
   ```bash
   npm install -g pm2
   ```

2. **Create PM2 ecosystem file:**
   ```bash
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'email-integration-server',
       script: './server.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       },
       error_file: './logs/error.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   EOF
   ```

3. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   ```

4. **Save PM2 configuration:**
   ```bash
   pm2 save
   pm2 startup
   ```

### Cloud Deployment Options

#### Heroku

1. **Install Heroku CLI and login:**
   ```bash
   heroku login
   ```

2. **Create Heroku app:**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set EMAIL_USER=your-email@domain.com
   heroku config:set EMAIL_PASSWORD=your-password
   heroku config:set NODE_ENV=production
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

#### AWS EC2 / DigitalOcean / VPS

1. **SSH into your server:**
   ```bash
   ssh user@your-server-ip
   ```

2. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/email-integration-server.git
   cd email-integration-server
   ```

3. **Install Node.js and dependencies:**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   npm install --production
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your values
   ```

5. **Install and configure PM2:**
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name email-server
   pm2 save
   pm2 startup systemd
   ```

6. **Set up Nginx as reverse proxy (optional):**
   ```bash
   sudo apt-get install nginx
   sudo nano /etc/nginx/sites-available/email-server
   ```
   
   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/email-server /etc/nginx/sites-enabled
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## API Endpoints

### Email Endpoints

- **GET `/api/emails/latest/:sender`**
  - Get latest emails from a specific sender
  - Query params: `limit` (default: 1, max: 100)

- **POST `/api/emails/search`**
  - Search emails by criteria
  - Body: `{ criteria: [...], options: {...} }`

- **POST `/api/emails/extract-links`**
  - Extract verification links from email content
  - Body: `{ emailContent: { text: "...", html: "..." } }`

### Automation Endpoints

- **POST `/api/automation/verify-email`**
  - Execute email verification workflow
  - Body: `{ senderEmail: "...", maxWaitTime: 60000 }`

### Health Check

- **GET `/health`**
  - Returns server health status

## Monitoring

### Logs

- Application logs are output to console by default
- When using Docker, logs are stored in `./logs` directory
- When using PM2, logs are in `~/.pm2/logs/`

### Sentry Integration

If `SENTRY_DSN` is configured, errors are automatically reported to Sentry.

### Health Monitoring

Set up uptime monitoring using services like:
- UptimeRobot
- Pingdom
- New Relic
- DataDog

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` file to version control
   - Use secrets management in production (AWS Secrets Manager, HashiCorp Vault)

2. **Email Credentials:**
   - Use app-specific passwords when available
   - Consider OAuth2 for Gmail integration

3. **API Security:**
   - Implement rate limiting for production
   - Add API key authentication if exposing publicly
   - Use HTTPS in production

4. **Updates:**
   - Regularly update dependencies: `npm update`
   - Monitor security advisories: `npm audit`

## Troubleshooting

### Common Issues

1. **Email connection fails:**
   - Verify IMAP is enabled in email settings
   - Check firewall rules for port 993
   - Ensure credentials are correct

2. **Puppeteer fails in Docker:**
   - The Dockerfile includes necessary dependencies
   - If issues persist, try using `puppeteer-core` with system Chrome

3. **Port already in use:**
   - Change PORT in `.env` file
   - Or kill the process using the port: `lsof -ti:3000 | xargs kill`

4. **Memory issues:**
   - Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096"`
   - Implement connection pooling for email client

## Support

For issues or questions:
1. Check the logs for error messages
2. Review the troubleshooting section
3. Check Sentry for error details (if configured)
4. Create an issue in the repository

## License

[Your License Here]