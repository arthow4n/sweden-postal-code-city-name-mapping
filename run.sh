#!/usr/bin/env bash
cd "$(dirname "$0")"
node --experimental-strip-types update.ts
