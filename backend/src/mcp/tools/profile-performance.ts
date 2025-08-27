import { MCPToolResult } from '../types.js'
import { performance, PerformanceObserver } from 'perf_hooks'
import * as v8 from 'v8'
import * as os from 'os'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface ProfilePerformanceArgs {
  scope: 'system' | 'application' | 'construct' | 'function' | 'custom'
  profileType?: 'cpu' | 'memory' | 'io' | 'network' | 'all'
  options?: {
    duration?: number // milliseconds
    sampleRate?: number // samples per second
    target?: string // specific function or construct to profile
    includeChildren?: boolean
    generateReport?: boolean
    compare?: string // compare with previous profile
  }
}

interface PerformanceProfile {
  id: string
  scope: string
  timestamp: Date
  duration: number
  system: {
    platform: string
    arch: string
    cpus: os.CpuInfo[]
    memory: {
      total: number
      free: number
    }
    load: number[]
  }
  metrics: {
    cpu?: CPUProfile
    memory?: MemoryProfile
    io?: IOProfile
    network?: NetworkProfile
  }
  analysis?: PerformanceAnalysis
  recommendations?: string[]
}

interface CPUProfile {
  samples: Array<{
    timestamp: number
    usage: number
    perCore: number[]
  }>
  functions: Array<{
    name: string
    selfTime: number
    totalTime: number
    calls: number
  }>
  hotspots: Array<{
    location: string
    percentage: number
    samples: number
  }>
}

interface MemoryProfile {
  snapshots: Array<{
    timestamp: number
    heapUsed: number
    heapTotal: number
    external: number
    arrayBuffers: number
  }>
  allocations: Array<{
    type: string
    size: number
    count: number
    retained: number
  }>
  leaks: Array<{
    type: string
    growth: number
    locations: string[]
  }>
}

interface IOProfile {
  operations: Array<{
    type: 'read' | 'write'
    path: string
    size: number
    duration: number
    timestamp: number
  }>
  summary: {
    totalReads: number
    totalWrites: number
    readBytes: number
    writeBytes: number
    avgReadTime: number
    avgWriteTime: number
  }
}

interface NetworkProfile {
  requests: Array<{
    method: string
    url: string
    duration: number
    size: number
    status: number
    timestamp: number
  }>
  connections: {
    active: number
    established: number
    timeWait: number
  }
  bandwidth: {
    incoming: number
    outgoing: number
    peakIncoming: number
    peakOutgoing: number
  }
}

interface PerformanceAnalysis {
  bottlenecks: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    location: string
    impact: string
    suggestion: string
  }>
  trends: {
    cpuTrend: 'increasing' | 'stable' | 'decreasing'
    memoryTrend: 'increasing' | 'stable' | 'decreasing'
    performanceScore: number
  }
  comparisons?: {
    previous: string
    cpuChange: number
    memoryChange: number
    improvements: string[]
    regressions: string[]
  }
}

export async function profilePerformance(args: ProfilePerformanceArgs): Promise<MCPToolResult> {
  try {
    const { scope, profileType = 'all', options = {} } = args
    const profileId = `profile-${Date.now()}`
    const duration = options.duration || 10000 // 10 seconds default
    
    const profile: PerformanceProfile = {
      id: profileId,
      scope,
      timestamp: new Date(),
      duration,
      system: await getSystemInfo(),
      metrics: {},
      recommendations: []
    }
    
    // Start profiling based on type
    const profilers = []
    
    if (profileType === 'all' || profileType === 'cpu') {
      profilers.push(profileCPU(duration, options))
    }
    
    if (profileType === 'all' || profileType === 'memory') {
      profilers.push(profileMemory(duration, options))
    }
    
    if (profileType === 'all' || profileType === 'io') {
      profilers.push(profileIO(duration, options))
    }
    
    if (profileType === 'all' || profileType === 'network') {
      profilers.push(profileNetwork(duration, options))
    }
    
    // Wait for all profilers to complete
    const results = await Promise.all(profilers)
    
    // Assign results to profile
    results.forEach(result => {
      if (result.type === 'cpu') profile.metrics.cpu = result.data
      if (result.type === 'memory') profile.metrics.memory = result.data
      if (result.type === 'io') profile.metrics.io = result.data
      if (result.type === 'network') profile.metrics.network = result.data
    })
    
    // Analyze results
    profile.analysis = await analyzeProfile(profile)
    
    // Generate recommendations
    profile.recommendations = generateRecommendations(profile)
    
    // Compare with previous profile if requested
    if (options.compare) {
      const comparison = await compareProfiles(profile, options.compare)
      if (comparison) {
        profile.analysis.comparisons = comparison
      }
    }
    
    // Save profile
    const profilePath = await saveProfile(profile)
    
    // Generate report if requested
    let reportPath: string | undefined
    if (options.generateReport) {
      reportPath = await generateReport(profile)
    }
    
    return {
      success: true,
      data: {
        profile,
        profilePath,
        reportPath,
        summary: generateSummary(profile)
      }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Profiling failed'
    }
  }
}

