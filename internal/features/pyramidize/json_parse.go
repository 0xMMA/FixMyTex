package pyramidize

import (
	"encoding/json"
	"strings"
)

// stripFences removes ```json``` and ``` code fences from a string and trims surrounding whitespace.
// Many LLMs wrap their JSON output in markdown code fences despite being instructed not to.
func stripFences(s string) string {
	s = strings.TrimSpace(s)

	// Remove opening fence variants: ```json, ```JSON, ```
	if strings.HasPrefix(s, "```") {
		// Find the end of the opening fence line
		newline := strings.Index(s, "\n")
		if newline != -1 {
			s = s[newline+1:]
		} else {
			// Entire content is just the fence marker — strip it
			s = strings.TrimPrefix(s, "```json")
			s = strings.TrimPrefix(s, "```JSON")
			s = strings.TrimPrefix(s, "```")
		}
	}

	// Remove closing fence
	if strings.HasSuffix(strings.TrimSpace(s), "```") {
		idx := strings.LastIndex(s, "```")
		if idx != -1 {
			s = s[:idx]
		}
	}

	return strings.TrimSpace(s)
}

// unmarshalRobust strips markdown fences from data then unmarshals it into v.
// This handles LLMs that return ```json ... ``` despite being instructed to return plain JSON.
func unmarshalRobust(data string, v any) error {
	clean := stripFences(data)
	return json.Unmarshal([]byte(clean), v)
}
