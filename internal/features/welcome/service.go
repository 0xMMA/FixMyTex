package welcome

import "keylint/internal/features/settings"

// Service handles first-run detection and setup completion.
type Service struct {
	settings *settings.Service
}

// NewService creates a new WelcomeService.
func NewService(s *settings.Service) *Service {
	return &Service{settings: s}
}

// IsFirstRun returns true if the user has not completed the setup wizard.
func (s *Service) IsFirstRun() bool {
	return !s.settings.Get().CompletedSetup
}

// CompleteSetup marks the setup wizard as done.
func (s *Service) CompleteSetup() error {
	cfg := s.settings.Get()
	cfg.CompletedSetup = true
	return s.settings.Save(cfg)
}
