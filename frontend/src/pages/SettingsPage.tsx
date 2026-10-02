import { useEffect, useState } from 'react';
import { settingsApi } from '../services/api';
import type { ModelInfo, AISettings } from '../types';
import { 
  Cpu, Database, CheckCircle, RefreshCw, 
  Wifi, WifiOff, Download, Zap, Monitor
} from 'lucide-react';

export function SettingsPage() {
  const [aiSettings, setAiSettings] = useState<AISettings | null>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [ollamaModels, setOllamaModels] = useState<ModelInfo[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<ModelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<string | null>(null);
  const [testingGeneration, setTestingGeneration] = useState<string | null>(null);
  const [pullingModel, setPullingModel] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('ollama');
  const [selectedModel, setSelectedModel] = useState('');
  const [generationResult, setGenerationResult] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [aiRes, sysRes, ollamaRes, orRes] = await Promise.all([
        settingsApi.getAI(),
        settingsApi.getSystemInfo(),
        settingsApi.listOllamaModels().catch(() => ({ data: { models: [] } })),
        settingsApi.listOpenRouterModels().catch(() => ({ data: { models: [] } })),
      ]);
      setAiSettings(aiRes.data);
      setSystemInfo(sysRes.data);
      setOllamaModels(ollamaRes.data.models || []);
      setOpenRouterModels(orRes.data.models || []);
      setSelectedProvider(aiRes.data.provider);
      setSelectedModel(aiRes.data.current_model || '');
      setLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      setLoading(false);
    }
  };

  const handleTestConnection = async (provider: string) => {
    setTesting(provider);
    try {
      await settingsApi.testAI(provider);
      alert(`${provider} connection successful!`);
    } catch (error) {
      alert(`${provider} connection failed: ${error}`);
    } finally {
      setTesting(null);
    }
  };

  const handlePullModel = async (modelName: string) => {
    setPullingModel(modelName);
    try {
      await settingsApi.pullOllamaModel(modelName);
      alert(`Model ${modelName} pulled successfully!`);
      loadSettings();
    } catch (error) {
      alert(`Failed to pull model: ${error}`);
    } finally {
      setPullingModel(null);
    }
  };

  const handleTestGeneration = async (modelName: string) => {
    setTestingGeneration(modelName);
    setGenerationResult(null);
    try {
      const response = await settingsApi.testOllamaGeneration(modelName);
      setGenerationResult(`✅ Success!\n\nPrompt: ${response.prompt}\n\nResponse: ${response.response}`);
      alert('Generation successful! Check result below.');
    } catch (error: any) {
      const msg = error.response?.data?.detail || error.message;
      setGenerationResult(`❌ Failed: ${msg}`);
      alert(`Generation failed: ${msg}`);
    } finally {
      setTestingGeneration(null);
    }
  };

  const getModelsForProvider = (provider: string) => {
    return provider === 'ollama' ? ollamaModels : openRouterModels;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure AI providers and system settings</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            AI Provider Settings
          </h2>
        </div>
        <div className="card-body space-y-6">
          <div>
            <label className="label">AI Provider</label>
            <div className="flex gap-4">
              {aiSettings?.available_providers?.map((provider: string) => (
                <label key={provider} className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedProvider === provider ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-200'
                }`}>
                  <input
                    type="radio"
                    name="ai-provider"
                    value={provider}
                    checked={selectedProvider === provider}
                    onChange={(e) => setSelectedProvider(e.target.value)}
                    className="h-4 w-4 text-primary-600"
                  />
                  <span className="capitalize font-medium">{provider}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="input w-full md:w-1/2"
            >
              <option value="">Select a model</option>
              {getModelsForProvider(selectedProvider).map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name} {model.size ? `(${model.size})` : ''} {model.parameters ? `- ${model.parameters}` : ''}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              {selectedProvider === 'ollama' 
                ? 'Models are managed by Ollama locally' 
                : 'Models are hosted on OpenRouter'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Temperature</label>
              <input type="range" min="0" max="1" step="0.1" defaultValue={0.4} className="w-full" />
              <p className="text-sm text-gray-500 mt-1">Controls randomness (0 = deterministic, 1 = creative)</p>
            </div>
            <div>
              <label className="label">Context Length</label>
              <input type="number" defaultValue={8192} className="input w-full md:w-1/2" />
              <p className="text-sm text-gray-500 mt-1">Maximum tokens for context window</p>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            {aiSettings?.available_providers?.map((provider: string) => (
              <button
                key={provider}
                onClick={() => handleTestConnection(provider)}
                disabled={testing !== null}
                className="btn-secondary flex-1"
              >
                {testing === provider ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : provider === 'ollama' ? (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Test Local Ollama
                  </>
                ) : (
                  <>
                    <Wifi className="h-4 w-4 mr-2" />
                    Test OpenRouter
                  </>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedProvider === 'ollama' && ollamaModels.length > 0 && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Database className="h-5 w-5" />
              Available Ollama Models
            </h2>
            <button onClick={loadSettings} className="btn-ghost">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="card-body">
            <div className="space-y-2">
              {ollamaModels.map((model) => (
                <div key={model.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedModel === model.name ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}>
                      {selectedModel === model.name ? <CheckCircle className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{model.name}</p>
                      <p className="text-sm text-gray-500">
                        {model.size} • {model.parameters} • {model.quantization} • {model.context_length}K ctx
                      </p>
                    </div>
                  </div>
<div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleTestGeneration(model.name)} 
                      disabled={testingGeneration === model.name || pullingModel === model.name}
                      className="btn-ghost p-2"
                      title="Test generation"
                    >
                      {testingGeneration === model.name ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <span className="text-xs font-medium">Test</span>
                      )}
                    </button>
                    <button 
                      onClick={() => handlePullModel(model.name)} 
                      disabled={pullingModel === model.name || testingGeneration === model.name}
                      className="btn-ghost p-2"
                    >
                      {pullingModel === model.name ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {systemInfo && (
        <div className="card">
          <div className="card-header flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              System Information
            </h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">Platform</p>
                <p className="font-medium text-gray-900">{systemInfo.platform}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">RAM</p>
                <p className="font-medium text-gray-900">{systemInfo.ram_gb} GB</p>
                <p className="text-sm text-gray-500">{systemInfo.ram_available_gb} GB available</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">CPU Cores</p>
                <p className="font-medium text-gray-900">{systemInfo.cpu_count}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">GPU</p>
                <p className="font-medium text-gray-900 text-sm">{systemInfo.gpu}</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-xl">
              <h3 className="font-medium text-primary-900 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Recommended Model Size
              </h3>
              <p className="text-primary-700">{systemInfo.recommended_model_size}</p>
              <p className="text-sm text-primary-600 mt-1">Based on your system's available memory</p>
            </div>

            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                {systemInfo.ollama_available ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-red-600" />}
                Ollama Status: {systemInfo.ollama_available ? 'Running' : 'Not Available'}
              </h3>
              {!systemInfo.ollama_available && (
                <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    Ollama is not running. Please install and start Ollama to use local models.
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Visit <a href="https://ollama.ai" target="_blank" rel="noopener" className="underline">ollama.ai</a> for installation instructions.
                  </p>
</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {generationResult && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-green-600">✓</span>
              Generation Result
            </h2>
          </div>
          <div className="card-body">
            <div className="bg-gray-100 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto">
              {generationResult}
            </div>
            <button onClick={() => setGenerationResult(null)} className="btn-ghost mt-2">Dismiss</button>
          </div>
        </div>
      )}

      {systemInfo && (

      {selectedProvider === 'openrouter' && openRouterModels.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              Available OpenRouter Models
            </h2>
          </div>
          <div className="card-body">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {openRouterModels.slice(0, 50).map((model) => (
                <div key={model.name} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-gray-900">{model.name}</p>
                  <p className="text-sm text-gray-500">Context: {model.context_length}K • Capabilities: {model.capabilities.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}