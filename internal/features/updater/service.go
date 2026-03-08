package updater

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"runtime"
	"strconv"
	"strings"

	"keylint/internal/features/settings"

	"github.com/minio/selfupdate"
)

const defaultReleasesAPIURL = "https://api.github.com/repos/0xMMA/KeyLint/releases?per_page=20"

// Service checks for updates and can apply them in-place using minio/selfupdate.
type Service struct {
	currentVersion  string
	releasesAPIURL  string
	client          *http.Client
	settingsSvc     *settings.Service
}

// NewService creates an updater Service with the given current version string.
// The version is typically injected at build time via -ldflags "-X main.AppVersion=x.y.z".
func NewService(version string, settingsSvc *settings.Service) *Service {
	return &Service{
		currentVersion:  version,
		releasesAPIURL:  defaultReleasesAPIURL,
		client:          &http.Client{},
		settingsSvc:     settingsSvc,
	}
}

// GetVersion returns the current application version.
func (s *Service) GetVersion() string {
	return s.currentVersion
}

// CheckForUpdate fetches the GitHub Releases API and finds the best available update.
func (s *Service) CheckForUpdate() (UpdateInfo, error) {
	info := UpdateInfo{CurrentVersion: s.currentVersion}

	// Skip update check for dev builds.
	if s.currentVersion == "dev" || s.currentVersion == "" {
		return info, nil
	}

	// Resolve effective channel from settings.
	channel := s.resolveChannel()
	info.Channel = channel

	req, err := http.NewRequest("GET", s.releasesAPIURL, nil)
	if err != nil {
		return info, fmt.Errorf("creating request: %w", err)
	}
	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "KeyLint")

	resp, err := s.client.Do(req)
	if err != nil {
		return info, fmt.Errorf("fetching releases: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return info, fmt.Errorf("releases API returned status %d", resp.StatusCode)
	}

	var releases []githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&releases); err != nil {
		return info, fmt.Errorf("parsing releases: %w", err)
	}

	// Find the highest-versioned candidate.
	var best *githubRelease
	for i := range releases {
		r := &releases[i]
		if r.Draft {
			continue
		}
		if channel == "stable" && r.Prerelease {
			continue
		}
		if best == nil || isNewer(r.TagName, best.TagName) {
			best = r
		}
	}

	if best == nil {
		return info, nil
	}

	info.LatestVersion = strings.TrimPrefix(best.TagName, "v")
	info.Notes = best.Body

	// Match platform asset by filename substring.
	info.ReleaseURL = matchPlatformAsset(best.Assets)

	info.IsAvailable = isNewer(best.TagName, s.currentVersion)
	return info, nil
}

// resolveChannel determines the effective update channel.
func (s *Service) resolveChannel() string {
	if s.settingsSvc != nil {
		cfg := s.settingsSvc.Get()
		if cfg.UpdateChannel == "stable" || cfg.UpdateChannel == "pre-release" {
			return cfg.UpdateChannel
		}
	}
	// Auto-detect from current version.
	pv := parseVersion(s.currentVersion)
	if pv.preType < 3 {
		return "pre-release"
	}
	return "stable"
}

// matchPlatformAsset finds the download URL for the current platform from a list of assets.
func matchPlatformAsset(assets []githubAsset) string {
	var substring string
	switch runtime.GOOS {
	case "windows":
		substring = "windows-amd64-setup"
	default:
		substring = "linux-amd64"
	}
	if runtime.GOARCH == "arm64" {
		substring = strings.Replace(substring, "amd64", "arm64", 1)
	}

	for _, a := range assets {
		if strings.Contains(a.Name, substring) {
			return a.BrowserDownloadURL
		}
	}
	return ""
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
		return fmt.Errorf("no download URL for current platform")
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

// parsedVersion holds the decomposed parts of a semver string with optional pre-release suffix.
type parsedVersion struct {
	major   int
	minor   int
	patch   int
	preType int // 0=alpha, 1=beta, 2=rc, 3=stable (no suffix)
	preNum  int // trailing number from suffix (e.g. rc2 → 2, alpha → 0)
}

// parseVersion parses a version string like "4.1.8-alpha", "v4.1.8-rc2", "4.1.8".
func parseVersion(s string) parsedVersion {
	s = strings.TrimPrefix(s, "v")

	var pv parsedVersion
	pv.preType = 3 // stable by default

	// Split off pre-release suffix at first hyphen.
	base := s
	suffix := ""
	if idx := strings.IndexByte(s, '-'); idx >= 0 {
		base = s[:idx]
		suffix = s[idx+1:]
	}

	// Parse major.minor.patch
	parts := strings.Split(base, ".")
	if len(parts) >= 1 {
		pv.major, _ = strconv.Atoi(parts[0])
	}
	if len(parts) >= 2 {
		pv.minor, _ = strconv.Atoi(parts[1])
	}
	if len(parts) >= 3 {
		pv.patch, _ = strconv.Atoi(parts[2])
	}

	// Parse pre-release suffix.
	if suffix != "" {
		lower := strings.ToLower(suffix)
		switch {
		case strings.HasPrefix(lower, "alpha"):
			pv.preType = 0
			pv.preNum = parseTrailingInt(lower[5:])
		case strings.HasPrefix(lower, "beta"):
			pv.preType = 1
			pv.preNum = parseTrailingInt(lower[4:])
		case strings.HasPrefix(lower, "rc"):
			pv.preType = 2
			pv.preNum = parseTrailingInt(lower[2:])
		default:
			// Unknown suffix — treat as pre-release with lowest priority.
			pv.preType = 0
			pv.preNum = 0
		}
	}

	return pv
}

// parseTrailingInt extracts a number from a string like "2" or "" (returns 0 for empty).
func parseTrailingInt(s string) int {
	if s == "" {
		return 0
	}
	n, _ := strconv.Atoi(s)
	return n
}

// isNewer returns true when latestVer is strictly newer than currentVer.
// Both versions may have a leading 'v' prefix and optional pre-release suffixes.
func isNewer(latestVer, currentVer string) bool {
	l := parseVersion(latestVer)
	c := parseVersion(currentVer)

	if l.major != c.major {
		return l.major > c.major
	}
	if l.minor != c.minor {
		return l.minor > c.minor
	}
	if l.patch != c.patch {
		return l.patch > c.patch
	}
	if l.preType != c.preType {
		return l.preType > c.preType
	}
	return l.preNum > c.preNum
}
