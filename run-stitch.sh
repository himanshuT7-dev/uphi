#!/bin/bash
export STITCH_API_KEY="${STITCH_API_KEY:-your_key_here}"
export GOOGLE_CLOUD_PROJECT="uphi-college-project"
exec ./node_modules/.bin/kof-stitch-mcp