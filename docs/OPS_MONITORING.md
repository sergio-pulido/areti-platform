# Operations Monitoring

## Notification Digest Monitoring

Use the existing healthcheck command as the monitor target:

```bash
npm run job:notification-digest:healthcheck
```

The command exits with:
- `0` when healthy
- `1` when unhealthy (stale lock or recent failed run)

### Recommended scheduler wiring

Run digest and healthcheck on separate schedules:

```bash
# Every hour: generate reminders
0 * * * * cd /Users/nectios/nekotori/dev/stoicism && npm run job:notification-digest

# Every 5 minutes: monitor health
*/5 * * * * cd /Users/nectios/nekotori/dev/stoicism && npm run job:notification-digest:healthcheck
```

### Paging integration pattern

Any external monitor that pages on non-zero exit can be used (Cronitor, Better Stack, PagerDuty wrappers, etc.).

Example pattern:
1. Configure monitor command to run `npm run job:notification-digest:healthcheck`.
2. Trigger alert when exit code is non-zero.
3. Route alerts to on-call paging policy.

### In-app triage

Use CMS:
- `/creator/cms` System Job Runs cards for latest health and thresholds
- Filter run list by status/time window for incident isolation

Or query APIs directly:
- `GET /api/v1/admin/system/jobs/summary?jobName=notification_digest`
- `GET /api/v1/admin/system/jobs/runs?jobName=notification_digest&status=error&days=7`
