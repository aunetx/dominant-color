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
            Utils.setTimeout(this.update_color.bind(this), 100);
            Utils.setTimeout(this.update_color.bind(this), 250);
            Utils.setTimeout(this.update_color.bind(this), 500);
        });
        this.update_color();
        this.remove_panel_corners();
    }

    remove_panel_corners() {
        Main.panel._leftCorner.hide();
        Main.panel._rightCorner.hide();
    }

    reset_panel_corners() {
        Main.panel._leftCorner.show();
        Main.panel._rightCorner.show();
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

        this.apply_color(color);
    }

    bg_color(color) {
        return `background-color:${color};`
    }

    apply_color(color) {
        let color_str = color.to_string().slice(0, -2);

        Main.overview._overview.set_style(this.bg_color(color_str));
        Main.panel.set_style(this.bg_color(color_str));

        let lighter_color = color.lighten();
        let lighter_color_str = lighter_color.to_string().slice(0, -2);

        Main.overview.dash._background.set_style(this.bg_color(lighter_color_str));

        if (Main.overview._overview.controls._appDisplay._folderIcons.length > 0) {
            this.apply_to_appfolder_icons(lighter_color_str);
        }
        Main.overview._overview.controls._appDisplay.disconnect(this.appfolder_icons_id);
        this.appfolder_icons_id = Main.overview._overview.controls._appDisplay.connect('view-loaded', () => {
            this.apply_to_appfolder_icons(lighter_color_str);
        })
    }

    apply_to_appfolder_icons(color) {
        Main.overview._overview.controls._appDisplay._folderIcons.forEach(icon => {
            icon.set_style(this.bg_color(color));
        });
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

        this.reset_panel_corners();

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
