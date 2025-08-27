import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Label } from '../UI/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../UI/Select';
import { Switch } from '../UI/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../UI/Tabs';
import { Badge } from '../UI/Badge';
import { Progress } from '../UI/Progress';
import { Alert, AlertDescription, AlertTitle } from '../UI/Alert';
import { ScrollArea } from '../UI/ScrollArea';
import { Slider } from '../UI/Slider';
import {
  Rocket,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Download,
  GitBranch,
  RefreshCw,
  Server,
  Shield,
  Zap,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Info,
  Terminal
} from 'lucide-react';
import {
  selfDeploymentService,
  DeploymentConfig,
  DeploymentResult,
  DeploymentStatus
} from '../../services/deployment/selfDeployment';
import { platformVersion } from '../../services/versioning/platformVersion';
import { platformSelfTest } from '../../services/selfTest/platformSelfTest';
import { toast } from 'react-hot-toast';

export const PlatformDeployment: React.FC = () => {
  const [activeTab, setActiveTab] = useState('deploy');
  const [currentVersion, setCurrentVersion] = useState('');
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [deploymentConfig, setDeploymentConfig] = useState<DeploymentConfig>({
    environment: 'development',
    version: '',
    features: {
      hotReload: true,
      gradualRollout: false,
      autoRollback: true,
      runTests: true
    },
    rollout: {
      strategy: 'immediate'
    },
    providers: {
      backend: 'local',
      hosting: 'local'
    }
  });
  const [currentDeployment, setCurrentDeployment] = useState<DeploymentResult | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentResult[]>([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  useEffect(() => {
    loadVersionInfo();
    loadDeploymentHistory();
    checkPlatformHealth();
  }, []);

  useEffect(() => {
    if (currentDeployment && currentDeployment.status !== 'completed' && currentDeployment.status !== 'failed') {
      const unsubscribe = selfDeploymentService.subscribeToDeployment(
        currentDeployment.id,
        (deployment) => {
          setCurrentDeployment(deployment);
          if (deployment.status === 'completed' || deployment.status === 'failed') {
            setIsDeploying(false);
            loadDeploymentHistory();
          }
        }
      );
      return unsubscribe;
    }
  }, [currentDeployment]);

  const loadVersionInfo = async () => {
    const current = await selfDeploymentService.getCurrentVersion();
    const versions = await selfDeploymentService.getAvailableVersions();
    setCurrentVersion(current);
    setAvailableVersions(versions);
    if (versions.length > 0 && !deploymentConfig.version) {
      setDeploymentConfig(prev => ({ ...prev, version: versions[0] }));
    }
  };

  const loadDeploymentHistory = () => {
    const history = selfDeploymentService.getDeploymentHistory();
    setDeploymentHistory(history);
  };

  const checkPlatformHealth = async () => {
    const health = await platformSelfTest.checkHealth();
    setHealthStatus(health);
  };

  const handleDeploy = async () => {
    if (!deploymentConfig.version) {
      toast.error('Please select a version to deploy');
      return;
    }

    setIsDeploying(true);
    try {
      const result = await selfDeploymentService.deployPlatform(deploymentConfig);
      setCurrentDeployment(result);
    } catch (error) {
      setIsDeploying(false);
      console.error('Deployment failed:', error);
    }
  };

  const handleRollback = async (deploymentId: string) => {
    try {
      await selfDeploymentService.rollback(deploymentId);
      toast.success('Rollback initiated');
      loadDeploymentHistory();
    } catch (error) {
      toast.error('Rollback failed');
      console.error('Rollback failed:', error);
    }
  };

  const getStatusIcon = (status: DeploymentStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'deploying':
      case 'testing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'rolling-back':
        return <RotateCcw className="h-4 w-4 text-orange-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: DeploymentStatus): string => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'deploying': return 'bg-blue-100 text-blue-800';
      case 'testing': return 'bg-purple-100 text-purple-800';
      case 'rolling-back': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Platform Self-Hosting</h1>
        <p className="text-gray-600">Deploy and manage your Love Claude Code platform</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Current Version
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentVersion}</div>
            <div className="text-sm text-gray-500">Running in production</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Platform Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthStatus && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-3 w-3 rounded-full ${
                    healthStatus.status === 'healthy' ? 'bg-green-500' :
                    healthStatus.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="font-medium capitalize">{healthStatus.status}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {healthStatus.summary.healthy}/{healthStatus.summary.total} checks passing
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              Last Deployment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deploymentHistory.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-1">
                  {getStatusIcon(deploymentHistory[0].status)}
                  <span className="font-medium capitalize">{deploymentHistory[0].status}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(deploymentHistory[0].startTime).toLocaleString()}
                </div>
              </>
            ) : (
              <div className="text-gray-500">No deployments yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deploy">Deploy</TabsTrigger>
          <TabsTrigger value="monitor">Monitor</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="deploy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deploy Platform</CardTitle>
              <CardDescription>
                Configure and deploy a new version of the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="version">Version</Label>
                  <Select
                    value={deploymentConfig.version}
                    onValueChange={(value) => setDeploymentConfig(prev => ({ ...prev, version: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select version" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVersions.map(version => (
                        <SelectItem key={version} value={version}>
                          {version}
                          {version === currentVersion && ' (current)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="environment">Environment</Label>
                  <Select
                    value={deploymentConfig.environment}
                    onValueChange={(value: any) => setDeploymentConfig(prev => ({ ...prev, environment: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="development">Development</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="production">Production</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Deployment Features</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <Label htmlFor="hotReload">Hot Reload</Label>
                    </div>
                    <Switch
                      checked={deploymentConfig.features.hotReload}
                      onCheckedChange={(checked) => 
                        setDeploymentConfig(prev => ({
                          ...prev,
                          features: { ...prev.features, hotReload: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <Label htmlFor="autoRollback">Auto Rollback</Label>
                    </div>
                    <Switch
                      checked={deploymentConfig.features.autoRollback}
                      onCheckedChange={(checked) => 
                        setDeploymentConfig(prev => ({
                          ...prev,
                          features: { ...prev.features, autoRollback: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-500" />
                      <Label htmlFor="runTests">Run Tests</Label>
                    </div>
                    <Switch
                      checked={deploymentConfig.features.runTests}
                      onCheckedChange={(checked) => 
                        setDeploymentConfig(prev => ({
                          ...prev,
                          features: { ...prev.features, runTests: checked }
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-purple-500" />
                      <Label htmlFor="gradualRollout">Gradual Rollout</Label>
                    </div>
                    <Switch
                      checked={deploymentConfig.features.gradualRollout}
                      onCheckedChange={(checked) => 
                        setDeploymentConfig(prev => ({
                          ...prev,
                          features: { ...prev.features, gradualRollout: checked }
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">Rollout Strategy</h4>
                <div className="space-y-2">
                  <Select
                    value={deploymentConfig.rollout.strategy}
                    onValueChange={(value: any) => 
                      setDeploymentConfig(prev => ({
                        ...prev,
                        rollout: { ...prev.rollout, strategy: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="canary">Canary</SelectItem>
                      <SelectItem value="blue-green">Blue-Green</SelectItem>
                    </SelectContent>
                  </Select>

                  {deploymentConfig.rollout.strategy === 'canary' && (
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Canary Percentage: {deploymentConfig.rollout.canaryPercentage || 10}%</Label>
                        <Slider
                          value={[deploymentConfig.rollout.canaryPercentage || 10]}
                          onValueChange={([value]) => 
                            setDeploymentConfig(prev => ({
                              ...prev,
                              rollout: { ...prev.rollout, canaryPercentage: value }
                            }))
                          }
                          min={5}
                          max={50}
                          step={5}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Duration: {deploymentConfig.rollout.canaryDuration || 30} minutes</Label>
                        <Slider
                          value={[deploymentConfig.rollout.canaryDuration || 30]}
                          onValueChange={([value]) => 
                            setDeploymentConfig(prev => ({
                              ...prev,
                              rollout: { ...prev.rollout, canaryDuration: value }
                            }))
                          }
                          min={15}
                          max={120}
                          step={15}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={handleDeploy}
                disabled={isDeploying || !deploymentConfig.version}
                className="w-full"
                size="lg"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Deploying...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Deploy Platform
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitor" className="space-y-4">
          {currentDeployment ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Current Deployment</CardTitle>
                    <CardDescription>Deployment ID: {currentDeployment.id}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(currentDeployment.status)}>
                    {getStatusIcon(currentDeployment.status)}
                    <span className="ml-1">{currentDeployment.status}</span>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentDeployment.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">Duration</div>
                      <div className="text-xl font-semibold">
                        {Math.round(currentDeployment.metrics.duration / 1000)}s
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">Tests</div>
                      <div className="text-xl font-semibold">
                        {currentDeployment.metrics.testsPassed}/{currentDeployment.metrics.testsRun}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">Performance</div>
                      <div className="text-xl font-semibold">
                        {currentDeployment.metrics.performanceScore}%
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500">Health</div>
                      <div className="text-xl font-semibold capitalize">
                        {currentDeployment.metrics.healthCheckStatus}
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    Deployment Logs
                  </h4>
                  <ScrollArea className="h-64 w-full rounded-md border p-4 bg-gray-50">
                    <div className="space-y-1">
                      {currentDeployment.logs.map((log, index) => (
                        <div key={index} className="font-mono text-sm">
                          <span className="text-gray-500">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>
                          <span className={`ml-2 ${
                            log.level === 'error' ? 'text-red-600' :
                            log.level === 'warning' ? 'text-yellow-600' : 'text-gray-700'
                          }`}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {currentDeployment.status === 'failed' && currentDeployment.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Deployment Failed</AlertTitle>
                    <AlertDescription>{currentDeployment.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No active deployment</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment History</CardTitle>
              <CardDescription>
                View past deployments and rollback if needed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deploymentHistory.length > 0 ? (
                  deploymentHistory.map((deployment) => (
                    <div
                      key={deployment.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-4">
                        {getStatusIcon(deployment.status)}
                        <div>
                          <div className="font-medium">Version {deployment.version}</div>
                          <div className="text-sm text-gray-500">
                            {deployment.environment} · {new Date(deployment.startTime).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(deployment.status)}>
                          {deployment.status}
                        </Badge>
                        {deployment.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRollback(deployment.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No deployment history
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Deployment Settings</CardTitle>
              <CardDescription>
                Configure deployment providers and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Backend Provider</Label>
                  <Select
                    value={deploymentConfig.providers.backend}
                    onValueChange={(value: any) => 
                      setDeploymentConfig(prev => ({
                        ...prev,
                        providers: { ...prev.providers, backend: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="firebase">Firebase</SelectItem>
                      <SelectItem value="aws">AWS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Hosting Provider</Label>
                  <Select
                    value={deploymentConfig.providers.hosting}
                    onValueChange={(value: any) => 
                      setDeploymentConfig(prev => ({
                        ...prev,
                        providers: { ...prev.providers, hosting: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Local</SelectItem>
                      <SelectItem value="vercel">Vercel</SelectItem>
                      <SelectItem value="netlify">Netlify</SelectItem>
                      <SelectItem value="aws">AWS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Provider Configuration</AlertTitle>
                <AlertDescription>
                  Provider-specific settings can be configured in the main Settings page.
                  Make sure your selected providers are properly configured before deployment.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};