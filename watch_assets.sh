#!/bin/bash

# Folder to watch pe Server Ubuntu
WATCH_DIR="assets"
QUALITY=75 

# Check if cwebp is installed
if ! command -v cwebp &> /dev/null; then
    echo "❌ Error: WebP converter is not installed pe acest Ubuntu."
    echo "Pentru a instala acum, rulează: sudo apt-get install webp"
    exit 1
fi

mkdir -p "$WATCH_DIR"

echo "👀 Server activ: Scanam in timp real '$WATCH_DIR' pentru poze..."
echo "Orice tragi aici va fi convertit, micsorat la minim 800kb si șters din forma initiala."
echo "Procesul e continuu... (Apasa Ctrl+C ca sa-l opresti din terminal)"
echo "---------------------------------------------------------------"

while true; do
    # Acum scaneaza MEREU inclusiv WebP-urile urioase deja existente pe server!!
    for file in "$WATCH_DIR"/*.{jpg,jpeg,png,JPG,JPEG,PNG,webp,WEBP}; do
        if [ -f "$file" ]; then
            filename=$(basename -- "$file")
            name="${filename%.*}"
            # Extragem extensia in mod sigur
            ext="${filename##*.}"
            # Transformam extensia in litere mici sa fim precauti
            ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
            
            dest_path="$WATCH_DIR/$name.webp"
            tmp_path="$WATCH_DIR/${name}_tmp.webp"
            
            # Calculam marimea fisierului
            filesize=$(wc -c < "$file" | tr -d ' ')
            
            # PROTECTIE ANTI-BUCLA INFINITA! 
            # Daca e deja .webp SI are o greutate perfect normala pt web (sub 800kb), O IGNORAM. 
            # Asta asigura ca nu strivim continuu aceeasi poza din memorie!
            if [ "$ext_lower" == "webp" ] && [ "$filesize" -le 800000 ]; then
                continue
            fi
            
            echo "⏳ Prinsa la optimizat: $filename. ($filesize bytes)..."
            
            if [ "$filesize" -gt 800000 ]; then
                echo "   -> Poza MASIVA ( > 800kb)! Se REDIMENSIONEAZA FORTAT marginile la lățimea de 1600!..."
                cwebp -quiet -q $QUALITY -resize 1600 0 "$file" -o "$tmp_path"
            else
                echo "   -> Se transforma restul de format in WEBP curat cu 75% calitate..."
                cwebp -quiet -q $QUALITY "$file" -o "$tmp_path"
            fi
            
            # Daca operatiunea de macel a avut succes:
            if [ $? -eq 0 ]; then
                # Daca sursa era altceva in afara de .webp o stergem raw
                if [ "$file" != "$dest_path" ]; then
                    rm "$file"
                fi
                # Mutam varianta cea noua de 200kb de la cwebp si o facem vizibila aplicatiei
                mv "$tmp_path" "$dest_path"
                echo "✅ Gata! $filename este facut farame și salvat!"
            else
                echo "❌ Eroare severa la cwebp! Fisierul $filename e blocat."
                rm -f "$tmp_path"
            fi
            echo "---------------------------------------------------------------"
        fi
    done
    
    sleep 3
done
