#!/usr/bin/env bash
cd "$(dirname $0)"
deno run --allow-net --allow-read=./fetchStates.json,./postalcodes.json --allow-write=./fetchStates.json,./postalcodes.json update.ts
