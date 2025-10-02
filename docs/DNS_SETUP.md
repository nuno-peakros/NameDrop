# DNS Setup Guide for namedrop.peakros.com

This guide will help you configure DNS records to point your domain to your Google Cloud VM.

## Prerequisites

- Access to your domain registrar or DNS provider (where peakros.com is managed)
- Your Google Cloud VM's external IP address
- Domain verification that you own peakros.com

## Step 1: Get Your VM's External IP

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Compute Engine** > **VM instances**
3. Find your VM and note the **External IP** address
4. If you don't have a static IP, consider creating one:
   ```bash
   gcloud compute addresses create namedrop-ip --global
   gcloud compute instances add-access-config INSTANCE_NAME --address=namedrop-ip
   ```

## Step 2: Configure DNS Records

### Option A: Using Google Cloud DNS (Recommended)

If your domain is managed by Google Cloud DNS:

1. Go to **Network Services** > **Cloud DNS**
2. Select your zone for `peakros.com`
3. Add the following records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | namedrop | YOUR_VM_IP | 300 |
| CNAME | www.namedrop | namedrop.peakros.com | 300 |

### Option B: Using Your Domain Registrar

If your domain is managed elsewhere (GoDaddy, Namecheap, etc.):

1. Log into your domain registrar's control panel
2. Navigate to DNS management
3. Add the following records:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | namedrop | YOUR_VM_IP | 300 |
| CNAME | www.namedrop | namedrop.peakros.com | 300 |

### Option C: Using Cloudflare (Recommended for Performance)

1. Add your domain to Cloudflare
2. Update nameservers at your registrar
3. Add DNS records in Cloudflare:

| Type | Name | Content | TTL |
|------|------|---------|-----|
| A | namedrop | YOUR_VM_IP | Auto |
| CNAME | www.namedrop | namedrop.peakros.com | Auto |

**Enable Cloudflare features:**
- ✅ Proxy (orange cloud) - for DDoS protection
- ✅ SSL/TLS: Full (strict) - for end-to-end encryption
- ✅ Always Use HTTPS: On

## Step 3: Verify DNS Propagation

After adding the DNS records, verify they're working:

```bash
# Check A record
nslookup namedrop.peakros.com

# Check CNAME record
nslookup www.namedrop.peakros.com

# Test from your local machine
ping namedrop.peakros.com
```

## Step 4: Test Your Application

1. Wait for DNS propagation (can take up to 24 hours, usually 5-15 minutes)
2. Visit `https://namedrop.peakros.com` in your browser
3. You should see your Next.js application

## Troubleshooting

### DNS Not Propagating
- Check if you entered the correct IP address
- Verify the DNS record type (A for IP, CNAME for domain)
- Wait longer (up to 24 hours for full propagation)
- Use `dig` command for more detailed DNS lookup:
  ```bash
  dig namedrop.peakros.com
  dig www.namedrop.peakros.com
  ```

### SSL Certificate Issues
- Ensure your VM is accessible on ports 80 and 443
- Check if Let's Encrypt can reach your server:
  ```bash
  sudo certbot certificates
  ```

### Application Not Loading
- Check if your application is running:
  ```bash
  cd /opt/namedrop && ./monitor.sh
  ```
- Verify nginx configuration:
  ```bash
  sudo nginx -t
  ```
- Check application logs:
  ```bash
  docker-compose logs
  ```

## Security Considerations

1. **Firewall Rules**: Ensure only necessary ports are open
   ```bash
   sudo ufw status
   ```

2. **SSL Configuration**: Use strong SSL settings (already configured in nginx)

3. **Regular Updates**: Keep your VM and containers updated
   ```bash
   sudo apt update && sudo apt upgrade
   docker-compose pull && docker-compose up -d
   ```

4. **Monitoring**: Set up monitoring for your application
   ```bash
   # Add to crontab for regular health checks
   */5 * * * * /opt/namedrop/monitor.sh >> /var/log/namedrop-monitor.log
   ```

## Next Steps

After DNS is configured:

1. Run the SSL setup script on your VM:
   ```bash
   cd /opt/namedrop && ./setup-ssl.sh
   ```

2. Test your application thoroughly

3. Set up monitoring and alerts

4. Configure backups (already included in setup scripts)

Your application will be available at:
- **Primary**: https://namedrop.peakros.com
- **WWW**: https://www.namedrop.peakros.com (redirects to primary)
