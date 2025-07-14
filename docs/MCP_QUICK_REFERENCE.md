# MCP Quick Reference Guide

## What is MCP?

The Model Context Protocol (MCP) enables Claude Code to understand and assist with backend provider selection and management in Love Claude Code.

## Quick Start Examples

### 1. Choosing a Provider for Your Project

```
You: "I'm building a social media app for 50k users"
Claude: Let me analyze your requirements...

Based on your needs:
- Firebase is recommended (score: 0.87)
- Real-time features ✓
- Social auth ✓  
- Auto-scaling ✓
- Estimated cost: $45/month
```

### 2. Comparing Costs

```
You: "Compare costs between Firebase and AWS for my app"
Claude: Here's the cost breakdown:

Firebase:
- Monthly: $45
- Yearly: $540
- Includes CDN and real-time

AWS:
- Monthly: $75
- Yearly: $900
- More control but higher complexity
```

### 3. Planning a Migration

```
You: "Help me migrate from local to Firebase"
Claude: I'll create a migration plan:

Steps:
1. Export users (5 min)
2. Convert database (15 min)
3. Upload files (10 min)
4. Update config (5 min)

Total time: ~35 minutes
Risk: Low
```

## Available MCP Tools

| Tool | What it does | Example Question |
|------|--------------|------------------|
| `analyze_project_requirements` | Understands your needs | "What do I need for an e-commerce site?" |
| `list_providers` | Shows available options | "What providers support real-time?" |
| `compare_providers` | Detailed comparisons | "Compare Firebase vs AWS features" |
| `estimate_costs` | Cost projections | "How much for 100k users?" |
| `switch_provider` | Change providers | "Switch to Firebase" |
| `migrate_data` | Move your data | "Migrate my data to AWS" |
| `check_provider_health` | Monitor status | "Is Firebase working?" |
| `get_provider_config` | View settings | "Show my provider config" |

## Provider Quick Comparison

### Local Provider 🏠
**Best for:** Development, learning, complete control
- ✅ Free forever
- ✅ No external dependencies
- ✅ Full data ownership
- ❌ Manual scaling
- ❌ No built-in CDN

### Firebase Provider 🔥
**Best for:** Rapid development, mobile apps, startups
- ✅ Real-time sync
- ✅ Generous free tier
- ✅ Auto-scaling
- ✅ Built-in analytics
- ❌ Vendor lock-in
- ❌ Limited queries

### AWS Provider ☁️
**Best for:** Enterprise, high scale, compliance
- ✅ Unlimited scale
- ✅ Fine control
- ✅ Global infrastructure
- ✅ Compliance certifications
- ❌ Complex setup
- ❌ Steeper learning curve

## Common Scenarios

### Scenario 1: Startup MVP
```
Requirements:
- Quick to market
- Low initial cost
- Easy to use

Recommendation: Firebase
- $0-25/month initially
- Built-in everything
- Focus on product
```

### Scenario 2: Enterprise SaaS
```
Requirements:
- Compliance (SOC2, HIPAA)
- Multi-region
- Fine-grained control

Recommendation: AWS
- Full compliance suite
- Global presence
- Enterprise support
```

### Scenario 3: Learning/Prototyping
```
Requirements:
- No cloud costs
- Full control
- Educational

Recommendation: Local
- Completely free
- Learn fundamentals
- No surprises
```

## Cost Guidelines

### User-based Estimates

**1-1,000 users:**
- Local: $0
- Firebase: $0 (free tier)
- AWS: $0-10 (free tier)

**1,000-10,000 users:**
- Local: $0 + hosting
- Firebase: $0-25
- AWS: $10-50

**10,000-100,000 users:**
- Local: Hosting costs
- Firebase: $25-200
- AWS: $50-500

**100,000+ users:**
- Local: Not recommended
- Firebase: $200+
- AWS: $500+ (but more efficient at scale)

## Migration Timelines

### Local → Firebase
- Small app (< 1k users): 30 minutes
- Medium app (1k-10k users): 2-4 hours
- Large app (10k+ users): 1-2 days

### Firebase → AWS
- Small app: 2-4 hours
- Medium app: 1-2 days
- Large app: 1 week

### AWS → Firebase
- Usually not recommended
- Requires significant refactoring
- 1-4 weeks depending on complexity

## Quick Commands

### In Chat with Claude:
```
"What provider should I use?"
"Compare all providers"
"Estimate my costs"
"Help me migrate"
"Check provider status"
"Show provider features"
```

### In Settings UI:
1. Go to Settings → Providers
2. View current provider
3. Compare providers visually
4. Switch with one click
5. Monitor health status

## Best Practices

1. **Start Local**: Begin development locally
2. **Plan Early**: Consider provider before architecture
3. **Test Migration**: Always test in staging first
4. **Monitor Costs**: Set up billing alerts
5. **Keep Backups**: Before any migration

## Getting Help

- **Documentation**: `/docs/MCP_PROVIDER_SYSTEM.md`
- **API Reference**: `/docs/MCP_API.md`
- **Frontend Guide**: `/docs/FRONTEND_MCP.md`
- **Claude Help**: Just ask in chat!

## FAQ

**Q: Can I use multiple providers?**
A: Currently one provider per project, but you can have different projects with different providers.

**Q: Is migration reversible?**
A: Yes, but always backup first. Some features may need adjustment.

**Q: Which provider is fastest?**
A: Local for development, Firebase for time-to-market, AWS for production scale.

**Q: Can I bring my own provider?**
A: Provider system is extensible. See developer docs for adding custom providers.

**Q: Is my data safe during migration?**
A: Yes, migrations use secure transfer and maintain data integrity. Always backup first.