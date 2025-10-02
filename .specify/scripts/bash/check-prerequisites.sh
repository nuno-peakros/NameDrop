#!/bin/bash

# Check prerequisites for task generation
# Usage: ./check-prerequisites.sh --json

set -e

# Parse arguments
JSON_OUTPUT=false

while [[ $# -gt 0 ]]; do
  case $1 in
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    *)
      shift
      ;;
  esac
done

# Set feature directory
FEATURE_DIR=".specify/specs"

# Check for available documents
AVAILABLE_DOCS=()

# Check for plan.md (implementation plan)
if [ -f ".specify/plans/namedrop-implementation-plan-20250102.md" ]; then
  AVAILABLE_DOCS+=("plan.md")
fi

# Check for data-model.md
if [ -f "$FEATURE_DIR/data-model.md" ]; then
  AVAILABLE_DOCS+=("data-model.md")
fi

# Check for contracts directory
if [ -d "$FEATURE_DIR/contracts" ]; then
  AVAILABLE_DOCS+=("contracts/")
fi

# Check for research.md
if [ -f "$FEATURE_DIR/research.md" ]; then
  AVAILABLE_DOCS+=("research.md")
fi

# Check for quickstart.md
if [ -f "$FEATURE_DIR/quickstart.md" ]; then
  AVAILABLE_DOCS+=("quickstart.md")
fi

# Convert array to JSON format
DOCS_JSON=$(printf '%s\n' "${AVAILABLE_DOCS[@]}" | jq -R . | jq -s .)

if [ "$JSON_OUTPUT" = true ]; then
  echo "{\"FEATURE_DIR\":\"$FEATURE_DIR\",\"AVAILABLE_DOCS\":$DOCS_JSON}"
else
  echo "Feature Directory: $FEATURE_DIR"
  echo "Available Documents:"
  for doc in "${AVAILABLE_DOCS[@]}"; do
    echo "  - $doc"
  done
fi