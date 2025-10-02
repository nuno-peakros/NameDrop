# Health Check API Contracts

## Base URL
```
https://namedrop.example.com/api/health
```

## Endpoints

### GET /health
System health status check.

**No Authentication Required**

**Response (200):**
```typescript
{
  success: true;
  data: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;  // ISO timestamp
    version: string;    // Application version
    uptime: number;     // Seconds since startup
    services: {
      database: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime: number;  // Milliseconds
        lastChecked: string;   // ISO timestamp
      };
      email: {
        status: 'healthy' | 'degraded' | 'unhealthy';
        responseTime: number;  // Milliseconds
        lastChecked: string;   // ISO timestamp
      };
    };
    metrics: {
      activeUsers: number;     // Currently active users
      totalUsers: number;      // Total registered users
      requestsPerMinute: number;
      averageResponseTime: number;  // Milliseconds
    };
  };
}
```

**Response (503) - Service Unavailable:**
```typescript
{
  success: false;
  data: {
    status: 'unhealthy';
    timestamp: string;
    version: string;
    uptime: number;
    services: {
      database: {
        status: 'unhealthy';
        error: string;
        lastChecked: string;
      };
      email: {
        status: 'unhealthy';
        error: string;
        lastChecked: string;
      };
    };
    errors: string[];  // List of service errors
  };
}
```

## Health Check Logic

### Database Health
- **Test**: Execute simple SELECT query
- **Timeout**: 5 seconds
- **Healthy**: Response time < 100ms
- **Degraded**: Response time 100ms - 1s
- **Unhealthy**: Response time > 1s or connection failed

### Email Service Health
- **Test**: Ping Resend API
- **Timeout**: 10 seconds
- **Healthy**: Response time < 500ms
- **Degraded**: Response time 500ms - 2s
- **Unhealthy**: Response time > 2s or API error

### Overall Status
- **Healthy**: All services healthy
- **Degraded**: One or more services degraded
- **Unhealthy**: One or more services unhealthy

## Monitoring Integration

### Prometheus Metrics
```
namedrop_health_status{service="database"} 1
namedrop_health_status{service="email"} 1
namedrop_response_time_ms{service="database"} 45
namedrop_response_time_ms{service="email"} 120
namedrop_active_users 23
namedrop_total_users 156
```

### Logging
- Health check requests logged at INFO level
- Service failures logged at ERROR level
- Performance metrics logged at DEBUG level

## Use Cases

### Load Balancer Health Checks
- **Endpoint**: `/api/health`
- **Expected Response**: 200 with `status: "healthy"`
- **Check Interval**: 30 seconds
- **Timeout**: 10 seconds

### Monitoring Dashboard
- **Endpoint**: `/api/health`
- **Authentication**: None required
- **Data**: Service status and metrics
- **Refresh**: Every 60 seconds

### Alerting
- **Trigger**: Status changes to "degraded" or "unhealthy"
- **Notification**: Email/Slack alerts
- **Escalation**: Multiple consecutive failures

## Security Considerations

### Public Endpoint
- No authentication required
- No sensitive data exposed
- Rate limiting applied (100 requests/minute per IP)

### Information Disclosure
- Only basic system status information
- No internal system details
- No user data or credentials
- Version information for debugging only

## Performance Considerations

### Response Time
- **Target**: < 100ms for healthy status
- **Timeout**: 10 seconds maximum
- **Caching**: 30-second cache for service checks
- **Concurrent**: Handle multiple simultaneous requests

### Resource Usage
- **Database**: Minimal impact (simple SELECT)
- **Email**: Lightweight API ping
- **Memory**: Minimal memory footprint
- **CPU**: Low CPU usage for checks
