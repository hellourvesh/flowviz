# Multi-AI Support Implementation Guide

## Overview
This document outlines the comprehensive implementation of multi-AI provider support for FlowViz, enabling seamless switching between Anthropic Claude and OpenAI ChatGPT.

## Architecture Changes

### 1. AI Service Abstraction Layer (`ai-service-factory.js`)
- **Purpose**: Unified interface for multiple AI providers
- **Features**:
  - Factory pattern for creating AI service instances
  - Common interface for streaming and vision analysis
  - Environment-based configuration
  - Automatic provider detection

### 2. Server Updates (`server.js`)
Key changes required:
- Import `AIServiceFactory` instead of direct Anthropic SDK
- Add `/api/providers` endpoint to list available providers
- Modify `/api/claude-stream` to support provider selection via header
- Update vision analysis to support both providers
- Add provider-specific error handling

### 3. Frontend Updates

#### Settings Dialog (`src/features/app/components/SettingsDialog.tsx`)
Add AI provider selection:
```typescript
- Radio buttons for Claude vs ChatGPT
- Model selection dropdown (provider-specific models)
- Display current provider and model info
- Save preferences to localStorage
```

#### App State (`src/features/app/hooks/useAppState.ts`)
Add state management for:
```typescript
- selectedProvider: 'anthropic' | 'openai'
- selectedModel: string
- Load from localStorage on mount
- Persist changes
```

#### Streaming Client (`src/features/flow-analysis/services/streamingDirectFlowClient.ts`)
Update to:
```typescript
- Include x-ai-provider header in requests
- Handle provider-specific response formats
- Unified error handling for both providers
```

## Implementation Steps

### Phase 1: Core Infrastructure ✅
- [x] Create `.env.example` with multi-AI configuration
- [x] Update `package.json` with OpenAI SDK
- [x] Create `ai-service-factory.js` abstraction layer

### Phase 2: Server Integration (IN PROGRESS)
- [ ] Update `server.js` with AIServiceFactory
- [ ] Add `/api/providers` endpoint
- [ ] Modify streaming endpoint for provider selection
- [ ] Update vision analysis endpoint
- [ ] Add provider-specific error handling

### Phase 3: Frontend Integration
- [ ] Add provider selection to settings
- [ ] Update app state management
- [ ] Modify streaming client
- [ ] Add provider-specific UI indicators
- [ ] Update documentation

### Phase 4: Testing & Polish
- [ ] Test with Anthropic Claude
- [ ] Test with OpenAI ChatGPT
- [ ] Test provider switching
- [ ] Test error scenarios
- [ ] Update README with multi-AI instructions

## Configuration

### Environment Variables
```bash
# Choose default provider
AI_PROVIDER=anthropic  # or 'openai'

# Anthropic Configuration
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-20250514

# OpenAI Configuration  
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
```

### User Experience
1. User opens settings
2. Selects preferred AI provider (Claude or ChatGPT)
3. Optionally selects specific model
4. Settings persist across sessions
5. Current provider shown in UI
6. Seamless switching without data loss

## API Changes

### New Endpoint: GET /api/providers
```json
{
  "available": ["anthropic", "openai"],
  "default": "anthropic",
  "configured": {
    "anthropic": true,
    "openai": true
  }
}
```

### Modified Endpoint: POST /api/claude-stream
Now accepts header:
```
x-ai-provider: anthropic|openai
```

## Provider-Specific Handling

### Streaming Differences
**Claude (Anthropic)**:
- Uses SSE with `content_block_delta` events
- Text in `event.delta.text`

**ChatGPT (OpenAI)**:
- Uses SSE with `data: [DONE]` termination
- Text in `choices[0].delta.content`

### Vision API Differences
**Claude**:
```javascript
{
  type: 'image',
  source: {
    type: 'base64',
    media_type: 'image/jpeg',
    data: base64String
  }
}
```

**ChatGPT**:
```javascript
{
  type: 'image_url',
  image_url: {
    url: `data:image/jpeg;base64,${base64String}`
  }
}
```

