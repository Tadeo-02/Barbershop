# Production Deployment Checklist

Use this checklist before deploying to production.

---

## 🔐 Security

- [ ] Change all default passwords in `.env`
  - [ ] `DB_ROOT_PASSWORD` (16+ characters, mixed case, numbers, symbols)
  - [ ] `DB_PASSWORD` (16+ characters, mixed case, numbers, symbols)
  - [ ] Database backup credentials
- [ ] Update AFIP credentials
  - [ ] `AFIP_ACCESS_TOKEN` is production token
  - [ ] `AFIP_CUIT` is production CUIT (not testing)
  - [ ] `AFIP_ENVIRONMENT=production` (not testing)

- [ ] SSL/HTTPS configured
  - [ ] Valid SSL certificate (Let's Encrypt recommended)
  - [ ] HTTP redirects to HTTPS
  - [ ] Certificate auto-renewal setup

- [ ] Environment variables secure
  - [ ] `.env` file is in `.gitignore`
  - [ ] Never commit `.env` to Git
  - [ ] Use platform's secret management (Railway secrets, AWS Secrets Manager, etc.)
  - [ ] Sensitive data not logged or exposed

- [ ] Database security
  - [ ] Regular backups enabled (automated)
  - [ ] Backup retention policy set (7+ days recommended)
  - [ ] Database access restricted (not publicly accessible)
  - [ ] Users have least privilege permissions
  - [ ] SQL injection protection verified

- [ ] Backend security
  - [ ] CORS configured for production domain only
  - [ ] Rate limiting enabled
  - [ ] Helmet.js security headers enabled
  - [ ] Input validation and sanitization working
  - [ ] No debug logs in production

- [ ] Frontend security
  - [ ] CSP (Content Security Policy) headers set
  - [ ] No sensitive data in localStorage
  - [ ] Session/token expiration implemented
  - [ ] XSS protection verified

---

## 📦 Code & Dependencies

- [ ] Code reviewed for production readiness
- [ ] No console.log or debug statements left
- [ ] Error messages are user-friendly (no stack traces)
- [ ] All dependencies are up to date
  - [ ] `pnpm update` run
  - [ ] Security vulnerabilities checked: `pnpm audit`
- [ ] TypeScript builds with no errors
  - [ ] `pnpm build` passes
  - [ ] `pnpm lint` passes (no warnings)
- [ ] Tests pass
  - [ ] `pnpm test:run` passes
  - [ ] Coverage acceptable (aim for 80%+)
  - [ ] Integration tests pass in production environment

---

## 🗄️ Database

- [ ] Prisma schema is production-ready
  - [ ] All migrations created and tested
  - [ ] Schema validates: `prisma db validate`
  - [ ] No unused models or fields

- [ ] Data migration plan (if applicable)
  - [ ] Backup of old database exists
  - [ ] Migration scripts tested
  - [ ] Rollback plan documented
  - [ ] Data integrity verified post-migration

- [ ] Database backups
  - [ ] Automated backups configured
  - [ ] Backup encryption enabled
  - [ ] Restore process tested
  - [ ] Off-site backup copies exist

---

## 🐳 Docker Configuration

- [ ] Images are optimized
  - [ ] Multi-stage builds used
  - [ ] No unnecessary dependencies in production images
  - [ ] Image sizes are reasonable
  - [ ] Security scanning passed (no critical vulnerabilities)

- [ ] docker-compose.yml production-ready
  - [ ] Resource limits set
  - [ ] Restart policies configured
  - [ ] Health checks working
  - [ ] No hardcoded secrets

- [ ] .env configured for production
  - [ ] `NODE_ENV=production`
  - [ ] All required variables set
  - [ ] Database URL correct for production
  - [ ] Port conflicts resolved

- [ ] Volumes and data persistence
  - [ ] Database data persists (named volumes)
  - [ ] Log storage configured
  - [ ] Backup strategy for persistent data

---

## 📋 Infrastructure

- [ ] Deployment platform chosen
  - [ ] Account created and configured
  - [ ] Domains registered and pointing to app
  - [ ] SSL certificates obtained

- [ ] Load balancing (if applicable)
  - [ ] Load balancer configured
  - [ ] Health check endpoints working
  - [ ] Session affinity considered

- [ ] Monitoring & Alerting
  - [ ] Uptime monitoring enabled
  - [ ] Error tracking setup (e.g., Sentry)
  - [ ] Performance monitoring enabled
  - [ ] Alerts configured for:
    - [ ] Service down
    - [ ] High error rates
    - [ ] High CPU/Memory usage
    - [ ] Database connection failures

- [ ] Logging
  - [ ] Centralized logging setup (if needed)
  - [ ] Log retention policy set
  - [ ] Sensitive data not logged
  - [ ] Log access controlled

---

## 🚀 Deployment

- [ ] Deployment plan documented
  - [ ] Rollback procedure documented
  - [ ] Downtime estimate (if any)
  - [ ] Team communication plan
  - [ ] Deployment window scheduled (off-peak)

- [ ] Pre-deployment checklist
  - [ ] Database backups created
  - [ ] Feature flags ready (if using)
  - [ ] Support team briefed
  - [ ] Monitoring dashboards prepared

- [ ] Deployment execution
  - [ ] CI/CD pipeline working (GitHub Actions, etc.)
  - [ ] Images built and tested
  - [ ] Staging environment matches production
  - [ ] Deployment to production successful
  - [ ] Migrations run successfully
  - [ ] All services started and healthy

- [ ] Post-deployment verification
  - [ ] Application loads: http://your-domain.com ✓
  - [ ] All endpoints working (test key flows)
  - [ ] Database connectivity confirmed
  - [ ] Logs show no errors
  - [ ] Performance baseline acceptable
  - [ ] SSL certificate valid
  - [ ] Email/notifications working (if applicable)

---

## 📊 Performance & Optimization

- [ ] Database
  - [ ] Indexes created for frequently queried fields
  - [ ] Slow queries identified and optimized
  - [ ] Query performance acceptable (<100ms typical)
  - [ ] Connection pooling configured

- [ ] Frontend
  - [ ] Assets are minified and bundled
  - [ ] Images optimized (.webp where possible)
  - [ ] Lazy loading implemented where appropriate
  - [ ] Cache headers configured
  - [ ] Bundle size acceptable

- [ ] Backend
  - [ ] Response times <200ms typical
  - [ ] No memory leaks detected
  - [ ] Connection limits appropriate
  - [ ] Caching strategy implemented (if applicable)

---

## 📱 Testing & Verification

- [ ] Manual testing
  - [ ] Core user flows tested (create appointment, etc.)
  - [ ] Error scenarios tested
  - [ ] Edge cases verified
  - [ ] Cross-browser compatibility checked

- [ ] API testing
  - [ ] All endpoints respond correctly
  - [ ] Error responses have proper status codes
  - [ ] Rate limiting working
  - [ ] CORS headers correct

- [ ] Database testing
  - [ ] Data integrity verified
  - [ ] Constraints enforced
  - [ ] Transactions working correctly

---

## 📞 Support & Documentation

- [ ] Runbooks created
  - [ ] How to access logs
  - [ ] How to restart services
  - [ ] How to debug common issues
  - [ ] Emergency contacts listed

- [ ] Documentation updated
  - [ ] README has production deployment info
  - [ ] Environment variables documented
  - [ ] Architecture diagram updated (if applicable)
  - [ ] API documentation current
  - [ ] Known issues documented

- [ ] Team training
  - [ ] Team knows how to access monitoring
  - [ ] Team knows how to respond to alerts
  - [ ] Team knows rollback procedure
  - [ ] On-call schedule established

---

## 🔄 Continuous Improvement

- [ ] Performance baseline established
  - [ ] Response time baseline: **\_** ms
  - [ ] Error rate baseline: **\_\_** %
  - [ ] Uptime baseline: **\_\_** %

- [ ] Feedback loop
  - [ ] User feedback mechanism in place
  - [ ] Error tracking dashboard monitored
  - [ ] Performance metrics tracked
  - [ ] Regular review schedule (weekly/monthly)

---

## 🎯 Sign-off

- [ ] **Dev Lead:** ********\_\_******** Date: ****\_\_\_****
- [ ] **QA/Tester:** ********\_******** Date: ****\_\_\_****
- [ ] **DevOps/Ops:** ******\_\_\_\_****** Date: ****\_\_\_****
- [ ] **Product/Owner:** ******\_****** Date: ****\_\_\_****

---

## 📝 Notes

```
Use this space for any additional notes or exceptions:

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## 🚨 Emergency Contacts

| Role          | Name | Phone | Email |
| ------------- | ---- | ----- | ----- |
| Dev Lead      |      |       |       |
| DevOps        |      |       |       |
| Product Owner |      |       |       |
| On-Call       |      |       |       |

---

## Quick Links

- **Application:** http://your-domain.com
- **Admin Dashboard:** http://your-domain.com/admin
- **API Docs:** http://your-domain.com/api/docs
- **Monitoring:** [Platform dashboard URL]
- **Logs:** [Log aggregation URL]
- **Error Tracking:** [Sentry/similar URL]
- **GitHub Repo:** https://github.com/utnfrrodsw/tp

---

_This checklist ensures nothing is missed before going live. Review before every production deployment._

_Last Updated: April 2026_
