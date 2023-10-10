import Clutter from 'gi://Clutter';
import GdkPixbuf from 'gi://GdkPixbuf';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
const Signals = imports.signals;

export const ColorManager = class ColorManager {
    constructor() {
        this.original_color = null;
        this.color = null;
    }

    update_color() {
        let wall = Main.layoutManager._backgroundGroup.get_child_at_index(0);

        if (!wall) {
            this._log(`could not get wallpaper`);
            return;
        }

        let wall_path = wall.get_content().background._file.get_path();
        let texture = GdkPixbuf.Pixbuf.new_from_file(wall_path);
        let scaled = texture.scale_simple(1, 1, 2);

        let pixel = scaled.pixel_bytes.toArray();
        let red = pixel[0];
        let green = pixel[1];
        let blue = pixel[2];

        this.set_color_from(red, green, blue);
    }

    set_color_from(red, green, blue) {
        this.original_color = new Clutter.Color({ red, green, blue });
        this.color = this.transform_color(this.original_color.to_hls());

        this.emit('color-changed', true);
    }

    get color_str() {
        return this.color.to_string().slice(0, -2);
    }

    transform_color([hue, lightness, saturation]) {
        let h = hue;
        let l = Math.max(0.12, Math.min(0.2, 0.15 + (lightness - 0.4) / 5));
        let s = saturation / 2.7;

        let color = Clutter.color_from_hls(h, l, s);
        color.alpha = 255;

        return color;
    }

    _log(str) {
        console.log(`[Dominant color] ${str}`);
    }
};

Signals.addSignalMethods(ColorManager.prototype);
