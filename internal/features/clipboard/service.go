//go:build !windows

package clipboard

import (
	"fmt"
	"os/exec"
	"strings"
)

// Service reads from and writes to the system clipboard.
// Uses xclip/xdotool on Linux, native Win32 via Go on Windows.
type Service struct{}

// NewService creates a new ClipboardService.
func NewService() *Service { return &Service{} }

// Read returns the current clipboard text content.
func (s *Service) Read() (string, error) {
	out, err := exec.Command("xclip", "-selection", "clipboard", "-o").Output()
	if err != nil {
		// Fallback: xsel
		out, err = exec.Command("xsel", "--clipboard", "--output").Output()
		if err != nil {
			return "", fmt.Errorf("clipboard read failed: %w", err)
		}
	}
	return strings.TrimRight(string(out), "\n"), nil
}

// Write sets the clipboard text content.
func (s *Service) Write(text string) error {
	cmd := exec.Command("xclip", "-selection", "clipboard")
	cmd.Stdin = strings.NewReader(text)
	if err := cmd.Run(); err != nil {
		// Fallback: xsel
		cmd = exec.Command("xsel", "--clipboard", "--input")
		cmd.Stdin = strings.NewReader(text)
		return cmd.Run()
	}
	return nil
}
