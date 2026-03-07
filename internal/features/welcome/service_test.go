package welcome_test

import (
	"os"
	"testing"

	"keylint/internal/features/settings"
	"keylint/internal/features/welcome"
)

func newServices(t *testing.T) (*settings.Service, *welcome.Service) {
	t.Helper()
	tmp := t.TempDir()
	original := os.Getenv("XDG_CONFIG_HOME")
	t.Cleanup(func() { os.Setenv("XDG_CONFIG_HOME", original) })
	os.Setenv("XDG_CONFIG_HOME", tmp)

	svc, err := settings.NewService()
	if err != nil {
		t.Fatalf("settings.NewService: %v", err)
	}
	return svc, welcome.NewService(svc)
}

func TestIsFirstRun_TrueByDefault(t *testing.T) {
	_, wSvc := newServices(t)
	if !wSvc.IsFirstRun() {
		t.Error("expected IsFirstRun=true when CompletedSetup=false")
	}
}

func TestCompleteSetup_SetsFlag(t *testing.T) {
	sSvc, wSvc := newServices(t)

	if err := wSvc.CompleteSetup(); err != nil {
		t.Fatalf("CompleteSetup: %v", err)
	}

	if wSvc.IsFirstRun() {
		t.Error("expected IsFirstRun=false after CompleteSetup()")
	}
	if !sSvc.Get().CompletedSetup {
		t.Error("expected settings.CompletedSetup=true after CompleteSetup()")
	}
}

func TestIsFirstRun_FalseWhenAlreadyCompleted(t *testing.T) {
	sSvc, wSvc := newServices(t)

	// Pre-set via settings directly.
	cfg := sSvc.Get()
	cfg.CompletedSetup = true
	if err := sSvc.Save(cfg); err != nil {
		t.Fatalf("Save: %v", err)
	}

	if wSvc.IsFirstRun() {
		t.Error("expected IsFirstRun=false when CompletedSetup=true")
	}
}

func TestCompleteSetup_IsIdempotent(t *testing.T) {
	_, wSvc := newServices(t)

	if err := wSvc.CompleteSetup(); err != nil {
		t.Fatalf("first CompleteSetup: %v", err)
	}
	if err := wSvc.CompleteSetup(); err != nil {
		t.Fatalf("second CompleteSetup: %v", err)
	}
	if wSvc.IsFirstRun() {
		t.Error("expected IsFirstRun=false after double CompleteSetup()")
	}
}
