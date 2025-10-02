#!/bin/bash

# VM Setup Script for NameDrop Deployment
# Run this script on your Google Cloud VM to prepare it for deployment

set -e

echo "🚀 Setting up VM for NameDrop deployment..."

# Update system packages
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt-get install -y \
    curl \
    wget \
    git \
    docker.io \
    docker-compose \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    htop \
    unzip

# Start and enable Docker
echo "🐳 Setting up Docker..."
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER

# Install Docker Compose (latest version)
echo "📦 Installing latest Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create app directory
echo "📁 Creating app directory..."
sudo mkdir -p /opt/namedrop
sudo chown $USER:$USER /opt/namedrop

# Clone repository
echo "📥 Cloning repository..."
cd /opt/namedrop
if [ -d ".git" ]; then
    echo "Repository already exists. Pulling latest changes..."
    git pull origin main
else
    git clone https://github.com/$GITHUB_USERNAME/$GITHUB_REPO.git .
fi

# Configure firewall
echo "🔥 Configuring firewall..."
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create SSL certificate directory
echo "🔐 Setting up SSL certificates..."
sudo mkdir -p /opt/namedrop/nginx/ssl

# Generate self-signed certificate (replace with real certificates in production)
echo "📜 Generating self-signed SSL certificate for namedrop.peakros.com..."
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /opt/namedrop/nginx/ssl/key.pem \
    -out /opt/namedrop/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Peakros/CN=namedrop.peakros.com"

# Set proper permissions
sudo chown -R $USER:$USER /opt/namedrop
chmod 600 /opt/namedrop/nginx/ssl/*.pem

# Create systemd service for auto-start
echo "⚙️ Creating systemd service..."
sudo tee /etc/systemd/system/namedrop.service > /dev/null <<EOF
[Unit]
Description=NameDrop Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/namedrop
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=$USER

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable namedrop.service

# Create monitoring script
echo "📊 Creating monitoring script..."
cat > /opt/namedrop/monitor.sh << 'EOF'
#!/bin/bash
echo "=== NameDrop Application Status ==="
echo "Docker containers:"
docker-compose ps
echo ""
echo "Application health:"
curl -s http://localhost:3000/api/health | jq . || echo "Health check failed"
echo ""
echo "System resources:"
df -h
free -h
echo ""
echo "Recent logs:"
docker-compose logs --tail=20
EOF

chmod +x /opt/namedrop/monitor.sh

# Create backup script
echo "💾 Creating backup script..."
cat > /opt/namedrop/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/namedrop"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

echo "Creating backup: $BACKUP_DIR/backup_$DATE.tar.gz"
tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=.next \
    /opt/namedrop

# Keep only last 7 backups
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/backup_$DATE.tar.gz"
EOF

chmod +x /opt/namedrop/backup.sh

# Set up log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/namedrop > /dev/null <<EOF
/opt/namedrop/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

echo "✅ VM setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Set up your GitHub repository secrets:"
echo "   - VM_HOST: Your VM's external IP"
echo "   - VM_USER: Your VM username"
echo "   - VM_SSH_KEY: Your private SSH key"
echo ""
echo "2. Push your code to trigger deployment:"
echo "   git push origin main"
echo ""
echo "3. Monitor your application:"
echo "   cd /opt/namedrop && ./monitor.sh"
echo ""
echo "4. Set up SSL certificates for namedrop.peakros.com:"
echo "   cd /opt/namedrop && ./setup-ssl.sh"
echo ""
echo "5. Configure DNS:"
echo "   - Add A record: namedrop.peakros.com -> YOUR_VM_IP"
echo "   - Add CNAME record: www.namedrop.peakros.com -> namedrop.peakros.com"
