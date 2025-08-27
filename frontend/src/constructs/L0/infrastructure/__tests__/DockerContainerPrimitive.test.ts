import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DockerContainerPrimitive } from '../DockerContainerPrimitive'

describe('L0: DockerContainerPrimitive', () => {
  let construct: DockerContainerPrimitive

  beforeEach(() => {
    construct = new DockerContainerPrimitive()
  })

  describe('Initialization', () => {
    it('should initialize with required image', async () => {
      await construct.initialize({
        image: 'nginx:latest'
      })
      
      expect(construct.metadata.id).toBe('platform-l0-docker-container-primitive')
      expect(construct.level).toBe('L0')
    })

    it('should use default values for optional inputs', async () => {
      await construct.initialize({
        image: 'alpine:latest'
      })
      
      expect(construct.getInput('environment')).toEqual({})
      expect(construct.getInput('ports')).toEqual([])
      expect(construct.getInput('volumes')).toEqual([])
      expect(construct.getInput('command')).toBeUndefined()
    })

    it('should accept full configuration', async () => {
      await construct.initialize({
        image: 'node:18',
        command: ['node', 'app.js'],
        environment: {
          NODE_ENV: 'production',
          PORT: '3000'
        },
        ports: [
          { host: 3000, container: 3000 },
          { host: 8080, container: 80, protocol: 'tcp' }
        ],
        volumes: [
          { host: './data', container: '/data' },
          { host: './config', container: '/config', readOnly: true }
        ]
      })
      
      expect(construct.getInput('image')).toBe('node:18')
      expect(construct.getInput('command')).toEqual(['node', 'app.js'])
      expect(construct.getInput('environment')).toEqual({
        NODE_ENV: 'production',
        PORT: '3000'
      })
    })
  })

  describe('Platform Construct Features', () => {
    it('should identify as a platform construct', async () => {
      await construct.initialize({ image: 'nginx' })
      
      expect(construct.isPlatformConstruct()).toBe(true)
    })

    it('should have self-referential metadata', async () => {
      await construct.initialize({ image: 'nginx' })
      
      const metadata = construct.getSelfReferentialMetadata()
      expect(metadata).toBeDefined()
      expect(metadata?.isPlatformConstruct).toBe(true)
      expect(metadata?.developmentMethod).toBe('manual')
      expect(metadata?.vibeCodingPercentage).toBe(0)
      expect(metadata?.timeToCreate).toBe(35)
    })

    it('should report zero vibe-coding percentage as L0 primitive', async () => {
      await construct.initialize({ image: 'nginx' })
      
      expect(construct.getVibeCodingPercentage()).toBe(0)
    })

    it('should have no construct dependencies', async () => {
      await construct.initialize({ image: 'nginx' })
      
      expect(construct.getDependencies()).toEqual([])
      expect(construct.getBuiltWithConstructs()).toEqual([])
    })
  })

  describe('Deployment', () => {
    it('should deploy successfully with minimal config', async () => {
      await construct.initialize({ image: 'nginx:latest' })
      
      await expect(construct.deploy()).resolves.not.toThrow()
      
      const outputs = construct.getOutputs()
      expect(outputs.containerId).toBeDefined()
      expect(outputs.containerId).toMatch(/^container-\d+$/)
      expect(outputs.status).toBe('running')
      expect(outputs.logs).toContain('Starting container from image: nginx:latest')
      expect(outputs.logs).toContain('Container started successfully')
    })

    it('should fail deployment without image', async () => {
      await construct.initialize({})
      
      await expect(construct.deploy()).rejects.toThrow('Docker image is required')
    })

    it('should log port mappings during deployment', async () => {
      await construct.initialize({
        image: 'nginx',
        ports: [
          { host: 8080, container: 80 },
          { host: 8443, container: 443 }
        ]
      })
      
      await construct.deploy()
      
      const logs = construct.getLogs()
      expect(logs).toContain('Mapping port 8080 -> 80')
      expect(logs).toContain('Mapping port 8443 -> 443')
    })

    it('should log volume mounts during deployment', async () => {
      await construct.initialize({
        image: 'postgres',
        volumes: [
          { host: './data', container: '/var/lib/postgresql/data' },
          { host: './backup', container: '/backup', readOnly: true }
        ]
      })
      
      await construct.deploy()
      
      const logs = construct.getLogs()
      expect(logs).toContain('Mounting volume ./data -> /var/lib/postgresql/data')
      expect(logs).toContain('Mounting volume ./backup -> /backup')
    })

    it('should log environment variables (masked)', async () => {
      await construct.initialize({
        image: 'mysql',
        environment: {
          MYSQL_ROOT_PASSWORD: 'secret123',
          MYSQL_DATABASE: 'mydb'
        }
      })
      
      await construct.deploy()
      
      const logs = construct.getLogs()
      expect(logs).toContain('Setting environment: MYSQL_ROOT_PASSWORD=***')
      expect(logs).toContain('Setting environment: MYSQL_DATABASE=***')
      expect(logs).not.toContain('secret123')
    })

    it('should log command during deployment', async () => {
      await construct.initialize({
        image: 'node:18',
        command: ['npm', 'run', 'start:prod']
      })
      
      await construct.deploy()
      
      const logs = construct.getLogs()
      expect(logs).toContain('Running command: npm run start:prod')
    })
  })

  describe('Container Lifecycle', () => {
    beforeEach(async () => {
      await construct.initialize({ image: 'nginx' })
      await construct.deploy()
    })

    it('should stop a running container', async () => {
      expect(construct.getOutputs().status).toBe('running')
      
      await construct.stop()
      
      expect(construct.getOutputs().status).toBe('stopped')
      expect(construct.getLogs()).toContain('Container stopped')
    })

    it('should not stop an already stopped container', async () => {
      await construct.stop()
      const logsBeforeSecondStop = construct.getLogs().length
      
      await construct.stop()
      
      const logsAfterSecondStop = construct.getLogs().length
      expect(logsAfterSecondStop).toBe(logsBeforeSecondStop)
    })

    it('should start a stopped container', async () => {
      await construct.stop()
      expect(construct.getOutputs().status).toBe('stopped')
      
      await construct.start()
      
      expect(construct.getOutputs().status).toBe('running')
      expect(construct.getLogs()).toContain('Container started')
    })

    it('should not start an already running container', async () => {
      const logsBeforeStart = construct.getLogs().length
      
      await construct.start()
      
      const logsAfterStart = construct.getLogs().length
      expect(logsAfterStart).toBe(logsBeforeStart)
    })

    it('should remove a container', async () => {
      await construct.remove()
      
      expect(construct.getOutputs().status).toBe('removed')
      expect(construct.getLogs()).toContain('Container removed')
    })

    it('should not remove an already removed container', async () => {
      await construct.remove()
      const logsBeforeSecondRemove = construct.getLogs().length
      
      await construct.remove()
      
      const logsAfterSecondRemove = construct.getLogs().length
      expect(logsAfterSecondRemove).toBe(logsBeforeSecondRemove)
    })
  })

  describe('Container Operations', () => {
    beforeEach(async () => {
      await construct.initialize({ image: 'ubuntu' })
      await construct.deploy()
    })

    it('should execute commands in running container', async () => {
      const output = await construct.exec(['echo', 'hello world'])
      
      expect(output).toBe('Output from: echo hello world')
      expect(construct.getLogs()).toContain('Executing: echo hello world')
      expect(construct.getLogs()).toContain('Output from: echo hello world')
    })

    it('should fail exec on stopped container', async () => {
      await construct.stop()
      
      await expect(construct.exec(['ls', '-la'])).rejects.toThrow('Container is not running')
    })

    it('should fail exec on removed container', async () => {
      await construct.remove()
      
      await expect(construct.exec(['pwd'])).rejects.toThrow('Container is not running')
    })

    it('should handle complex commands', async () => {
      const output = await construct.exec(['sh', '-c', 'echo $PATH | tr ":" "\\n"'])
      
      expect(output).toBe('Output from: sh -c echo $PATH | tr ":" "\\n"')
    })
  })

  describe('Logs Management', () => {
    it('should return copy of logs to prevent external modification', async () => {
      await construct.initialize({ image: 'nginx' })
      await construct.deploy()
      
      const logs1 = construct.getLogs()
      logs1.push('External modification')
      
      const logs2 = construct.getLogs()
      expect(logs2).not.toContain('External modification')
    })

    it('should accumulate logs throughout lifecycle', async () => {
      await construct.initialize({ image: 'nginx' })
      await construct.deploy()
      await construct.stop()
      await construct.start()
      await construct.exec(['ls'])
      await construct.remove()
      
      const logs = construct.getLogs()
      expect(logs).toContain('Starting container from image: nginx')
      expect(logs).toContain('Container started successfully')
      expect(logs).toContain('Container stopped')
      expect(logs).toContain('Container started')
      expect(logs).toContain('Executing: ls')
      expect(logs).toContain('Container removed')
    })
  })

  describe('L0 Characteristics', () => {
    it('should have no security features', async () => {
      await construct.initialize({ image: 'nginx' })
      
      expect(construct.metadata.security).toEqual([])
    })

    it('should have zero cost', async () => {
      await construct.initialize({ image: 'nginx' })
      
      expect(construct.metadata.cost.baseMonthly).toBe(0)
      expect(construct.metadata.cost.usageFactors).toEqual([])
    })

    it('should have no health checks', async () => {
      await construct.initialize({ image: 'nginx' })
      await construct.deploy()
      
      // No health check methods or status
      expect(construct).not.toHaveProperty('healthCheck')
      expect(construct).not.toHaveProperty('isHealthy')
    })

    it('should have no restart policies', async () => {
      await construct.initialize({ image: 'nginx' })
      
      // No restart policy configuration
      expect(construct.getInput('restartPolicy')).toBeUndefined()
      expect(construct).not.toHaveProperty('setRestartPolicy')
    })

    it('should have no resource limits', async () => {
      await construct.initialize({ image: 'nginx' })
      
      // No memory/CPU limits
      expect(construct.getInput('resources')).toBeUndefined()
      expect(construct).not.toHaveProperty('setResourceLimits')
    })

    it('should have no monitoring or metrics', async () => {
      await construct.initialize({ image: 'nginx' })
      
      // No metrics collection
      expect(construct).not.toHaveProperty('getMetrics')
      expect(construct).not.toHaveProperty('getCPUUsage')
      expect(construct).not.toHaveProperty('getMemoryUsage')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty environment object', async () => {
      await construct.initialize({
        image: 'nginx',
        environment: {}
      })
      
      await construct.deploy()
      
      const logs = construct.getLogs()
      expect(logs).not.toContain('Setting environment:')
    })

    it('should handle empty arrays', async () => {
      await construct.initialize({
        image: 'nginx',
        ports: [],
        volumes: []
      })
      
      await construct.deploy()
      
      const logs = construct.getLogs()
      expect(logs).not.toContain('Mapping port')
      expect(logs).not.toContain('Mounting volume')
    })

    it('should handle image with registry', async () => {
      await construct.initialize({
        image: 'docker.io/library/nginx:1.21.6'
      })
      
      await construct.deploy()
      
      expect(construct.getOutputs().logs).toContain('Starting container from image: docker.io/library/nginx:1.21.6')
    })

    it('should handle UDP port protocol', async () => {
      await construct.initialize({
        image: 'dns-server',
        ports: [
          { host: 53, container: 53, protocol: 'udp' }
        ]
      })
      
      await construct.deploy()
      
      expect(construct.getLogs()).toContain('Mapping port 53 -> 53')
    })

    it('should generate unique container IDs', async () => {
      const container1 = new DockerContainerPrimitive()
      const container2 = new DockerContainerPrimitive()
      
      await container1.initialize({ image: 'nginx' })
      await container2.initialize({ image: 'nginx' })
      
      await container1.deploy()
      await container2.deploy()
      
      const id1 = container1.getOutputs().containerId
      const id2 = container2.getOutputs().containerId
      
      expect(id1).not.toBe(id2)
    })
  })
})