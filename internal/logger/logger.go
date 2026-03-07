// Package logger provides a thin wrapper around log/slog.
// It is disabled by default (all output discarded) and must be explicitly
// enabled via Init — typically driven by the DebugLogging settings field.
package logger

import (
	"io"
	"log/slog"
	"os"
	"path/filepath"
)

var (
	l               = slog.New(slog.NewTextHandler(io.Discard, nil))
	logFile         *os.File
	sensitiveEnabled bool
)

// Init enables or disables file logging. When enabled, output goes to
// %AppData%/KeyLint/debug.log (Windows) or $HOME/.config/KeyLint/debug.log (Linux).
// sensitive controls whether Sensitive() calls are written to the log.
// Safe to call only once at startup; not goroutine-safe with concurrent log calls.
func Init(enabled, sensitive bool) {
	sensitiveEnabled = sensitive
	if logFile != nil {
		_ = logFile.Close()
		logFile = nil
	}
	if !enabled {
		l = slog.New(slog.NewTextHandler(io.Discard, nil))
		return
	}
	dir, err := os.UserConfigDir()
	if err != nil {
		return
	}
	dir = filepath.Join(dir, "KeyLint")
	_ = os.MkdirAll(dir, 0700)
	logPath := filepath.Join(dir, "debug.log")
	f, err := os.OpenFile(logPath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0600)
	if err != nil {
		return
	}
	logFile = f
	l = slog.New(slog.NewTextHandler(f, &slog.HandlerOptions{Level: slog.LevelDebug}))
	l.Info("logger initialized", "path", logPath, "sensitive", sensitive)
}

func Info(msg string, args ...any)  { l.Info(msg, args...) }
func Debug(msg string, args ...any) { l.Debug(msg, args...) }
func Warn(msg string, args ...any)  { l.Warn(msg, args...) }
func Error(msg string, args ...any) { l.Error(msg, args...) }

// Sensitive logs only when sensitive logging is enabled. Use for request/response bodies.
func Sensitive(msg string, args ...any) {
	if sensitiveEnabled {
		l.Debug(msg, args...)
	}
}
