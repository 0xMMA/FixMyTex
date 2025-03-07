#!/bin/bash

# Script to create a new version tag and push it to trigger the release workflow

# Check if a version is provided
if [ -z "$1" ]; then
  echo "Usage: ./create_release.sh <version>"
  echo "Example: ./create_release.sh 1.0.0-alpha"
  exit 1
fi

VERSION="$1"
TAG="v$VERSION"

# Confirm with the user
echo "This will create and push tag: $TAG"
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
  echo "Operation cancelled."
  exit 0
fi

# Create the tag
git tag -a "$TAG" -m "Release $TAG"

# Push the tag to trigger the release workflow
git push origin "$TAG"

echo "Tag $TAG created and pushed."
echo "The release workflow should start automatically."
echo "Check GitHub Actions to monitor progress: https://github.com/0xMMA/FixMyTex/actions"