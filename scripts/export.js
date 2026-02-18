name: Auto Export Archi
on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'

      - name: Install Xvfb
        run: |
          sudo apt-get update -y
          sudo apt-get install -y xvfb

      - name: Download Archi
        run: |
          wget https://github.com/archimatetool/archi.io/releases/download/5.7.0/Archi-Linux64-5.7.0.tgz
          tar -xzf Archi-Linux64-5.7.0.tgz
          chmod +x Archi/Archi

      - name: Run Archi Export
        run: |
          xvfb-run --auto-servernum Archi/Archi \
            -application com.archimatetool.commandline.app \
            -consoleLog \
            -nosplash \
            --loadModel model \
            --script.runScript scripts/export.ajs \
            2>&1 | tee archi-output.log
          echo "=== Hasil export ==="
          find docs/diagrams/ -type f || echo "Folder docs/diagrams tidak ditemukan"

      - name: Commit & Push Diagrams
        run: |
          git config --global user.name "github-actions"
          git config --global user.email "actions@github.com"

          git add -f docs/diagrams/

          if git diff --cached --quiet; then
            echo "Tidak ada perubahan, skip commit."
          else
            git commit -m "Auto export diagrams"
            git push
          fi