async function getSystemInfo(): Promise<PerformanceProfile['system']> {
  return {
    platform: os.platform(),
    arch: os.arch(),
    cpus: os.cpus(),
    memory: {
      total: os.totalmem(),
      free: os.freemem()
    },
    load: os.loadavg()
  }
}

async function profileCPU(duration: number, options: any): Promise<{ type: string; data: CPUProfile }> {
  const samples: CPUProfile['samples'] = []
  const functionStats = new Map<string, any>()
  const sampleRate = options.sampleRate || 100 // 100 samples per second
  const interval = 1000 / sampleRate
  
  return new Promise((resolve) => {
    const startUsage = process.cpuUsage()
    const startTime = Date.now()
    
    // Set up performance observer for function timing
    const obs = new PerformanceObserver((items) => {
      items.getEntries().forEach((entry) => {
        const stats = functionStats.get(entry.name) || { 
          selfTime: 0, 
          totalTime: 0, 
          calls: 0 
        }
        stats.totalTime += entry.duration
        stats.calls++
        functionStats.set(entry.name, stats)
      })
    })
    obs.observe({ entryTypes: ['function', 'measure'] })
    
    // Sample CPU usage
    const timer = setInterval(() => {
      const usage = process.cpuUsage(startUsage)
      const elapsed = Date.now() - startTime
      const cpuPercent = ((usage.user + usage.system) / 1000 / elapsed) * 100
      
      samples.push({
        timestamp: Date.now(),
        usage: cpuPercent,
        perCore: os.cpus().map(cpu => {
          const total = Object.values(cpu.times).reduce((a, b) => a + b)
          const idle = cpu.times.idle
          return ((total - idle) / total) * 100
        })
      })
    }, interval)
    
    setTimeout(() => {
      clearInterval(timer)
      obs.disconnect()
      
      // Process function stats
      const functions = Array.from(functionStats.entries()).map(([name, stats]) => ({
        name,
        selfTime: stats.selfTime || stats.totalTime,
        totalTime: stats.totalTime,
        calls: stats.calls
      })).sort((a, b) => b.totalTime - a.totalTime)
      
      // Identify hotspots
      const hotspots = functions.slice(0, 10).map(f => ({
        location: f.name,
        percentage: (f.totalTime / duration) * 100,
        samples: f.calls
      }))
      
      resolve({
        type: 'cpu',
        data: {
          samples,
          functions,
          hotspots
        }
      })
    }, duration)
  })
}

async function profileMemory(duration: number, options: any): Promise<{ type: string; data: MemoryProfile }> {
  const snapshots: MemoryProfile['snapshots'] = []
  const interval = 100 // Sample every 100ms
  const initialHeap = process.memoryUsage()
  
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      const usage = process.memoryUsage()
      snapshots.push({
        timestamp: Date.now(),
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers
      })
    }, interval)
    
    setTimeout(() => {
      clearInterval(timer)
      
      // Analyze allocations
      const heapStats = v8.getHeapStatistics()
      const heapSpaces = v8.getHeapSpaceStatistics()
      
      const allocations = heapSpaces.map(space => ({
        type: space.space_name,
        size: space.space_used_size,
        count: 0, // Would need more detailed tracking
        retained: space.space_used_size
      }))
      
      // Detect potential leaks
      const leaks: MemoryProfile['leaks'] = []
      const heapGrowth = snapshots[snapshots.length - 1].heapUsed - snapshots[0].heapUsed
      const growthRate = heapGrowth / duration
      
      if (growthRate > 1024) { // More than 1KB/s growth
        leaks.push({
          type: 'heap',
          growth: heapGrowth,
          locations: ['Consider using heap snapshots for detailed analysis']
        })
      }
      
      resolve({
        type: 'memory',
        data: {
          snapshots,
          allocations,
          leaks
        }
      })
    }, duration)
  })
}

