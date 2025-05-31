#!/bin/bash
cd ~/Projects/real-estate-investor-site
git add .
git commit -m "Auto-update: $(date '+%Y-%m-%d %H:%M:%S')"
git push origin main
