#!/bin/bash

# Configuration
TARGET_DIR="assets"
QUALITY=75 

echo "📸 Incepem SUPER-optimizarea fisierelor imense din '$TARGET_DIR'..."

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo "❌ Eroare: Convertorul WebP nu este instalat."
    exit 1
fi

count=0

# Acum scanam si convertim/strivim si imaginile .webp vechi!
for file in "$TARGET_DIR"/*.{jpg,jpeg,png,JPG,JPEG,PNG,webp,WEBP}; do
    # Ensure the file actually exists
    if [ -f "$file" ]; then
        filename=$(basename -- "$file")
        name="${filename%.*}"
        dest_path="$TARGET_DIR/$name.webp"
        tmp_path="$TARGET_DIR/${name}_tmp.webp"
        
        # Oprim optimizarea recurenta, doar daca este raw (peste 800kb) umblam la el
        filesize=$(wc -c < "$file" | tr -d ' ')

        # Daca poza e mai mare de ~800 KB, o micsoram fizic la max 1600 latime. 
        if [ "$filesize" -gt 800000 ]; then
            echo "   ⏳ Scalam si compresam fisierul MARE: $filename ($filesize bytes)..."
            cwebp -quiet -q $QUALITY -resize 1600 0 "$file" -o "$tmp_path"
            
            if [ $? -eq 0 ]; then
                # Daca a convers, il stergem pe cel initial si il punem pe cel gata pe pozitie!
                if [ "$file" != "$dest_path" ]; then
                    rm "$file"
                fi
                mv "$tmp_path" "$dest_path"
                count=$((count+1))
                echo "   ✅ Succes! Fisier stors imens la cativa kb."
            else
                echo "   ❌ Conversia a esuat pentru $filename."
                rm -f "$tmp_path"
            fi
        fi
    fi
done

echo "✅ Gata! $count imagini URIACE au fost reduse strict la format de trafic de date telefoane (si toate ramase in $TARGET_DIR)!"
