'use strict';

const { Shell, Gio, Meta, Clutter, GLib } = imports.gi;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utilities;

const EXT_PATH = Me.dir.get_path();
const PY_CMD_PATH = `${EXT_PATH}/script.py`;


class Extension {
    constructor() {
    }

    enable() {
        this.background_settings = new Gio.Settings({ schema: 'org.gnome.desktop.background' });

        if (Main.layoutManager._startingUp)
            this.startup_complete_id = Main.layoutManager.connect('startup-complete', this.on_startup_complete.bind(this));
        else
            this.on_startup_complete();
    }

    on_startup_complete() {
        this.background_changed_id = this.background_settings.connect('changed', () => {
            this.bg_notify_id = Main.layoutManager._backgroundGroup.get_child_at_index(0).connect('notify', this.on_bg_changed.bind(this))
        });
        this.update_color();
    }

    on_bg_changed() {
        this.update_color();
        Main.layoutManager._backgroundGroup.get_child_at_index(0).disconnect(this.bg_notify_id);
    }

    update_color() {
        try {
            var wallpaper_path = Main.layoutManager._backgroundGroup.get_child_at_index(0).get_content().background._file.get_path();
        } catch (e) {
            this._log(`could not find wallpaper path: \n${e} `);
            return
        }

        Utils.spawnCommandLineAsync(`python ${PY_CMD_PATH} ${wallpaper_path}`,
            (ok, stdout, stderr, status) => {
                if (ok) {
                    if (status == 0) {
                        this.set_color_from(stdout);
                    }
                    else
                        this._log(`error in python script: \n${stderr}`);
                } else
                    this._log(`error calling python script: \n${stderr}`);
            }
        );
    }

    set_color_from(output) {
        let color_parse = Clutter.color_from_string(output.toString());

        if (!color_parse[0]) {
            this._log(`could not parse color ${output.toString()}`);
            return
        }

        let color = this.transform_color(color_parse[1].to_hls());

        Main.overview._overview.set_background_color(color);
        Main.panel.set_background_color(color);
    }

    transform_color([hue, lightness, saturation]) {
        let h = hue
        let l = Math.max(0.12, Math.min(0.2, 0.15 + (lightness - 0.4) / 5))
        let s = saturation / 2.7

        let color = Clutter.color_from_hls(h, l, s);
        color.alpha = 255;

        return color
    }

    disable() {
        this.background_settings.disconnect(this.background_changed_id);
        Main.layoutManager.disconnect(this.startup_complete_id);

        Main.overview._overview.set_background_color(null);
        Main.panel.set_background_color(null);

        delete this.background_settings;
        delete this.startup_complete_id;
        delete this.background_changed_id;
    }

    _log(str) {
        log(`[Dominant color] ${str} `);
    }
}

function init() {
    return new Extension();
}
