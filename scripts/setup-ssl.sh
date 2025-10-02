#!/bin/bash

# SSL Certificate Setup Script for namedrop.peakros.com
# Run this script on your VM to set up SSL certificates

set -e

DOMAIN="namedrop.peakros.com"
EMAIL="your-email@peakros.com"  # Replace with your actual email

echo "🔐 Setting up SSL certificates for $DOMAIN..."

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    sudo apt-get update
    sudo apt-get install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily
echo "🛑 Stopping nginx temporarily..."
sudo systemctl stop nginx || true

# Obtain SSL certificate
echo "📜 Obtaining SSL certificate for $DOMAIN..."
sudo certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email $EMAIL \
    -d $DOMAIN \
    -d www.$DOMAIN

# Copy certificates to nginx directory
echo "📋 Copying certificates to nginx directory..."
sudo mkdir -p /opt/namedrop/nginx/ssl
sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /opt/namedrop/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /opt/namedrop/nginx/ssl/key.pem
sudo chown -R $USER:$USER /opt/namedrop/nginx/ssl/

# Set up automatic renewal
echo "🔄 Setting up automatic certificate renewal..."
sudo tee /etc/cron.d/certbot-renew > /dev/null <<EOF
# Renew Let's Encrypt certificates twice daily
0 12 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
0 0 * * * root certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

# Create renewal script
echo "📝 Creating certificate renewal script..."
cat > /opt/namedrop/renew-ssl.sh << 'EOF'
#!/bin/bash
echo "🔄 Renewing SSL certificates..."
sudo certbot renew --quiet

if [ $? -eq 0 ]; then
    echo "📋 Copying renewed certificates..."
    sudo cp /etc/letsencrypt/live/namedrop.peakros.com/fullchain.pem /opt/namedrop/nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/namedrop.peakros.com/privkey.pem /opt/namedrop/nginx/ssl/key.pem
    sudo chown -R $USER:$USER /opt/namedrop/nginx/ssl/
    
    echo "🔄 Reloading nginx..."
    docker-compose restart nginx
    
    echo "✅ SSL certificates renewed successfully!"
else
    echo "❌ SSL certificate renewal failed!"
    exit 1
fi
EOF

chmod +x /opt/namedrop/renew-ssl.sh

# Start nginx
echo "🚀 Starting nginx..."
sudo systemctl start nginx

echo "✅ SSL setup completed successfully!"
echo ""
echo "Your app is now configured for:"
echo "  - Primary domain: https://$DOMAIN"
echo "  - WWW redirect: https://www.$DOMAIN"
echo ""
echo "Certificate will auto-renew. Manual renewal:"
echo "  cd /opt/namedrop && ./renew-ssl.sh"
