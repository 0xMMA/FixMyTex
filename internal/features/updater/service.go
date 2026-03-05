package updater

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"runtime"
	"strings"

	"github.com/minio/selfupdate"
)

const defaultLatestJSONURL = "https://github.com/0xMMA/FixMyTex/releases/latest/download/latest.json"

// Service checks for updates and can apply them in-place using minio/selfupdate.
type Service struct {
	currentVersion string
	latestJSONURL  string
	client         *http.Client
}

// NewService creates an updater Service with the given current version string.
// The version is typically injected at build time via -ldflags "-X main.AppVersion=x.y.z".
func NewService(version string) *Service {
	return &Service{
		currentVersion: version,
		latestJSONURL:  defaultLatestJSONURL,
		client:         &http.Client{},
	}
}

// GetVersion returns the current application version.
func (s *Service) GetVersion() string {
	return s.currentVersion
}

// CheckForUpdate fetches latest.json and compares its version against the running binary.
// Returns an UpdateInfo describing whether an update is available.
func (s *Service) CheckForUpdate() (UpdateInfo, error) {
	info := UpdateInfo{CurrentVersion: s.currentVersion}

	// Skip update check for dev builds.
	if s.currentVersion == "dev" || s.currentVersion == "" {
		return info, nil
	}

	resp, err := s.client.Get(s.latestJSONURL)
	if err != nil {
		return info, fmt.Errorf("fetching latest.json: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return info, fmt.Errorf("latest.json returned status %d", resp.StatusCode)
	}

	var latest LatestJSON
	if err := json.NewDecoder(resp.Body).Decode(&latest); err != nil {
		return info, fmt.Errorf("parsing latest.json: %w", err)
	}

	info.LatestVersion = latest.Version
	info.Notes = latest.Notes

	key := platformKey()
	if asset, ok := latest.Platforms[key]; ok {
		info.ReleaseURL = asset.URL
	}

	info.IsAvailable = isNewer(latest.Version, s.currentVersion)
	return info, nil
}

// DownloadAndInstall fetches the binary for the current platform and replaces the running exe.
func (s *Service) DownloadAndInstall() error {
	updateInfo, err := s.CheckForUpdate()
	if err != nil {
		return fmt.Errorf("checking for update: %w", err)
	}
	if !updateInfo.IsAvailable {
		return fmt.Errorf("no update available")
	}
	if updateInfo.ReleaseURL == "" {
		return fmt.Errorf("no download URL for platform %s", platformKey())
	}

	resp, err := s.client.Get(updateInfo.ReleaseURL)
	if err != nil {
		return fmt.Errorf("downloading update: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download returned status %d", resp.StatusCode)
	}

	if err := selfupdate.Apply(resp.Body, selfupdate.Options{}); err != nil {
		return fmt.Errorf("applying update: %w", err)
	}

	// Restart the process so the new binary takes effect immediately.
	executable, err := os.Executable()
	if err != nil {
		return fmt.Errorf("finding executable path: %w", err)
	}
	_ = executable // exec.Command would be used here for a restart; omitted for simplicity.
	return nil
}

// platformKey returns the latest.json platforms map key for the current OS/arch.
func platformKey() string {
	var osName string
	switch runtime.GOOS {
	case "windows":
		osName = "windows"
	case "darwin":
		osName = "darwin"
	default:
		osName = "linux"
	}
	var arch string
	switch runtime.GOARCH {
	case "arm64":
		arch = "aarch64"
	default:
		arch = "x86_64"
	}
	return osName + "-" + arch
}

// isNewer returns true when latestVer is strictly newer than currentVer.
// Both versions may have a leading 'v' prefix.
func isNewer(latestVer, currentVer string) bool {
	l := strings.TrimPrefix(latestVer, "v")
	c := strings.TrimPrefix(currentVer, "v")
	lp := strings.Split(l, ".")
	cp := strings.Split(c, ".")
	// Pad shorter slice.
	for len(lp) < 3 {
		lp = append(lp, "0")
	}
	for len(cp) < 3 {
		cp = append(cp, "0")
	}
	for i := range 3 {
		lv := parseIntSafe(lp[i])
		cv := parseIntSafe(cp[i])
		if lv > cv {
			return true
		}
		if lv < cv {
			return false
		}
	}
	return false
}

func parseIntSafe(s string) int {
	n := 0
	for _, ch := range s {
		if ch < '0' || ch > '9' {
			break
		}
		n = n*10 + int(ch-'0')
	}
	return n
}

