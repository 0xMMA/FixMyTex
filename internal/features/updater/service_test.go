package updater

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func newTestService(version string, srv *httptest.Server) *Service {
	s := NewService(version)
	s.latestJSONURL = srv.URL + "/latest.json"
	return s
}

func serveLatestJSON(t *testing.T, payload LatestJSON) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		if err := json.NewEncoder(w).Encode(payload); err != nil {
			t.Errorf("failed to encode latest.json: %v", err)
		}
	}))
}

func TestCheckForUpdate_UpdateAvailable(t *testing.T) {
	latest := LatestJSON{
		Version: "3.7.0",
		Notes:   "Bug fixes",
		Platforms: map[string]PlatformAsset{
			"linux-x86_64": {URL: "https://example.com/KeyLint-linux"},
		},
	}
	srv := serveLatestJSON(t, latest)
	defer srv.Close()

	svc := newTestService("3.6.0", srv)
	info, err := svc.CheckForUpdate()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !info.IsAvailable {
		t.Errorf("expected update to be available")
	}
	if info.LatestVersion != "3.7.0" {
		t.Errorf("LatestVersion = %q, want %q", info.LatestVersion, "3.7.0")
	}
	if info.CurrentVersion != "3.6.0" {
		t.Errorf("CurrentVersion = %q, want %q", info.CurrentVersion, "3.6.0")
	}
}

func TestCheckForUpdate_AlreadyUpToDate(t *testing.T) {
	latest := LatestJSON{
		Version: "3.6.0",
		Platforms: map[string]PlatformAsset{
			"linux-x86_64": {URL: "https://example.com/KeyLint-linux"},
		},
	}
	srv := serveLatestJSON(t, latest)
	defer srv.Close()

	svc := newTestService("3.6.0", srv)
	info, err := svc.CheckForUpdate()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if info.IsAvailable {
		t.Errorf("expected no update when already up to date")
	}
}

func TestCheckForUpdate_NetworkError(t *testing.T) {
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate server error.
		http.Error(w, "internal server error", http.StatusInternalServerError)
	}))
	defer srv.Close()

	svc := newTestService("3.6.0", srv)
	_, err := svc.CheckForUpdate()
	if err == nil {
		t.Error("expected error for non-200 response, got nil")
	}
}

func TestCheckForUpdate_DevVersionSkipped(t *testing.T) {
	// Serve a valid latest.json, but the dev version should short-circuit.
	latest := LatestJSON{Version: "3.7.0"}
	srv := serveLatestJSON(t, latest)
	defer srv.Close()

	svc := newTestService("dev", srv)
	info, err := svc.CheckForUpdate()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if info.IsAvailable {
		t.Errorf("dev version should never report an update as available")
	}
}

func TestGetVersion(t *testing.T) {
	latest := LatestJSON{Version: "3.6.0"}
	srv := serveLatestJSON(t, latest)
	defer srv.Close()

	svc := newTestService("3.6.0", srv)
	if got := svc.GetVersion(); got != "3.6.0" {
		t.Errorf("GetVersion() = %q, want %q", got, "3.6.0")
	}
}

func TestIsNewer(t *testing.T) {
	cases := []struct {
		latest, current string
		want            bool
	}{
		{"3.7.0", "3.6.0", true},
		{"3.6.1", "3.6.0", true},
		{"4.0.0", "3.9.9", true},
		{"3.6.0", "3.6.0", false},
		{"3.5.0", "3.6.0", false},
		{"v3.7.0", "3.6.0", true},
		{"3.7.0", "v3.6.0", true},
	}
	for _, tc := range cases {
		got := isNewer(tc.latest, tc.current)
		if got != tc.want {
			t.Errorf("isNewer(%q, %q) = %v, want %v", tc.latest, tc.current, got, tc.want)
		}
	}
}