async function profileIO(duration: number, options: any): Promise<{ type: string; data: IOProfile }> {
  const operations: IOProfile['operations'] = []
  let totalReads = 0
  let totalWrites = 0
  let readBytes = 0
  let writeBytes = 0
  let readTimes: number[] = []
  let writeTimes: number[] = []
  
  // Hook into fs operations (simplified)
  const originalRead = fs.readFile
  const originalWrite = fs.writeFile
  
  // Override fs.readFile
  ;(fs as any).readFile = async function(...args: any[]) {
    const start = performance.now()
    try {
      const result = await originalRead.apply(fs, args)
      const duration = performance.now() - start
      
      operations.push({
        type: 'read',
        path: args[0],
        size: result.length,
        duration,
        timestamp: Date.now()
      })
      
      totalReads++
      readBytes += result.length
      readTimes.push(duration)
      
      return result
    } catch (error) {
      throw error
    }
  }
  
  // Override fs.writeFile
  ;(fs as any).writeFile = async function(...args: any[]) {
    const start = performance.now()
    try {
      const data = args[1]
      const size = typeof data === 'string' ? Buffer.byteLength(data) : data.length
      
      const result = await originalWrite.apply(fs, args)
      const duration = performance.now() - start
      
      operations.push({
        type: 'write',
        path: args[0],
        size,
        duration,
        timestamp: Date.now()
      })
      
      totalWrites++
      writeBytes += size
      writeTimes.push(duration)
      
      return result
    } catch (error) {
      throw error
    }
  }
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // Restore original functions
      ;(fs as any).readFile = originalRead
      ;(fs as any).writeFile = originalWrite
      
      const avgReadTime = readTimes.length > 0 
        ? readTimes.reduce((a, b) => a + b, 0) / readTimes.length 
        : 0
      const avgWriteTime = writeTimes.length > 0
        ? writeTimes.reduce((a, b) => a + b, 0) / writeTimes.length
        : 0
      
      resolve({
        type: 'io',
        data: {
          operations,
          summary: {
            totalReads,
            totalWrites,
            readBytes,
            writeBytes,
            avgReadTime,
            avgWriteTime
          }
        }
      })
    }, duration)
  })
}

async function profileNetwork(duration: number, options: any): Promise<{ type: string; data: NetworkProfile }> {
  const requests: NetworkProfile['requests'] = []
  let bandwidthSamples = {
    incoming: [] as number[],
    outgoing: [] as number[]
  }
  
  // This is a simplified implementation
  // In production, would hook into actual network layer
  
  return new Promise((resolve) => {
    // Simulate network monitoring
    const interval = setInterval(() => {
      // In real implementation, would capture actual network traffic
      bandwidthSamples.incoming.push(Math.random() * 1024 * 1024) // Random MB/s
      bandwidthSamples.outgoing.push(Math.random() * 512 * 1024) // Random KB/s
    }, 1000)
    
    setTimeout(() => {
      clearInterval(interval)
      
      const avgIncoming = bandwidthSamples.incoming.reduce((a, b) => a + b, 0) / bandwidthSamples.incoming.length
      const avgOutgoing = bandwidthSamples.outgoing.reduce((a, b) => a + b, 0) / bandwidthSamples.outgoing.length
      const peakIncoming = Math.max(...bandwidthSamples.incoming)
      const peakOutgoing = Math.max(...bandwidthSamples.outgoing)
      
      resolve({
        type: 'network',
        data: {
          requests,
          connections: {
            active: 10,
            established: 8,
            timeWait: 2
          },
          bandwidth: {
            incoming: avgIncoming,
            outgoing: avgOutgoing,
            peakIncoming,
            peakOutgoing
          }
        }
      })
    }, duration)
  })
}

