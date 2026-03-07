package enhance

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"fixmytex/internal/features/settings"
	"fixmytex/internal/logger"
)

const systemPrompt = "You are a professional text editor. Fix grammar, spelling, and improve clarity. Return only the improved text."

// Service calls AI provider APIs from Go so the Wails WebView does not need
// external network access (avoids WebKit content-security-policy issues on Linux).
type Service struct {
	settings *settings.Service
	client   *http.Client
}

// NewService creates an EnhanceService backed by the given settings.
func NewService(s *settings.Service) *Service {
	return &Service{settings: s, client: &http.Client{}}
}

// Enhance sends text to the configured AI provider and returns the improved version.
func (s *Service) Enhance(text string) (result string, err error) {
	cfg := s.settings.Get()
	logger.Info("enhance: start", "provider", cfg.ActiveProvider, "input_len", len(text))
	defer func() {
		if err != nil {
			logger.Error("enhance: failed", "provider", cfg.ActiveProvider, "err", err)
		} else {
			logger.Info("enhance: done", "provider", cfg.ActiveProvider, "output_len", len(result))
		}
	}()
	switch cfg.ActiveProvider {
	case "openai":
		key := s.settings.GetKey("openai")
		if key == "" {
			return "", fmt.Errorf("OpenAI API key is not configured. Go to Settings → AI Providers to add it")
		}
		return callOpenAI(s.client, text, key)
	case "claude":
		key := s.settings.GetKey("claude")
		if key == "" {
			return "", fmt.Errorf("Anthropic API key is not configured. Go to Settings → AI Providers → Anthropic API Key, and make sure 'Anthropic Claude' is selected as the Active Provider")
		}
		return callClaude(s.client, text, key)
	case "ollama":
		return callOllama(s.client, text, cfg.Providers.OllamaURL)
	case "bedrock":
		return "", fmt.Errorf("AWS Bedrock is not yet supported. Please select a different provider")
	default:
		return "", fmt.Errorf("unknown provider: %q", cfg.ActiveProvider)
	}
}

func callOpenAI(client *http.Client, text, apiKey string) (string, error) {
	type msg struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}
	payload, _ := json.Marshal(map[string]any{
		"model": "gpt-4o-mini",
		"messages": []msg{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: text},
		},
	})
	req, _ := http.NewRequest(http.MethodPost, "https://api.openai.com/v1/chat/completions", bytes.NewReader(payload))
	req.Header.Set("Authorization", "Bearer "+apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("OpenAI request failed: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("OpenAI error %d: %s", resp.StatusCode, body)
	}
	var result struct {
		Choices []struct {
			Message struct{ Content string } `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(body, &result); err != nil || len(result.Choices) == 0 {
		return "", fmt.Errorf("OpenAI unexpected response: %s", body)
	}
	return result.Choices[0].Message.Content, nil
}

func callClaude(client *http.Client, text, apiKey string) (string, error) {
	payload, _ := json.Marshal(map[string]any{
		"model":      "claude-haiku-4-5-20251001",
		"max_tokens": 2048,
		"system":     systemPrompt,
		"messages":   []map[string]string{{"role": "user", "content": text}},
	})
	req, _ := http.NewRequest(http.MethodPost, "https://api.anthropic.com/v1/messages", bytes.NewReader(payload))
	req.Header.Set("x-api-key", apiKey)
	req.Header.Set("anthropic-version", "2023-06-01")
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Anthropic request failed: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Claude error %d: %s", resp.StatusCode, body)
	}
	var result struct {
		Content []struct{ Text string } `json:"content"`
	}
	if err := json.Unmarshal(body, &result); err != nil || len(result.Content) == 0 {
		return "", fmt.Errorf("Claude unexpected response: %s", body)
	}
	return result.Content[0].Text, nil
}

func callOllama(client *http.Client, text, baseURL string) (string, error) {
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}
	payload, _ := json.Marshal(map[string]any{
		"model":  "llama3.2",
		"prompt": systemPrompt + "\n\nText: " + text,
		"stream": false,
	})
	req, _ := http.NewRequest(http.MethodPost, baseURL+"/api/generate", bytes.NewReader(payload))
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Ollama request failed: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Ollama error %d: %s", resp.StatusCode, body)
	}
	var result struct {
		Response string `json:"response"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return "", fmt.Errorf("Ollama unexpected response: %s", body)
	}
	return result.Response, nil
}
