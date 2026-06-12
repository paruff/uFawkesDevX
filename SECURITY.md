# Security Considerations

This document outlines important security considerations for the Developer Control Plane.

## ⚠️ Development vs Production

**IMPORTANT**: The default configuration is designed for **development and testing only**. Several security features are intentionally relaxed for ease of use during development.

### Development Mode (Current Configuration)

- Local authentication only (no OAuth/OIDC)
- Guest access enabled in Backstage
- CORS allows all origins (*)
- Docker socket mounted in containers (for Che and Plugin Manager)
- Example passwords in .env.example (MUST be changed before use)
- All privileges granted to database users
- No TLS/SSL encryption
- No rate limiting
- No authentication on internal APIs

**⚠️ CRITICAL**: You MUST create a `.env` file from `.env.example` and set secure passwords before starting the platform. Never use the example passwords.

### Production Recommendations

Before deploying to production, you **must** address the following:

## 🔐 Authentication & Authorization

### Current State (Development)
- Local authentication only
- No API authentication
- Guest access enabled

### Production Requirements
1. **Enable OAuth/OIDC** in Backstage
   - Configure auth providers (GitHub, Google, Okta, etc.)
   - Remove guest provider
   - Implement proper user/role management

2. **Add API Authentication**
   - Implement JWT tokens or API keys
   - Add authentication middleware to all services
   - Use service accounts for inter-service communication

3. **Role-Based Access Control (RBAC)**
   - Define roles and permissions
   - Implement authorization checks
   - Audit access logs

## 🌐 Network Security

### Docker Socket Exposure

**Issue**: Eclipse Che and Plugin Manager mount `/var/run/docker.sock`

```yaml
# Current (INSECURE for production)
volumes:
  - /var/run/docker.sock:/var/run/docker.sock
```

**Risk**: Provides root-level access to the host system

**Solutions**:
1. **For Kubernetes**: Remove Docker socket mount, use Kubernetes API instead
2. **For Docker**: Use Docker-in-Docker (dind) service
3. **Best**: Deploy Che using Kubernetes operator

### CORS Configuration

**Issue**: Wildcard CORS origin (`*`) allows any domain

```nginx
# Current (INSECURE for production)
add_header Access-Control-Allow-Origin * always;
```

**Solution**: Specify exact allowed origins
```nginx
# Production
add_header Access-Control-Allow-Origin "https://platform.example.com" always;
```

### Network Isolation

**Production Requirements**:
1. Use separate networks for different security zones
2. Implement network policies in Kubernetes
3. Use service mesh for mTLS between services
4. Isolate database access

## 🔑 Secrets Management

### Current State (Development)
- Secrets in `.env` file (not committed to git)
- Example passwords in `.env.example` for reference only
- No secret rotation

**⚠️ IMPORTANT**: 
- Never commit the `.env` file to version control
- Never use the example passwords from `.env.example` 
- Always generate strong, unique passwords
- The `.env` file is included in `.gitignore` to prevent accidental commits

### Production Requirements
1. **Use Secret Management System**
   - HashiCorp Vault
   - AWS Secrets Manager
   - Azure Key Vault
   - Kubernetes Secrets with encryption at rest

2. **Database Credentials**
   ```yaml
   # Use secrets instead of environment variables
   env:
     - name: POSTGRES_PASSWORD
       valueFrom:
         secretKeyRef:
           name: postgres-credentials
           key: password
   ```

3. **Rotate Secrets Regularly**
   - Implement automated secret rotation
   - Use temporary credentials where possible

4. **Never Hardcode Secrets**
   - No passwords in docker-compose.yml
   - No API keys in source code
   - Use environment variables or secret management tools

## 🗄️ Database Security

### Current State (Development)
- Single superuser account
- All privileges granted
- No connection encryption

### Production Requirements
1. **Least Privilege Access**
   ```sql
   -- Create dedicated users with minimal permissions
   CREATE USER score_app WITH PASSWORD 'secure_random_password';
   GRANT SELECT, INSERT, UPDATE, DELETE ON score_specs TO score_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON pipeline_runs TO score_app;
   ```

2. **Enable SSL/TLS**
   - Configure PostgreSQL to require SSL
   - Use certificates for authentication

3. **Connection Pooling**
   - Use pgBouncer or similar
   - Limit connection count per service

