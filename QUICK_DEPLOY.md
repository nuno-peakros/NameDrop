# Quick Deployment Guide for namedrop.peakros.com

## Current Status ✅
- ✅ A record configured: `namedrop.peakros.com` → `35.246.48.206`
- ✅ All configuration files ready
- ⏳ DNS propagation in progress (this is normal)

## Next Steps

### 1. Deploy to Your VM

SSH into your VM and run the setup:

```bash
# SSH into your VM
ssh your-username@35.246.48.206

# Clone and setup the application
git clone https://github.com/YOUR_USERNAME/NameDrop.git /opt/namedrop
cd /opt/namedrop

# Make scripts executable
chmod +x scripts/*.sh

# Run initial setup
./scripts/setup-vm.sh
```

### 2. Set Up SSL Certificates

Once DNS propagation is complete (you can check with `nslookup namedrop.peakros.com`), run:

```bash
cd /opt/namedrop
./scripts/setup-ssl.sh
```

### 3. Configure GitHub Actions

Add these secrets to your GitHub repository:

1. Go to your GitHub repo → Settings → Secrets and variables → Actions
2. Add these repository secrets:
   - `VM_HOST`: `35.246.48.206`
   - `VM_USER`: Your VM username
   - `VM_SSH_KEY`: Your private SSH key content

### 4. Deploy Application

Push your code to trigger automatic deployment:

```bash
git add .
git commit -m "Initial deployment setup"
git push origin main
```

## Testing Your Deployment

### Check DNS Propagation
```bash
# This should return 35.246.48.206 when ready
nslookup namedrop.peakros.com
```

### Test Application
Once DNS is ready:
- Visit: https://namedrop.peakros.com
- Health check: https://namedrop.peakros.com/api/health

### Monitor on VM
```bash
# Check application status
cd /opt/namedrop && ./monitor.sh

# Check logs
docker-compose logs -f
```

## Troubleshooting

### If DNS is not resolving:
- Wait 5-15 minutes for propagation
- Check with different DNS servers: `nslookup namedrop.peakros.com 8.8.8.8`
- Verify A record in your DNS provider

### If SSL setup fails:
- Ensure DNS is fully propagated first
- Check that ports 80 and 443 are open on your VM
- Run: `sudo ufw status` to verify firewall

### If application doesn't load:
- Check container status: `docker-compose ps`
- Check logs: `docker-compose logs`
- Restart: `docker-compose restart`

## Your VM Details
- **IP Address**: 35.246.48.206
- **Domain**: namedrop.peakros.com
- **App Directory**: /opt/namedrop
- **SSL Certificates**: /opt/namedrop/nginx/ssl/

## Quick Commands Reference

```bash
# Check application status
cd /opt/namedrop && ./monitor.sh

# View logs
docker-compose logs -f

# Restart application
docker-compose restart

# Check SSL certificates
sudo certbot certificates

# Renew SSL certificates
cd /opt/namedrop && ./renew-ssl.sh
```

Your application will be available at:
- **Primary**: https://namedrop.peakros.com
- **WWW**: https://www.namedrop.peakros.com (redirects to primary)
