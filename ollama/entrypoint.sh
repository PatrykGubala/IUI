#!/bin/sh
set -e

ollama serve &
pid="$!"

sleep 5
ollama pull nomic-embed-text

wait "$pid"
