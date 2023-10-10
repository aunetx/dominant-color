UUID = dominant-color@aunetx

.PHONY: build install remove clean


build: clean
	mkdir -p build/
	cd src && gnome-extensions pack -f \
		--extra-source=../metadata.json \
		--extra-source=./color_manager.js \
		--extra-source=./stylesheet_manager.js \
		-o ../build


install: build remove
	gnome-extensions install -f build/$(UUID).shell-extension.zip


remove:
	rm -rf $(HOME)/.local/share/gnome-shell/extensions/$(UUID)/


clean:
	rm -rf build/
