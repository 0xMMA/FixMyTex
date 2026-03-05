package updater

// UpdateInfo is returned to the frontend to describe whether an update is available.
type UpdateInfo struct {
	IsAvailable    bool   `json:"is_available"`
	LatestVersion  string `json:"latest_version"`
	CurrentVersion string `json:"current_version"`
	ReleaseURL     string `json:"release_url"`
	Notes          string `json:"notes"`
}

// LatestJSON mirrors the structure of the latest.json file published with each release.
type LatestJSON struct {
	Version   string                   `json:"version"`
	Notes     string                   `json:"notes"`
	PubDate   string                   `json:"pub_date"`
	Platforms map[string]PlatformAsset `json:"platforms"`
}

// PlatformAsset holds the download URL and optional signature for a single platform binary.
type PlatformAsset struct {
	URL       string `json:"url"`
	Signature string `json:"signature"`
}
