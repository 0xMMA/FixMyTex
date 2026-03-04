package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Service handles loading and saving application settings.
type Service struct {
	filePath string
	current  Settings
}

// NewService creates a new SettingsService, loading existing settings from disk.
func NewService() (*Service, error) {
	configDir, err := os.UserConfigDir()
	if err != nil {
		return nil, err
	}
	dir := filepath.Join(configDir, "FixMyTex")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, err
	}
	svc := &Service{
		filePath: filepath.Join(dir, "settings.json"),
		current:  Default(),
	}
	if err := svc.load(); err != nil && !os.IsNotExist(err) {
		return nil, err
	}
	return svc, nil
}

func (s *Service) load() error {
	data, err := os.ReadFile(s.filePath)
	if err != nil {
		return err
	}
	return json.Unmarshal(data, &s.current)
}

// Get returns a copy of the current settings.
func (s *Service) Get() Settings {
	return s.current
}

// Save persists the provided settings to disk.
func (s *Service) Save(updated Settings) error {
	s.current = updated
	data, err := json.MarshalIndent(updated, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.filePath, data, 0600)
}