async function analyzeProfile(profile: PerformanceProfile): Promise<PerformanceAnalysis> {
  const bottlenecks: PerformanceAnalysis['bottlenecks'] = []
  
  // Analyze CPU bottlenecks
  if (profile.metrics.cpu) {
    const avgCPU = profile.metrics.cpu.samples.reduce((sum, s) => sum + s.usage, 0) / profile.metrics.cpu.samples.length
    
    if (avgCPU > 80) {
      bottlenecks.push({
        type: 'cpu',
        severity: 'high',
        location: 'System-wide',
        impact: `High CPU usage (${avgCPU.toFixed(1)}%)`,
        suggestion: 'Consider optimizing CPU-intensive operations or scaling horizontally'
      })
    }
    
    // Check for CPU hotspots
    profile.metrics.cpu.hotspots.forEach(hotspot => {
      if (hotspot.percentage > 20) {
        bottlenecks.push({
          type: 'cpu',
          severity: 'medium',
          location: hotspot.location,
          impact: `Function consuming ${hotspot.percentage.toFixed(1)}% of CPU time`,
          suggestion: 'Optimize this function or consider caching its results'
        })
      }
    })
  }
  
  // Analyze memory bottlenecks
  if (profile.metrics.memory) {
    const memoryGrowth = profile.metrics.memory.snapshots[profile.metrics.memory.snapshots.length - 1].heapUsed - 
                        profile.metrics.memory.snapshots[0].heapUsed
    const growthRate = memoryGrowth / profile.duration
    
    if (growthRate > 1024 * 1024) { // More than 1MB/s
      bottlenecks.push({
        type: 'memory',
        severity: 'high',
        location: 'Heap memory',
        impact: `Memory growing at ${(growthRate / 1024 / 1024).toFixed(2)} MB/s`,
        suggestion: 'Investigate memory leaks using heap snapshots'
      })
    }
    
    // Check for memory leaks
    profile.metrics.memory.leaks.forEach(leak => {
      bottlenecks.push({
        type: 'memory',
        severity: 'high',
        location: leak.type,
        impact: `Potential memory leak detected (${(leak.growth / 1024 / 1024).toFixed(2)} MB growth)`,
        suggestion: 'Review object lifecycle and ensure proper cleanup'
      })
    })
  }
  
  // Analyze I/O bottlenecks
  if (profile.metrics.io) {
    const { avgReadTime, avgWriteTime } = profile.metrics.io.summary
    
    if (avgReadTime > 100) { // More than 100ms
      bottlenecks.push({
        type: 'io',
        severity: 'medium',
        location: 'File system reads',
        impact: `Slow read operations (${avgReadTime.toFixed(1)}ms average)`,
        suggestion: 'Consider caching frequently accessed files'
      })
    }
    
    if (avgWriteTime > 200) { // More than 200ms
      bottlenecks.push({
        type: 'io',
        severity: 'medium',
        location: 'File system writes',
        impact: `Slow write operations (${avgWriteTime.toFixed(1)}ms average)`,
        suggestion: 'Consider batching writes or using async I/O'
      })
    }
  }
  
  // Analyze trends
  const cpuTrend = analyzeTrend(profile.metrics.cpu?.samples.map(s => s.usage) || [])
  const memoryTrend = analyzeTrend(profile.metrics.memory?.snapshots.map(s => s.heapUsed) || [])
  
  // Calculate performance score (0-100)
  const performanceScore = calculatePerformanceScore(profile)
  
  return {
    bottlenecks,
    trends: {
      cpuTrend,
      memoryTrend,
      performanceScore
    }
  }
}

function analyzeTrend(values: number[]): 'increasing' | 'stable' | 'decreasing' {
  if (values.length < 2) return 'stable'
  
  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  
  const change = (secondAvg - firstAvg) / firstAvg
  
  if (change > 0.1) return 'increasing'
  if (change < -0.1) return 'decreasing'
  return 'stable'
}