4. **Regular Backups**
   - Automated daily backups
   - Test restore procedures
   - Encrypt backup data

## 🔒 API Security

### Input Validation

**Already Implemented**:
- Score spec validation with JSON Schema
- Path traversal prevention for workload names
- Plugin filename validation

**Additional Requirements**:
1. **Rate Limiting**
   ```nginx
   # Add to nginx.conf
   limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
   
   location /api/ {
       limit_req zone=api_limit burst=20;
   }
   ```

2. **Request Size Limits**
   ```nginx
   client_max_body_size 1M;
   ```

3. **Timeout Configuration**
   ```nginx
   proxy_connect_timeout 5s;
   proxy_send_timeout 10s;
   proxy_read_timeout 10s;
   ```

### Plugin Security

**Current Risks**:
- Plugins execute arbitrary code
- No sandboxing
- No signature verification

**Production Requirements**:
1. **Plugin Verification**
   - Implement digital signatures
   - Verify plugin checksums
   - Use allowlist of approved plugins

2. **Sandboxing**
   - Use VM-based isolation (e.g., Firecracker)
   - Or WebAssembly for portable sandboxing
   - Limit plugin capabilities

3. **Code Review**
   - Mandatory review process for plugins
   - Automated security scanning
   - Vulnerability assessment

## 🛡️ TLS/SSL Encryption

### Production Requirements
1. **Enable HTTPS**
   - Use Let's Encrypt for certificates
   - Configure TLS 1.2+ only
   - Use strong cipher suites

2. **Internal Communication**
   - mTLS between services
   - Certificate rotation
   - Service mesh (Istio, Linkerd)

Example Ingress configuration:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - platform.example.com
    secretName: platform-tls
```

## 📝 Audit Logging

### Production Requirements
1. **Enable Audit Logs**
   - Log all API requests
   - Log authentication attempts
   - Log administrative actions
   - Log pipeline executions

2. **Centralized Logging**
   - Ship logs to SIEM
   - Implement log retention policy
   - Regular log review

3. **Monitoring & Alerts**
   - Failed authentication attempts
   - Unusual API patterns
   - Resource exhaustion
   - Security events

## 🚨 Vulnerability Management

### Regular Updates
1. Update base images regularly
2. Monitor security advisories
3. Apply patches promptly
4. Use automated vulnerability scanning

### Container Security
```dockerfile
# Use specific versions, not 'latest'
FROM node:18.19.0-alpine

# Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# Use read-only root filesystem
--read-only --tmpfs /tmp
```

### Image Scanning
```bash
# Scan images before deployment
docker scan developerd/score-service:1.0.0
trivy image developerd/score-service:1.0.0
```

## 🔍 Security Checklist

Before production deployment:

- [ ] Remove guest authentication from Backstage
- [ ] Implement OAuth/OIDC authentication
- [ ] Add API authentication (JWT/API keys)
- [ ] Replace wildcard CORS with specific domains
- [ ] Remove or secure Docker socket mounts
- [ ] Use external secret management system
- [ ] Implement database user with least privilege
- [ ] Enable database SSL/TLS
- [ ] Configure rate limiting on APIs
- [ ] Enable HTTPS/TLS on all external endpoints
- [ ] Implement mTLS for internal communication
- [ ] Set up audit logging
- [ ] Configure security monitoring & alerts
- [ ] Implement plugin signature verification
- [ ] Enable container security scanning
- [ ] Review and update all default passwords
- [ ] Enable automatic security updates
- [ ] Configure network policies
- [ ] Implement backup and disaster recovery
- [ ] Perform security penetration testing
- [ ] Document incident response procedures

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CIS Docker Benchmarks](https://www.cisecurity.org/benchmark/docker)
- [Kubernetes Security Best Practices](https://kubernetes.io/docs/concepts/security/)
- [Backstage Security](https://backstage.io/docs/auth/)
- [Score Specification Security](https://score.dev)

## 🚨 Reporting Security Issues

If you discover a security vulnerability, please report it to:
- Email: security@example.com
- Do not open public GitHub issues for security vulnerabilities

## 📄 Compliance

Depending on your organization's requirements, you may need to ensure compliance with:
- SOC 2
- ISO 27001
- GDPR
- HIPAA
- PCI DSS

Consult with your security team for specific compliance requirements.
