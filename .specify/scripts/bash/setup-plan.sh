#!/bin/bash

# Setup implementation planning workflow script
# Usage: ./setup-plan.sh --json

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

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# Check if we're on a feature branch
if [[ ! "$CURRENT_BRANCH" =~ ^[0-9]+- ]]; then
  echo "ERROR: Not on a feature branch. Current branch: $CURRENT_BRANCH" >&2
  echo "Feature branches should be named like: 001-feature-name" >&2
  exit 1
fi

# Set up paths
FEATURE_SPEC=".specify/specs/namedrop-initial-ui-auth-20251002_124745.md"
IMPL_PLAN=".specify/plans/namedrop-implementation-plan-20250102.md"
SPECS_DIR=".specify/specs"
BRANCH="$CURRENT_BRANCH"

# Create directories if they don't exist
mkdir -p .specify/plans
mkdir -p .specify/memory
mkdir -p .specify/templates

if [ "$JSON_OUTPUT" = true ]; then
  echo "{\"FEATURE_SPEC\":\"$FEATURE_SPEC\",\"IMPL_PLAN\":\"$IMPL_PLAN\",\"SPECS_DIR\":\"$SPECS_DIR\",\"BRANCH\":\"$BRANCH\"}"
else
  echo "Feature Spec: $FEATURE_SPEC"
  echo "Implementation Plan: $IMPL_PLAN"
  echo "Specs Directory: $SPECS_DIR"
  echo "Branch: $BRANCH"
fi