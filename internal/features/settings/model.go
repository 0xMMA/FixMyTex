package settings

// Provider holds credentials for a single AI provider.
type Provider struct {
	OpenAIKey   string `json:"openai_key"`
	ClaudeKey   string `json:"claude_key"`
	OllamaURL   string `json:"ollama_url"`
	AWSRegion   string `json:"aws_region"`
	AWSKeyID    string `json:"aws_key_id"`
	AWSSecret   string `json:"aws_secret"`
}

// Settings is the top-level application settings structure persisted to disk.
type Settings struct {
	ActiveProvider  string   `json:"active_provider"` // "openai" | "claude" | "ollama" | "bedrock"
	Providers       Provider `json:"providers"`
	ShortcutKey     string   `json:"shortcut_key"`    // e.g. "ctrl+g"
	StartOnBoot     bool     `json:"start_on_boot"`
	ThemePreference string   `json:"theme_preference"` // "light" | "dark" | "system"
	CompletedSetup  bool     `json:"completed_setup"`
}

// Default returns a Settings with sensible defaults.
func Default() Settings {
	return Settings{
		ActiveProvider:  "openai",
		ShortcutKey:     "ctrl+g",
		ThemePreference: "system",
	}
}
