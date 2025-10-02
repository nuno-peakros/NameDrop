#!/bin/bash

# Create new feature specification script
# Usage: ./create-new-feature.sh --json "feature description"

set -e

# Parse arguments
FEATURE_DESCRIPTION=""
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    *)
      FEATURE_DESCRIPTION="$1"
      shift
      ;;
  esac
done

# Generate branch name and spec file path
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
# Create shorter branch name (max 50 chars)
SHORT_DESC=$(echo "$FEATURE_DESCRIPTION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-\|-$//g' | cut -c1-30)
BRANCH_NAME="feature/$SHORT_DESC-$TIMESTAMP"
SPEC_FILE=".specify/specs/namedrop-initial-ui-auth-$TIMESTAMP.md"

# Create specs directory if it doesn't exist
mkdir -p .specify/specs

# Create and checkout new branch
git checkout -b "$BRANCH_NAME"

# Initialize spec file
touch "$SPEC_FILE"

if [ "$JSON_OUTPUT" = true ]; then
  echo "{\"BRANCH_NAME\":\"$BRANCH_NAME\",\"SPEC_FILE\":\"$SPEC_FILE\"}"
else
  echo "Created branch: $BRANCH_NAME"
  echo "Spec file: $SPEC_FILE"
fi