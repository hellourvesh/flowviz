# FlowViz Multi-AI Support Feature Branch

## 🎯 Objective
Add support for both **Anthropic Claude** and **OpenAI ChatGPT** to FlowViz, allowing users to choose their preferred AI provider for attack flow analysis.

## ✅ Completed Work

### 1. Infrastructure Setup
- ✅ **Updated `.env.example`**: Added configuration for both Anthropic and OpenAI
- ✅ **Updated `package.json`**: Added OpenAI SDK dependency (v4.77.0)
- ✅ **Version Bump**: Updated to v2.0.0 to reflect major feature addition

### 2. AI Service Abstraction Layer
- ✅ **Created `ai-service-factory.js`**:
  - Unified interface for multiple AI providers
  - Factory pattern for creating service instances
  - Support for streaming analysis
  - Support for vision analysis
  - Environment-based configuration
  - Provider availability detection

### 3. Documentation
- ✅ **Created `MULTI_AI_IMPLEMENTATION.md`**: Comprehensive implementation guide with:
  - Architecture overview
  - Implementation phases
  - API changes
  - Testing strategy
  - Security considerations
  - Migration guide

## 🚧 Remaining Work

### Phase 2: Server Integration (Critical)
The following files need to be updated:

#### 1. `server.js` - **HIGH PRIORITY**
Current implementation uses direct Anthropic SDK integration. Needs complete refactor to:

**Required Changes**:
```javascript
// Replace direct Anthropic import
// OLD: import Anthropic from '@anthropic-ai/sdk';
// NEW: import { AIServiceFactory } from './ai-service-factory.js';

// Add new endpoint
app.get('/api/providers', (req, res) => {
  // Return available providers
});

// Modify streaming endpoint
app.post('/api/claude-stream', async (req, res) => {
  // Get provider from header: req.headers['x-ai-provider']
  // Create AI service: AIServiceFactory.create(config)
  // Use unified streaming interface
});

// Update vision analysis
app.post('/api/vision-analysis', async (req, res) => {
  // Support both providers
});
```

**Key Sections to Update**:
1. Lines 1-50: Imports and environment setup
2. Lines 100-150: Health check endpoint
3. Lines 300-500: Vision analysis endpoint
4. Lines 500-800: Main streaming endpoint (`/api/claude-stream`)

#### 2. Frontend Components

**`src/features/app/components/SettingsDialog.tsx`**:
```typescript
// Add provider selection
<FormControl>
  <FormLabel>AI Provider</FormLabel>
  <RadioGroup value={aiProvider} onChange={handleProviderChange}>
    <FormControlLabel value="anthropic" control={<Radio />} label="Claude (Anthropic)" />
    <FormControlLabel value="openai" control={<Radio />} label="ChatGPT (OpenAI)" />
  </RadioGroup>
</FormControl>

// Add model selection dropdown
<Select value={selectedModel} onChange={handleModelChange}>
  {provider === 'anthropic' ? (
    <>
      <MenuItem value="claude-sonnet-4-20250514">Claude Sonnet 4</MenuItem>
      <MenuItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</MenuItem>
    </>
  ) : (
    <>
      <MenuItem value="gpt-4o">GPT-4 Omni</MenuItem>
      <MenuItem value="gpt-4-turbo">GPT-4 Turbo</MenuItem>
      <MenuItem value="gpt-3.5-turbo">GPT-3.5 Turbo</MenuItem>
    </>
  )}
</Select>
```

**`src/features/app/hooks/useAppState.ts`**:
```typescript
// Add new state
const [aiProvider, setAiProvider] = useState<'anthropic' | 'openai'>('anthropic');
const [aiModel, setAiModel] = useState<string>('');

// Load from localStorage
useEffect(() => {
  const saved = localStorage.getItem('aiProvider');
  if (saved) setAiProvider(saved);
}, []);

// Save to localStorage
useEffect(() => {
  localStorage.setItem('aiProvider', aiProvider);
}, [aiProvider]);
```

**`src/features/flow-analysis/services/streamingDirectFlowClient.ts`**:
```typescript
// Add provider header to requests
const response = await fetch('/api/claude-stream', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-ai-provider': aiProvider // Pass from settings
  },
  body: JSON.stringify({ ...})
});
```

### Phase 3: UI Enhancements

