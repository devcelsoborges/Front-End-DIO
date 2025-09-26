#!/usr/bin/env bash
set -e
mkdir -p assets/images
echo "Downloading Spider-Man image (CC BY-SA 2.0)..."
wget -O assets/images/spiderman.jpg https://upload.wikimedia.org/wikipedia/commons/5/52/Spider-Man.jpg
echo "Downloading Spiderman ice sculpture (CC0)..."
wget -O assets/images/spiderman_ice.jpg https://www.publicdomainpictures.net/pictures/20000/velka/spiderman.jpg
echo "Done. Check assets/images/ for files. Remember to review licenses in assets/ATTRIBUTIONS.txt"