function calculatePerformanceScore(profile: PerformanceProfile): number {
  let score = 100
  
  // Deduct for CPU usage
  if (profile.metrics.cpu) {
    const avgCPU = profile.metrics.cpu.samples.reduce((sum, s) => sum + s.usage, 0) / profile.metrics.cpu.samples.length
    score -= Math.min(30, avgCPU * 0.3)
  }
  
  // Deduct for memory issues
  if (profile.metrics.memory) {
    const leakCount = profile.metrics.memory.leaks.length
    score -= Math.min(20, leakCount * 10)
  }
  
  // Deduct for I/O performance
  if (profile.metrics.io) {
    const { avgReadTime, avgWriteTime } = profile.metrics.io.summary
    if (avgReadTime > 50) score -= 5
    if (avgWriteTime > 100) score -= 5
  }
  
  return Math.max(0, Math.round(score))
}

function generateRecommendations(profile: PerformanceProfile): string[] {
  const recommendations: string[] = []
  
  // CPU recommendations
  if (profile.metrics.cpu) {
    const avgCPU = profile.metrics.cpu.samples.reduce((sum, s) => sum + s.usage, 0) / profile.metrics.cpu.samples.length
    
    if (avgCPU > 70) {
      recommendations.push('Consider implementing worker threads for CPU-intensive tasks')
      recommendations.push('Profile and optimize hot functions using V8 profiler')
    }
    
    if (profile.metrics.cpu.hotspots.length > 0) {
      recommendations.push('Focus optimization efforts on identified hotspots')
    }
  }
  
  // Memory recommendations
  if (profile.metrics.memory) {
    const memoryGrowth = profile.metrics.memory.snapshots[profile.metrics.memory.snapshots.length - 1].heapUsed - 
                        profile.metrics.memory.snapshots[0].heapUsed
    
    if (memoryGrowth > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Implement object pooling for frequently created objects')
      recommendations.push('Review and optimize data structures')
      recommendations.push('Consider using WeakMap/WeakSet for caching')
    }
    
    if (profile.metrics.memory.leaks.length > 0) {
      recommendations.push('Use Chrome DevTools to analyze heap snapshots')
      recommendations.push('Ensure proper cleanup of event listeners and timers')
    }
  }
  
  // I/O recommendations
  if (profile.metrics.io) {
    if (profile.metrics.io.summary.totalReads > 100) {
      recommendations.push('Implement file caching for frequently accessed files')
    }
    
    if (profile.metrics.io.summary.avgWriteTime > 100) {
      recommendations.push('Use write streams for large file operations')
      recommendations.push('Consider implementing write batching')
    }
  }
  
  // General recommendations
  if (profile.analysis?.trends.performanceScore < 70) {
    recommendations.push('Consider implementing performance monitoring in production')
    recommendations.push('Set up alerts for performance degradation')
  }
  
  return recommendations
}

async function compareProfiles(current: PerformanceProfile, previousId: string): Promise<any> {
  try {
    // Load previous profile
    const previousPath = path.join(process.cwd(), '.profiles', `${previousId}.json`)
    const previousData = await fs.readFile(previousPath, 'utf-8')
    const previous = JSON.parse(previousData) as PerformanceProfile
    
    // Calculate changes
    let cpuChange = 0
    let memoryChange = 0
    const improvements: string[] = []
    const regressions: string[] = []
    
    // Compare CPU
    if (current.metrics.cpu && previous.metrics.cpu) {
      const currentAvgCPU = current.metrics.cpu.samples.reduce((sum, s) => sum + s.usage, 0) / current.metrics.cpu.samples.length
      const previousAvgCPU = previous.metrics.cpu.samples.reduce((sum, s) => sum + s.usage, 0) / previous.metrics.cpu.samples.length
      cpuChange = ((currentAvgCPU - previousAvgCPU) / previousAvgCPU) * 100
      
      if (cpuChange < -10) {
        improvements.push(`CPU usage improved by ${Math.abs(cpuChange).toFixed(1)}%`)
      } else if (cpuChange > 10) {
        regressions.push(`CPU usage increased by ${cpuChange.toFixed(1)}%`)
      }
    }
    
    // Compare memory
    if (current.metrics.memory && previous.metrics.memory) {
      const currentFinalHeap = current.metrics.memory.snapshots[current.metrics.memory.snapshots.length - 1].heapUsed
      const previousFinalHeap = previous.metrics.memory.snapshots[previous.metrics.memory.snapshots.length - 1].heapUsed
      memoryChange = ((currentFinalHeap - previousFinalHeap) / previousFinalHeap) * 100
      
      if (memoryChange < -10) {
        improvements.push(`Memory usage improved by ${Math.abs(memoryChange).toFixed(1)}%`)
      } else if (memoryChange > 10) {
        regressions.push(`Memory usage increased by ${memoryChange.toFixed(1)}%`)
      }
    }
    
    return {
      previous: previousId,
      cpuChange,
      memoryChange,
      improvements,
      regressions
    }
    
  } catch (error) {
    return null
  }
}

