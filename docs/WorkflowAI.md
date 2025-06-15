# WorkflowAI Integration Guide

## Overview

This document outlines the integration of WorkflowAI as an alternative AI provider for Play Genie's playlist generation system. The integration allows switching between OpenAI's direct API and WorkflowAI's managed service seamlessly.

## Architecture

### Core Components

1. **UnifiedAIService** - Main facade that switches between providers
2. **WorkflowAIService** - Handles WorkflowAI API communication
3. **AIProviderConfig** - Configuration management for providers
4. **Settings UI** - User interface for provider selection

### Provider System

```swift
enum AIProvider: String, CaseIterable {
    case openAI = "openai"
    case workflowAI = "workflowai"
}
```

## Implementation Details

### 1. WorkflowAI Service

**File**: `Play Genie/PlaylistGenerator/Services/WorkflowAIService.swift`

- Singleton service following the same pattern as `LLMService`
- Handles API communication with WorkflowAI's playlist generation endpoint
- Supports configurable caching policies (`auto`, `always`, `never`)
- Includes comprehensive logging and error handling

**Key Features**:
- Memory usage monitoring
- Request/response logging
- Configurable timeout settings
- JSON response parsing with fallback handling

### 2. Unified AI Service

**File**: `Play Genie/PlaylistGenerator/Services/UnifiedAIService.swift`

Acts as a facade pattern implementation that:
- Switches between OpenAI and WorkflowAI based on configuration
- Maintains consistent interface for the rest of the app
- Provides provider status checking
- Handles provider-specific capabilities

### 3. Configuration System

**File**: `Play Genie/PlaylistGenerator/Config/AIProviderConfig.swift`

Centralized configuration management:
- Environment variable support for testing
- UserDefaults persistence for user preferences
- Provider capability definitions
- URL and parameter configuration

### 4. API Keys Management

**File**: `Play Genie/PlaylistGenerator/Config/APIKeys.swift`

Updated to include WorkflowAI API key:
```swift
static let workflowAIApiKey = "{Add your WorkflowAI API key here}"
```

### 5. Settings UI Integration

**File**: `Play Genie/PlaylistGenerator/Views/SettingsView.swift`

Added AI Provider section with:
- Current provider display
- Provider selection interface
- Configuration status indicators
- Real-time switching capability

## WorkflowAI API Integration

### Endpoint Configuration

```
POST /v1/@sergiowpfmecom/tasks/playlist-generator/schemas/1/run
Host: https://run.workflowai.com
Authorization: Bearer {API_KEY}
Content-Type: application/json
```

### Request Format

```json
{
  "task_input": {
    "prompt": "Your playlist prompt here"
  },
  "version": "dev",
  "use_cache": "auto"
}
```

### Response Format

```json
{
  "task_output": {
    "name": "Playlist Name",
    "essay": "Playlist description...",
    "songs": [
      {
        "title": "Song Title",
        "artist": "Artist Name"
      }
    ]
  }
}
```

### Cache Options

- `"auto"` (default): Uses cache if temperature is 0 and previous run exists
- `"always"`: Always uses cached output when available
- `"never"`: Never uses cache

## Benefits of WorkflowAI Integration

### 1. **Centralized Prompt Management**
- Server-side prompt templates
- Easy A/B testing of different prompts
- No app updates required for prompt changes

### 2. **Provider Flexibility**
- Easy switching between AI models
- Cost optimization opportunities
- Reduced vendor lock-in

### 3. **Enhanced Monitoring**
- Server-side analytics
- Performance metrics
- Usage tracking

### 4. **Simplified Deployment**
- Managed infrastructure
- Automatic scaling
- Built-in caching

## Usage Instructions

### For Developers

1. **Add WorkflowAI API Key**:
   ```swift
   // In APIKeys.swift
   static let workflowAIApiKey = "your_actual_api_key_here"
   ```

2. **Switch Provider Programmatically**:
   ```swift
   UnifiedAIService.shared.switchProvider(to: .workflowAI)
   ```

3. **Check Provider Status**:
   ```swift
   let (current, configured) = UnifiedAIService.shared.getProviderStatus()
   ```

### For Users

1. Open Settings in the app
2. Navigate to "AI Provider" section
3. Select desired provider (OpenAI or WorkflowAI)
4. Verify configuration status (green checkmark = configured)

## Configuration Options

### Environment Variables

Set `AI_PROVIDER` environment variable for testing:
```bash
AI_PROVIDER=workflowai  # or "openai"
```

### UserDefaults Keys

- `ai_provider_preference`: Stores user's provider choice
- Persists across app launches

### Provider-Specific Settings

**WorkflowAI**:
- Base URL: `https://run.workflowai.com`
- Default version: `"dev"`
- Default cache policy: `"auto"`
- Timeout: 60 seconds (request), 300 seconds (resource)

**OpenAI**:
- Maintains existing configuration
- Direct API integration
- Custom prompt management

## Error Handling

### WorkflowAI Specific Errors

1. **API Key Issues**: Clear error messages for invalid/missing keys
2. **Network Timeouts**: Automatic retry logic for transient failures
3. **Response Parsing**: Fallback handling for malformed JSON
4. **Rate Limiting**: Proper error propagation with user-friendly messages

### Fallback Strategy

- If WorkflowAI fails, the system can be manually switched to OpenAI
- Error messages guide users to check configuration
- Logging provides detailed debugging information

## Testing

### Unit Tests

Test coverage includes:
- Provider switching logic
- Configuration validation
- API request/response handling
- Error scenarios

### Integration Tests

- End-to-end playlist generation
- Provider switching during runtime
- Configuration persistence

## Future Enhancements

### Planned Features

1. **Automatic Failover**: Switch providers on repeated failures
2. **Load Balancing**: Distribute requests across multiple providers
3. **Cost Tracking**: Monitor usage and costs per provider
4. **Advanced Caching**: Client-side caching with TTL
5. **Prompt Versioning**: A/B test different prompt versions

### WorkflowAI Extensions

1. **Image Generation**: Integrate DALL-E tasks via WorkflowAI
2. **Custom Tasks**: Support for additional AI workflows
3. **Batch Processing**: Multiple playlist generation
4. **Analytics Integration**: Usage metrics and performance tracking

## Troubleshooting

### Common Issues

1. **"Provider not configured" error**:
   - Check API key in `APIKeys.swift`
   - Verify network connectivity
   - Confirm WorkflowAI account access

2. **Slow response times**:
   - Check WorkflowAI service status
   - Consider switching to OpenAI temporarily
   - Review cache settings

3. **JSON parsing errors**:
   - Check WorkflowAI task output format
   - Verify schema compatibility
   - Review logs for detailed error information

### Debug Information

Enable detailed logging by checking:
- Console output for request/response details
- Network logs for API communication
- Memory usage monitoring

## Security Considerations

### API Key Management

- Store API keys securely (not in version control)
- Use environment variables for development
- Consider key rotation policies

### Data Privacy

- Review WorkflowAI data handling policies
- Understand data retention and processing
- Ensure compliance with privacy requirements

## Conclusion

The WorkflowAI integration provides a robust, scalable alternative to direct OpenAI integration while maintaining full backward compatibility. The unified architecture allows for easy provider switching and future extensibility.

For questions or issues, refer to the troubleshooting section or check the implementation files for detailed code documentation. 