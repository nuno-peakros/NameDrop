# NameDrop Deployment Checklist

## Pre-Deployment Setup

### 1. Google Cloud VM Setup
- [ ] VM is running with Docker installed
- [ ] VM has external IP address (preferably static)
- [ ] Firewall rules allow ports 22, 80, 443
- [ ] SSH access is configured

### 2. Domain Configuration
- [ ] DNS A record: `namedrop.peakros.com` → `YOUR_VM_IP`
- [ ] DNS CNAME record: `www.namedrop.peakros.com` → `namedrop.peakros.com`
- [ ] DNS propagation verified (use `nslookup` or `dig`)

### 3. GitHub Repository Setup
- [ ] Repository is created and code is pushed
- [ ] GitHub Secrets are configured:
  - `VM_HOST`: Your VM's external IP
  - `VM_USER`: Your VM username
  - `VM_SSH_KEY`: Your private SSH key
- [ ] GitHub Actions are enabled

## Deployment Steps

### 1. Initial VM Setup
```bash
# On your VM, run:
wget https://raw.githubusercontent.com/YOUR_USERNAME/NameDrop/main/scripts/setup-vm.sh
chmod +x setup-vm.sh
./setup-vm.sh
```

### 2. SSL Certificate Setup
```bash
# On your VM, after DNS is configured:
cd /opt/namedrop
./setup-ssl.sh
```

### 3. Deploy Application
```bash
# Push to main branch to trigger deployment:
git push origin main
```

## Post-Deployment Verification

### 1. Application Health
- [ ] Visit https://namedrop.peakros.com
- [ ] Application loads correctly
- [ ] HTTPS redirect works (http → https)
- [ ] WWW redirect works (www → non-www)

### 2. SSL Certificate
- [ ] SSL certificate is valid
- [ ] Certificate is from Let's Encrypt
- [ ] No SSL warnings in browser

### 3. Performance Check
- [ ] Page load times are acceptable
- [ ] Static assets are served correctly
- [ ] API endpoints respond properly

### 4. Monitoring Setup
```bash
# Check application status:
cd /opt/namedrop && ./monitor.sh

# Check logs:
docker-compose logs -f

# Check system resources:
htop
df -h
```

## Maintenance Tasks

### Daily
- [ ] Check application health
- [ ] Review error logs
- [ ] Monitor system resources

### Weekly
- [ ] Update system packages
- [ ] Check SSL certificate expiry
- [ ] Review security logs

### Monthly
- [ ] Update Docker images
- [ ] Review and rotate logs
- [ ] Test backup restoration

## Troubleshooting Commands

### Check Application Status
```bash
cd /opt/namedrop
docker-compose ps
docker-compose logs --tail=50
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
```

### Check SSL Certificates
```bash
sudo certbot certificates
openssl x509 -in /opt/namedrop/nginx/ssl/cert.pem -text -noout
```

### Check DNS Resolution
```bash
nslookup namedrop.peakros.com
dig namedrop.peakros.com
```

### Restart Services
```bash
# Restart application
cd /opt/namedrop
docker-compose restart

# Restart nginx
sudo systemctl restart nginx
```

## Emergency Procedures

### Application Down
1. Check container status: `docker-compose ps`
2. Check logs: `docker-compose logs`
3. Restart containers: `docker-compose restart`
4. If still down, restart VM

### SSL Issues
1. Check certificate: `sudo certbot certificates`
2. Renew if needed: `cd /opt/namedrop && ./renew-ssl.sh`
3. Restart nginx: `sudo systemctl restart nginx`

### DNS Issues
1. Verify DNS records in your provider
2. Check propagation: `dig namedrop.peakros.com`
3. Wait for propagation (up to 24 hours)

## Contact Information

- **Domain**: namedrop.peakros.com
- **VM IP**: [Your VM's external IP]
- **Repository**: [Your GitHub repository URL]
- **Monitoring**: Check `/opt/namedrop/monitor.sh` output