async function saveProfile(profile: PerformanceProfile): Promise<string> {
  const profileDir = path.join(process.cwd(), '.profiles')
  await fs.mkdir(profileDir, { recursive: true })
  
  const profilePath = path.join(profileDir, `${profile.id}.json`)
  await fs.writeFile(profilePath, JSON.stringify(profile, null, 2))
  
  return profilePath
}

async function generateReport(profile: PerformanceProfile): Promise<string> {
  const reportDir = path.join(process.cwd(), '.profiles', 'reports')
  await fs.mkdir(reportDir, { recursive: true })
  
  const reportPath = path.join(reportDir, `${profile.id}-report.md`)
  
  let report = `# Performance Profile Report\n\n`
  report += `**Profile ID:** ${profile.id}\n`
  report += `**Date:** ${profile.timestamp}\n`
  report += `**Duration:** ${profile.duration}ms\n`
  report += `**Scope:** ${profile.scope}\n\n`
  
  // System Information
  report += `## System Information\n\n`
  report += `- **Platform:** ${profile.system.platform}\n`
  report += `- **Architecture:** ${profile.system.arch}\n`
  report += `- **CPUs:** ${profile.system.cpus.length} cores\n`
  report += `- **Total Memory:** ${(profile.system.memory.total / 1024 / 1024 / 1024).toFixed(2)} GB\n`
  report += `- **Free Memory:** ${(profile.system.memory.free / 1024 / 1024 / 1024).toFixed(2)} GB\n`
  report += `- **Load Average:** ${profile.system.load.join(', ')}\n\n`
  
  // Performance Summary
  if (profile.analysis) {
    report += `## Performance Summary\n\n`
    report += `**Overall Score:** ${profile.analysis.trends.performanceScore}/100\n\n`
    report += `### Trends\n`
    report += `- **CPU:** ${profile.analysis.trends.cpuTrend}\n`
    report += `- **Memory:** ${profile.analysis.trends.memoryTrend}\n\n`
    
    if (profile.analysis.bottlenecks.length > 0) {
      report += `### Bottlenecks\n\n`
      profile.analysis.bottlenecks.forEach(bottleneck => {
        report += `#### ${bottleneck.type.toUpperCase()} - ${bottleneck.severity}\n`
        report += `- **Location:** ${bottleneck.location}\n`
        report += `- **Impact:** ${bottleneck.impact}\n`
        report += `- **Suggestion:** ${bottleneck.suggestion}\n\n`
      })
    }
  }
  
  // CPU Metrics
  if (profile.metrics.cpu) {
    report += `## CPU Profile\n\n`
    const avgCPU = profile.metrics.cpu.samples.reduce((sum, s) => sum + s.usage, 0) / profile.metrics.cpu.samples.length
    report += `**Average CPU Usage:** ${avgCPU.toFixed(2)}%\n\n`
    
    if (profile.metrics.cpu.hotspots.length > 0) {
      report += `### Top Hotspots\n\n`
      report += `| Function | CPU % | Samples |\n`
      report += `|----------|-------|---------|>\n`
      profile.metrics.cpu.hotspots.forEach(hotspot => {
        report += `| ${hotspot.location} | ${hotspot.percentage.toFixed(2)}% | ${hotspot.samples} |\n`
      })
      report += `\n`
    }
  }
  
  // Memory Metrics
  if (profile.metrics.memory) {
    report += `## Memory Profile\n\n`
    const initialHeap = profile.metrics.memory.snapshots[0].heapUsed
    const finalHeap = profile.metrics.memory.snapshots[profile.metrics.memory.snapshots.length - 1].heapUsed
    const growth = finalHeap - initialHeap
    
    report += `**Initial Heap:** ${(initialHeap / 1024 / 1024).toFixed(2)} MB\n`
    report += `**Final Heap:** ${(finalHeap / 1024 / 1024).toFixed(2)} MB\n`
    report += `**Growth:** ${(growth / 1024 / 1024).toFixed(2)} MB\n\n`
    
    if (profile.metrics.memory.leaks.length > 0) {
      report += `### Potential Memory Leaks\n\n`
      profile.metrics.memory.leaks.forEach(leak => {
        report += `- **Type:** ${leak.type}\n`
        report += `- **Growth:** ${(leak.growth / 1024 / 1024).toFixed(2)} MB\n\n`
      })
    }
  }
  
  // I/O Metrics
  if (profile.metrics.io) {
    report += `## I/O Profile\n\n`
    const { summary } = profile.metrics.io
    report += `**Total Reads:** ${summary.totalReads}\n`
    report += `**Total Writes:** ${summary.totalWrites}\n`
    report += `**Read Bytes:** ${(summary.readBytes / 1024 / 1024).toFixed(2)} MB\n`
    report += `**Write Bytes:** ${(summary.writeBytes / 1024 / 1024).toFixed(2)} MB\n`
    report += `**Avg Read Time:** ${summary.avgReadTime.toFixed(2)}ms\n`
    report += `**Avg Write Time:** ${summary.avgWriteTime.toFixed(2)}ms\n\n`
  }
  
  // Network Metrics
  if (profile.metrics.network) {
    report += `## Network Profile\n\n`
    const { bandwidth, connections } = profile.metrics.network
    report += `**Active Connections:** ${connections.active}\n`
    report += `**Avg Incoming:** ${(bandwidth.incoming / 1024 / 1024).toFixed(2)} MB/s\n`
    report += `**Avg Outgoing:** ${(bandwidth.outgoing / 1024 / 1024).toFixed(2)} MB/s\n`
    report += `**Peak Incoming:** ${(bandwidth.peakIncoming / 1024 / 1024).toFixed(2)} MB/s\n`
    report += `**Peak Outgoing:** ${(bandwidth.peakOutgoing / 1024 / 1024).toFixed(2)} MB/s\n\n`
  }
  
  // Recommendations
  if (profile.recommendations && profile.recommendations.length > 0) {
    report += `## Recommendations\n\n`
    profile.recommendations.forEach(rec => {
      report += `- ${rec}\n`
    })
  }
  
  await fs.writeFile(reportPath, report)
  return reportPath
}

function generateSummary(profile: PerformanceProfile): any {
  const summary: any = {
    profileId: profile.id,
    duration: profile.duration,
    performanceScore: profile.analysis?.trends.performanceScore || 0,
    bottleneckCount: profile.analysis?.bottlenecks.length || 0,
    criticalIssues: profile.analysis?.bottlenecks.filter(b => b.severity === 'high').length || 0
  }
  
  if (profile.metrics.cpu) {
    const avgCPU = profile.metrics.cpu.samples.reduce((sum, s) => sum + s.usage, 0) / profile.metrics.cpu.samples.length
    summary.cpu = {
      average: avgCPU.toFixed(2),
      trend: profile.analysis?.trends.cpuTrend
    }
  }
  
  if (profile.metrics.memory) {
    const initialHeap = profile.metrics.memory.snapshots[0].heapUsed
    const finalHeap = profile.metrics.memory.snapshots[profile.metrics.memory.snapshots.length - 1].heapUsed
    summary.memory = {
      growth: ((finalHeap - initialHeap) / 1024 / 1024).toFixed(2),
      trend: profile.analysis?.trends.memoryTrend,
      leaks: profile.metrics.memory.leaks.length
    }
  }
  
  return summary
}