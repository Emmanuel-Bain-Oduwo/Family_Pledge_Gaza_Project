#!/bin/bash
set -e

# 1. Add demo seed production guard
cat << 'INNER_EOF' > scripts/seed_demo_content.py
"""
Seed safe owner-demo data for Family Pled...[truncated]