#### New Component: Provider Indicator
**`src/shared/components/ProviderIndicator.tsx`**:
```typescript
// Display current AI provider in UI
export function ProviderIndicator({ provider }: { provider: 'anthropic' | 'openai' }) {
  const icon = provider === 'anthropic' ? '🤖' : '💬';
  const name = provider === 'anthropic' ? 'Claude' : 'ChatGPT';
  
  return (
    <Chip 
      icon={<span>{icon}</span>}
      label={`Powered by ${name}`}
      size="small"
      sx={{ ... }}
    />
  );
}
```

#### Update AppBar
Add provider indicator next to title or in settings button

### Phase 4: Testing

#### Test Scenarios
1. **Basic Functionality**:
   - [ ] Start with Claude, analyze article
   - [ ] Start with ChatGPT, analyze article
   - [ ] Switch providers mid-session
   - [ ] Restart app, verify provider persists

2. **Error Handling**:
   - [ ] Missing API key for selected provider
   - [ ] Rate limit exceeded
   - [ ] Network errors
   - [ ] Invalid responses

3. **Vision Analysis**:
   - [ ] Image analysis with Claude
   - [ ] Image analysis with ChatGPT
   - [ ] Compare results

4. **Edge Cases**:
   - [ ] Very long articles
   - [ ] Articles with many images
   - [ ] Rapid provider switching
   - [ ] Concurrent requests

## 📝 Implementation Checklist

### Critical Path
- [ ] **Update `server.js`** (Est: 2-3 hours)
  - [ ] Import AIServiceFactory
  - [ ] Add `/api/providers` endpoint
  - [ ] Refactor streaming endpoint
  - [ ] Refactor vision endpoint
  - [ ] Test with both providers

- [ ] **Update Frontend Settings** (Est: 1-2 hours)
  - [ ] Add provider selection UI
  - [ ] Add model selection UI
  - [ ] Implement state management
  - [ ] Add persistence

- [ ] **Update Streaming Client** (Est: 30 min)
  - [ ] Add provider header
  - [ ] Handle provider-specific responses
  - [ ] Update error handling

### Nice to Have
- [ ] Add provider indicator in UI
- [ ] Add provider switch confirmation dialog
- [ ] Add cost estimate per provider
- [ ] Add performance metrics comparison

## 🔧 Development Setup

1. **Clone the branch**:
   ```bash
   git fetch origin
   git checkout feature/multi-ai-support
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Add BOTH API keys:
   ANTHROPIC_API_KEY=sk-ant-...
   OPENAI_API_KEY=sk-...
   AI_PROVIDER=anthropic  # or openai
   ```

4. **Run development server**:
   ```bash
   npm run dev:full
   ```

## 🧪 Testing Instructions

### Manual Testing
```bash
# Test with Claude
AI_PROVIDER=anthropic npm run dev:full

# Test with ChatGPT
AI_PROVIDER=openai npm run dev:full

# Test provider detection
# Remove one API key and verify graceful degradation
```

### API Testing
```bash
# Check available providers
curl http://localhost:3001/api/providers

# Test streaming with Claude
curl -X POST http://localhost:3001/api/claude-stream \
  -H "Content-Type: application/json" \
  -H "x-ai-provider: anthropic" \
  -d '{"text": "Test article about ransomware"}'

# Test streaming with ChatGPT
curl -X POST http://localhost:3001/api/claude-stream \
  -H "Content-Type: application/json" \
  -H "x-ai-provider: openai" \
  -d '{"text": "Test article about ransomware"}'
```

## 📚 Additional Resources

- **Implementation Guide**: See `MULTI_AI_IMPLEMENTATION.md`
- **AI Service Factory**: See `ai-service-factory.js`
- **Anthropic Docs**: https://docs.anthropic.com
- **OpenAI Docs**: https://platform.openai.com/docs

## 🚀 Next Steps

1. Complete server.js refactoring
2. Add frontend settings UI
3. Update streaming client
4. Comprehensive testing
5. Update main README.md
6. Create pull request

## 🤝 Contributing

When continuing this work:
1. Test each change thoroughly
2. Update this README with progress
3. Add comments explaining provider-specific logic
4. Run tests before committing
5. Keep commits atomic and well-described

## 📊 Progress

**Overall**: 30% Complete

- Infrastructure: ✅ 100%
- Server Integration: ⏳ 0%
- Frontend Integration: ⏳ 0%  
- Testing: ⏳ 0%
- Documentation: ✅ 80%

---

**Branch**: `feature/multi-ai-support`
**Target**: `main`
**Status**: 🚧 In Progress
**Last Updated**: 2025-10-18
