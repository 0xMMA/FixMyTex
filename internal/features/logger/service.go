// Package logger exposes a Wails-registered service so the Angular frontend
// can forward log messages into the Go debug.log file.
package logger

import "keylint/internal/logger"

// Service forwards frontend log messages into the Go structured logger.
type Service struct{}

// NewService creates a new LogService.
func NewService() *Service { return &Service{} }

// Log writes a frontend message at the given level into debug.log.
func (s *Service) Log(level, msg string) {
	switch level {
	case "debug":
		logger.Debug("frontend: " + msg)
	case "warn":
		logger.Warn("frontend: " + msg)
	case "error":
		logger.Error("frontend: " + msg)
	default:
		logger.Info("frontend: " + msg)
	}
}
