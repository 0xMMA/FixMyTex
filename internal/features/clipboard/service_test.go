package clipboard_test

import (
	"os/exec"
	"testing"

	"fixmytex/internal/features/clipboard"
)

func hasXclip() bool {
	_, err := exec.LookPath("xclip")
	return err == nil
}

func hasXsel() bool {
	_, err := exec.LookPath("xsel")
	return err == nil
}

func TestNewService_CreatesService(t *testing.T) {
	svc := clipboard.NewService()
	if svc == nil {
		t.Fatal("expected non-nil service")
	}
}

func TestWrite_And_Read_RoundTrip(t *testing.T) {
	if !hasXclip() && !hasXsel() {
		t.Skip("xclip and xsel not available, skipping clipboard round-trip test")
	}

	svc := clipboard.NewService()
	const text = "hello FixMyTex test"

	if err := svc.Write(text); err != nil {
		t.Fatalf("Write: %v", err)
	}

	got, err := svc.Read()
	if err != nil {
		t.Fatalf("Read: %v", err)
	}
	if got != text {
		t.Errorf("Read: got %q, want %q", got, text)
	}
}

func TestRead_ReturnsError_WhenNoClipboardTool(t *testing.T) {
	if hasXclip() || hasXsel() {
		t.Skip("clipboard tool present, skipping error path test")
	}

	svc := clipboard.NewService()
	_, err := svc.Read()
	if err == nil {
		t.Error("expected error when no clipboard tool is available")
	}
}