## Error Handling

### Provider-Specific Errors
- **Anthropic**: Rate limits, authentication, model errors
- **OpenAI**: Token limits, content policy, availability

### Unified Error Messages
All errors normalized to:
```typescript
{
  type: 'error',
  provider: 'anthropic' | 'openai',
  error: string,
  recoverable: boolean,
  suggestedAction?: string
}
```

## Testing Strategy

### Unit Tests
- AI service factory creation
- Provider detection
- Configuration parsing

### Integration Tests  
- Full flow with Claude
- Full flow with ChatGPT
- Provider switching mid-session
- Error recovery

### Manual Testing Checklist
- [ ] Article analysis with Claude
- [ ] Article analysis with ChatGPT
- [ ] Vision analysis with both providers
- [ ] Switch providers and re-analyze
- [ ] Handle missing API keys gracefully
- [ ] Rate limit handling
- [ ] Network error recovery

## Documentation Updates

### README.md
- Multi-AI support overview
- Setup instructions for both providers
- Model recommendations
- Cost comparison
- Troubleshooting

### User Guide
- How to switch providers
- When to use Claude vs ChatGPT
- Model selection guidance
- Performance tips

## Performance Considerations

### Model Selection
**Claude Sonnet 4**:
- Best for complex analysis
- Larger context window (200k tokens)
- Slower but more accurate

**GPT-4o**:
- Faster response times
- Good for quick analysis
- Better for shorter articles

### Cost Optimization
- Default to faster/cheaper models
- Option to use premium models
- Token usage tracking
- Rate limiting per provider

## Security Considerations

- API keys never exposed to client
- Server-side provider selection validation
- Rate limiting per provider
- Input sanitization for both APIs
- SSRF protection maintained

## Migration Guide

### For Existing Users
1. Update `.env` file with new format
2. Add OpenAI API key (optional)
3. Restart server
4. Previous analyses remain compatible
5. Default behavior unchanged

### For New Users
1. Choose preferred provider
2. Add corresponding API key
3. Configure via settings UI
4. Start analyzing

## Future Enhancements

- Support for additional providers (Azure OpenAI, AWS Bedrock)
- Automatic fallback to secondary provider
- A/B testing between providers
- Cost tracking and budgeting
- Provider-specific optimizations
- Parallel analysis with multiple providers

## Appendix

### Complete File Structure
```
flowviz/
├── ai-service-factory.js         (NEW - AI abstraction layer)
├── server.js                      (MODIFIED - Multi-AI support)
├── .env.example                   (MODIFIED - Both providers)
├── package.json                   (MODIFIED - OpenAI SDK added)
├── README.md                      (TO UPDATE - Multi-AI docs)
└── src/
    ├── features/
    │   ├── app/
    │   │   ├── components/
    │   │   │   └── SettingsDialog.tsx  (TO MODIFY - Provider selection)
    │   │   └── hooks/
    │   │       └── useAppState.ts      (TO MODIFY - Provider state)
    │   └── flow-analysis/
    │       └── services/
    │           └── streamingDirectFlowClient.ts  (TO MODIFY - Provider header)
    └── shared/
        └── components/
            └── ProviderIndicator.tsx    (NEW - Show active provider)
```

### Dependencies Added
```json
{
  "dependencies": {
    "openai": "^4.77.0"
  }
}
```

### Environment Variables Reference
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| AI_PROVIDER | No | anthropic | Default provider |
| ANTHROPIC_API_KEY | Conditional | - | Claude API key |
| ANTHROPIC_MODEL | No | claude-sonnet-4-20250514 | Claude model |
| OPENAI_API_KEY | Conditional | - | ChatGPT API key |
| OPENAI_MODEL | No | gpt-4o | ChatGPT model |

**Note**: At least ONE provider's API key must be configured.

---

**Status**: Phase 1 Complete, Phase 2 In Progress
**Last Updated**: 2025-10-18
**Version**: 2.0.0
